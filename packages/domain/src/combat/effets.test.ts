import { describe, expect, it } from 'vitest';
import { codeErreur, jouer, pv, scenario, type Scenario } from './aide-tests.ts';
import { combinaisonsCibles, EFFETS } from './effets.ts';
import { actionsPossibles } from './possibles.ts';
import { SORTS_ET_INCIDENTS_PRIS_EN_CHARGE } from './prise-en-charge.ts';
import type { Cible, EtatPartie } from './types.ts';
import { vueDe } from './vue.ts';

/** j1 joue la carte m1 de sa main sur les cibles données. */
const lancer = (s: Scenario, cibles: Cible[] = [], modifier?: (e: EtatPartie) => void) => {
  const etat = scenario(s);
  modifier?.(etat);
  return jouer(etat, { type: 'jouer', carte: 'm1', cibles });
};
const finir = (etat: EtatPartie) => jouer(etat, { type: 'finirTour' });
const statuts = (etat: EtatPartie) =>
  etat.journal.filter((e) => e.type === 'statut').map((e) => e.type === 'statut' && e.statut);

describe('jouer un sort ou un incident', () => {
  it('paie le coût, défausse la carte et note le jeu dans le journal', () => {
    const apres = lancer({ main: [55], plateauAdverse: [16], debit: 3 }, ['b1']);
    expect(apres.joueurs.j1.debit).toBe(2);
    expect(apres.joueurs.j1.main).toEqual([]);
    expect(apres.joueurs.j1.defausse.map((c) => c.id)).toEqual(['m1']);
    expect(apres.journal[0]).toMatchObject({ type: 'jeu', joueur: 'j1', cibles: ['b1'] });
  });

  it('refuse un composant, un manque de Débit et des cibles qui ne conviennent pas', () => {
    expect(codeErreur(scenario({ main: [22] }), { type: 'jouer', carte: 'm1', cibles: [] })).toBe(
      'mauvais-type',
    );
    const pauvre = scenario({ main: [53], debit: 2 });
    expect(codeErreur(pauvre, { type: 'jouer', carte: 'm1', cibles: [] })).toBe(
      'debit-insuffisant',
    );
    const etat = scenario({ main: [55], plateau: [22], plateauAdverse: [16] });
    expect(codeErreur(etat, { type: 'jouer', carte: 'm1', cibles: ['a1'] })).toBe('cible-invalide');
    expect(codeErreur(etat, { type: 'jouer', carte: 'm1', cibles: [] })).toBe('cible-invalide');
  });

  it('couvre exactement les sorts et incidents déclarés pris en charge', () => {
    expect([...EFFETS.keys()].sort((a, b) => a - b)).toEqual(
      [...SORTS_ET_INCIDENTS_PRIS_EN_CHARGE].sort((a, b) => a - b),
    );
  });

  it('propose chaque combinaison de cibles, sans doublon quand l’ordre ne compte pas', () => {
    const etat = scenario({ main: [62], plateauAdverse: [16, 17, 22] });
    expect(combinaisonsCibles(etat, 'j1', 62)).toEqual([
      ['b1', 'b2'],
      ['b1', 'b3'],
      ['b2', 'b3'],
    ]);
    expect(actionsPossibles(etat).filter((a) => a.type === 'jouer')).toHaveLength(3);
    expect(combinaisonsCibles(scenario({ main: [55] }), 'j1', 55)).toEqual([]);
  });
});

describe('sorts', () => {
  it('Rate limiting : le composant visé ne peut pas attaquer au prochain tour de son camp', () => {
    let etat = finir(lancer({ main: [21], plateauAdverse: [17] }, ['b1']));
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'b1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
    etat = finir(finir(etat));
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'b1', cible: 'si' })).toBeNull();
  });

  it('Mapping de données : +1 PV ; Chain of thought : piochez 2 cartes', () => {
    expect(pv(lancer({ main: [30], plateau: [22] }, ['a1']), 'j1', 'a1')).toBe(3);
    const pioche = lancer({ main: [47], pioche: [4, 4, 4] });
    expect(pioche.joueurs.j1.main.map((c) => c.id)).toEqual(['p1', 'p2']);
  });

  it('Prompt système : +2 attaque à un agent ; Few-shot : +1/+1 à un composant IA', () => {
    const agent = lancer({ main: [51], plateau: [42] }, ['a1']);
    expect(vueDe(agent, 'j1').moi.plateau[0]?.attaque).toBe(6);
    expect(combinaisonsCibles(scenario({ main: [51], plateau: [22] }), 'j1', 51)).toEqual([]);
    const llm = lancer({ main: [52], plateau: [41] }, ['a1']);
    expect(vueDe(llm, 'j1').moi.plateau[0]).toMatchObject({ attaque: 7, pv: 5 });
  });

  it('Dead Letter Queue : un composant de la défausse revient en jeu avec 1 PV, sans attaquer ce tour', () => {
    const apres = lancer({ main: [53] }, ['d1'], (e) => {
      e.joueurs.j1.defausse = [{ id: 'd1', numero: 17 }];
    });
    expect(apres.joueurs.j1.plateau.map((c) => [c.id, c.pv])).toEqual([['d1', 1]]);
    expect(apres.journal.some((e) => e.type === 'rappel')).toBe(true);
    expect(codeErreur(apres, { type: 'attaquer', attaquant: 'd1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
  });

  it('Circuit Breaker : le SI ne perd aucun SLA pendant le tour adverse', () => {
    const etat = finir(lancer({ main: [54], plateauAdverse: [17] }));
    const apres = jouer(etat, { type: 'attaquer', attaquant: 'b1', cible: 'si' });
    expect(apres.joueurs.j1.sla).toBe(20);
    expect(apres.journal.some((e) => e.type === 'si-protege')).toBe(true);
  });

  it('Content-Based Router : 2 dégâts ; Splitter : 1 dégât à chaque composant adverse', () => {
    expect(pv(lancer({ main: [55], plateauAdverse: [17] }, ['b1']), 'j2', 'b1')).toBe(2);
    const split = lancer({ main: [56], plateauAdverse: [17, 4, 16] });
    expect(split.joueurs.j2.plateau.map((c) => [c.id, c.pv])).toEqual([
      ['b1', 3],
      ['b3', 2],
    ]);
  });

  it('Idempotent Consumer : annule Doublon, sinon fait piocher', () => {
    const annule = lancer({ main: [57], plateau: [22] }, [], (e) => {
      const composant = e.joueurs.j1.plateau[0];
      if (composant) composant.doublon = true;
    });
    expect(annule.joueurs.j1.plateau[0]?.doublon).toBe(false);
    expect(statuts(annule)).toEqual(['doublon-annule']);
    const pioche = lancer({ main: [57], pioche: [4] });
    expect(pioche.joueurs.j1.main.map((c) => c.id)).toEqual(['p1']);
  });

  it('Retry : un composant qui a attaqué attaque de nouveau, et perd 1 PV', () => {
    let etat = scenario({ main: [58], plateau: [17] });
    expect(combinaisonsCibles(etat, 'j1', 58)).toEqual([]);
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' });
    etat = jouer(etat, { type: 'jouer', carte: 'm1', cibles: ['a1'] });
    expect(pv(etat, 'j1', 'a1')).toBe(3);
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' });
    expect(etat.joueurs.j2.sla).toBe(14);
  });

  it('Human-in-the-loop : le prochain incident joué contre vous n’a aucun effet (un sort, si)', () => {
    let etat = finir(lancer({ main: [48], plateau: [17] }));
    etat.joueurs.j2.main = [
      { id: 'x1', numero: 55 },
      { id: 'x2', numero: 68 },
    ];
    etat.joueurs.j2.debit = 5;
    etat = jouer(etat, { type: 'jouer', carte: 'x1', cibles: ['a1'] });
    expect(pv(etat, 'j1', 'a1')).toBe(2);
    etat = jouer(etat, { type: 'jouer', carte: 'x2', cibles: ['a1'] });
    expect(etat.journal.some((e) => e.type === 'parade')).toBe(true);
    expect(pv(etat, 'j1', 'a1')).toBe(2);
    expect(etat.joueurs.j1.parade).toBe(false);
  });
});

describe('incidents', () => {
  it('Prompt injection : l’agent adverse attaque une cible de son propre camp', () => {
    const etat = scenario({ main: [59], plateauAdverse: [42, 16] });
    expect(combinaisonsCibles(etat, 'j1', 59)).toEqual([
      ['b1', 'b2'],
      ['b1', 'si'],
    ]);
    const apres = jouer(etat, { type: 'jouer', carte: 'm1', cibles: ['b1', 'si'] });
    expect(apres.joueurs.j2.sla).toBe(16);
  });

  it('Mot de passe en clair : détruit FTP, blesse de 2 un autre composant Fichiers', () => {
    const ftp = lancer({ main: [60], plateauAdverse: [1, 5] }, ['b1']);
    expect(ftp.joueurs.j2.plateau.map((c) => c.id)).toEqual(['b2']);
    expect(pv(lancer({ main: [60], plateauAdverse: [5] }, ['b1']), 'j2', 'b1')).toBe(1);
    expect(combinaisonsCibles(scenario({ main: [60], plateauAdverse: [22] }), 'j1', 60)).toEqual(
      [],
    );
  });

  it('Certificat expiré : un composant API perd Garde et ne peut pas attaquer, sauf avec OAuth2', () => {
    const apres = lancer({ main: [61], plateau: [17], plateauAdverse: [18] }, ['b1']);
    expect(codeErreur(apres, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBeNull();
    const protege = scenario({ main: [61], plateauAdverse: [18, 20] });
    expect(combinaisonsCibles(protege, 'j1', 61)).toEqual([]);
  });

  it('Couplage fort : quand l’un des deux composants liés est blessé, l’autre aussi', () => {
    let etat = lancer({ main: [62, 55], plateauAdverse: [17, 13] }, ['b1', 'b2']);
    etat = jouer(etat, { type: 'jouer', carte: 'm2', cibles: ['b1'] });
    expect(etat.joueurs.j2.plateau.map((c) => c.pv)).toEqual([2, 3]);
  });

  it('Hallucination : le composant IA attaque au hasard, jamais un Vétéran', () => {
    for (let graine = 1; graine <= 6; graine++) {
      const apres = lancer({ main: [63], plateau: [1], plateauAdverse: [41] }, ['b1'], (e) => {
        e.alea = graine;
      });
      expect(pv(apres, 'j1', 'a1'), `graine ${graine}`).toBe(4);
      expect(apres.joueurs.j1.sla + apres.joueurs.j2.sla).toBe(34);
    }
  });

  it('Message poison : détruit un composant adverse de coût 2 au plus', () => {
    const apres = lancer({ main: [64], plateauAdverse: [22, 17] }, ['b1']);
    expect(apres.joueurs.j2.plateau.map((c) => c.id)).toEqual(['b2']);
    expect(combinaisonsCibles(scenario({ main: [64], plateauAdverse: [17] }), 'j1', 64)).toEqual(
      [],
    );
  });

  it('Timeout : immobilise un composant adverse, sauf un composant IA protégé par Asynchrone', () => {
    const apres = finir(lancer({ main: [65], plateauAdverse: [17] }, ['b1']));
    expect(codeErreur(apres, { type: 'attaquer', attaquant: 'b1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
    const asynchrone = scenario({ main: [65], plateauAdverse: [39, 41] });
    expect(combinaisonsCibles(asynchrone, 'j1', 65)).toEqual([]);
  });

  it('Doublon : le prochain dégât subi est doublé, une seule fois', () => {
    let etat = lancer({ main: [66, 55], plateauAdverse: [13] }, ['b1']);
    etat = jouer(etat, { type: 'jouer', carte: 'm2', cibles: ['b1'] });
    expect(pv(etat, 'j2', 'b1')).toBe(1);
    expect(etat.joueurs.j2.plateau[0]?.doublon).toBe(false);
  });

  it('Fichier vide à 3 h du matin : la prochaine attaque d’un Batch n’inflige rien, sauf avec le .ok', () => {
    const etat = finir(lancer({ main: [67], plateauAdverse: [3] }, ['b1']));
    const apres = jouer(etat, { type: 'attaquer', attaquant: 'b1', cible: 'si' });
    expect(apres.joueurs.j1.sla).toBe(20);
    expect(combinaisonsCibles(scenario({ main: [67], plateauAdverse: [3, 8] }), 'j1', 67)).toEqual(
      [],
    );
  });

  it('Encodage cassé : 2 dégâts à un composant Fichiers ou ESB, pas à une API', () => {
    expect(pv(lancer({ main: [68], plateauAdverse: [17] }, ['b1']), 'j2', 'b1')).toBe(2);
    expect(combinaisonsCibles(scenario({ main: [68], plateauAdverse: [22] }), 'j1', 68)).toEqual(
      [],
    );
  });

  it('Contexte saturé : un composant IA perd ses capacités (ici Garde) jusqu’à la fin de son tour', () => {
    const apres = lancer({ main: [69], plateau: [17], plateauAdverse: [50] }, ['b1']);
    expect(codeErreur(apres, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBeNull();
    const plusTard = finir(finir(apres));
    expect(codeErreur(plusTard, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBe('garde');
  });

  it('Boucle d’agents : un ou deux agents adverses immobilisés', () => {
    const etat = scenario({ main: [70], plateauAdverse: [42, 42] });
    expect(combinaisonsCibles(etat, 'j1', 70)).toEqual([[], ['b1'], ['b1', 'b2'], ['b2']].slice(1));
    const apres = finir(jouer(etat, { type: 'jouer', carte: 'm1', cibles: ['b1', 'b2'] }));
    expect(codeErreur(apres, { type: 'attaquer', attaquant: 'b2', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
  });

  it('Facture de tokens : l’adversaire a 2 Débit de moins à son prochain tour', () => {
    const apres = finir(lancer({ main: [71] }));
    expect(apres.joueurs.j2.debit).toBe(1);
  });
});
