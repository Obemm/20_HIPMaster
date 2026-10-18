import { describe, expect, it } from 'vitest';
import { codeErreur, jouer, pv, scenario } from './aide-tests.ts';
import { combinaisonsCibles } from './effets.ts';
import { actionsPossibles } from './possibles.ts';
import { jouerPartie } from './simulation.ts';
import { choisirActionBatchDeNuit } from './bot.ts';
import type { EtatPartie } from './types.ts';
import { vueDe } from './vue.ts';

const finir = (etat: EtatPartie) => jouer(etat, { type: 'finirTour' });
/** Fin du tour de j1, tour de j2 sans rien faire, puis retour à j1. */
const tourComplet = (etat: EtatPartie) => finir(finir(etat));

describe('Autonome et Orchestration', () => {
  it('un agent n’attaque pas sur ordre, mais seul au début du tour de son propriétaire', () => {
    const etat = scenario({ plateau: [42] });
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
    const apres = tourComplet(etat);
    expect(apres.joueurs.j2.sla).toBe(16);
  });

  it('un agent autonome respecte Garde', () => {
    const apres = tourComplet(scenario({ plateau: [42], plateauAdverse: [13] }));
    expect(apres.joueurs.j2.sla).toBe(20);
    expect(pv(apres, 'j2', 'b1')).toBe(1);
  });

  it('avec Orchestration, l’agent attaque sur ordre et plus seul', () => {
    const etat = scenario({ plateau: [42, 43] });
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBeNull();
    expect(tourComplet(etat).joueurs.j2.sla).toBe(20);
  });
});

describe('Délégation', () => {
  it('une fois par tour, un agent attaque une seconde fois', () => {
    let etat = scenario({ plateau: [42, 42, 43, 45] });
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' });
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' });
    expect(etat.joueurs.j2.sla).toBe(12);
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a2', cible: 'si' });
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a2', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
  });
});

describe('Outillage', () => {
  it('vos agents empruntent les capacités d’un composant non IA, jusqu’à la fin du tour', () => {
    const etat = scenario({ plateau: [42, 43, 44, 7] });
    expect(actionsPossibles(etat).filter((a) => a.type === 'outiller')).toEqual([
      { type: 'outiller', source: 'a4' },
    ]);
    const outille = jouer(etat, { type: 'outiller', source: 'a4' });
    expect(outille.joueurs.j1.plateau[0]?.capacitesEmpruntees).toEqual(['garde']);
    expect(codeErreur(outille, { type: 'outiller', source: 'a4' })).toBe('cible-invalide');
    expect(tourComplet(outille).joueurs.j1.plateau[0]?.capacitesEmpruntees).toEqual([]);
  });

  it('n’est pas proposé sans agent en jeu', () => {
    const etat = scenario({ plateau: [44, 7] });
    expect(actionsPossibles(etat).some((a) => a.type === 'outiller')).toBe(false);
  });
});

describe('Contexte', () => {
  it('+1 attaque par tranche de 2 cartes dans la défausse, +3 au plus', () => {
    const etat = scenario({ plateau: [46] });
    etat.joueurs.j1.defausse = Array.from({ length: 5 }, (_, i) => ({ id: `d${i}`, numero: 4 }));
    expect(vueDe(etat, 'j1').moi.plateau[0]?.attaque).toBe(4);
    etat.joueurs.j1.defausse = Array.from({ length: 12 }, (_, i) => ({ id: `d${i}`, numero: 4 }));
    expect(vueDe(etat, 'j1').moi.plateau[0]?.attaque).toBe(5);
  });
});

describe('Apigee AI Gateway : Garde-fous, Cache sémantique, Routage multi-modèles', () => {
  it('Garde-fous protège vos composants IA d’Hallucination et de Prompt injection', () => {
    expect(
      combinaisonsCibles(scenario({ main: [63], plateauAdverse: [40, 41] }), 'j1', 63),
    ).toEqual([]);
    expect(
      combinaisonsCibles(scenario({ main: [59], plateauAdverse: [40, 42] }), 'j1', 59),
    ).toEqual([]);
  });

  it('Cache sémantique : le premier sort IA du tour ne coûte rien', () => {
    let etat = scenario({ main: [52, 52], plateau: [40, 41], debit: 1 });
    etat = jouer(etat, { type: 'jouer', carte: 'm1', cibles: ['a2'] });
    expect(etat.joueurs.j1.debit).toBe(1);
    etat = jouer(etat, { type: 'jouer', carte: 'm2', cibles: ['a2'] });
    expect(etat.joueurs.j1.debit).toBe(0);
  });

  it('Routage : renvoie un composant IA en main et pose gratuitement un composant IA moins cher', () => {
    const etat = scenario({ main: [42, 41], plateau: [40, 41], debit: 0 });
    expect(actionsPossibles(etat).filter((a) => a.type === 'router')).toEqual([
      { type: 'router', retour: 'a2', carte: 'm1' },
      { type: 'router', retour: 'a2', carte: 'm2' },
    ]);
    const apres = jouer(etat, { type: 'router', retour: 'a2', carte: 'm1' });
    expect(apres.joueurs.j1.plateau.map((c) => c.id)).toEqual(['a1', 'm1']);
    expect(apres.joueurs.j1.main.map((c) => c.id)).toEqual(['m2', 'a2']);
    expect(codeErreur(apres, { type: 'router', retour: 'm1', carte: 'm2' })).toBe('cible-invalide');
  });
});

describe('Migration (SFTP)', () => {
  it('remplace SFTP par un composant API ou EDA de la main, 2 Débit moins cher', () => {
    const etat = scenario({ main: [18, 4], plateau: [2], debit: 2 });
    expect(actionsPossibles(etat).filter((a) => a.type === 'migrer')).toEqual([
      { type: 'migrer', source: 'a1', carte: 'm1' },
    ]);
    const apres = jouer(etat, { type: 'migrer', source: 'a1', carte: 'm1' });
    expect(apres.joueurs.j1.plateau.map((c) => [c.id, c.numero])).toEqual([['m1', 18]]);
    expect(apres.joueurs.j1.debit).toBe(0);
    expect(apres.joueurs.j1.defausse.map((c) => c.id)).toContain('a1');
  });
});

describe('Solace Agent Mesh', () => {
  it('donne Délégation et Outillage à vos agents', () => {
    let etat = scenario({ main: [39], plateau: [31, 42, 43, 7] });
    etat = jouer(etat, { type: 'evoluer', carte: 'm1', origine: 'a1' });
    expect(actionsPossibles(etat)).toContainEqual({ type: 'outiller', source: 'a4' });
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a2', cible: 'si' });
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a2', cible: 'si' })).toBeNull();
  });
});

describe('parties avec les cartes IA', () => {
  it('des parties bot contre bot avec agents et évolutions IA se terminent sans action illégale', () => {
    const ia = [42, 42, 43, 44, 45, 46, 46, 41, 50, 50, 39, 31, 40, 18, 2, 22, 22, 52, 51, 63];
    for (let graine = 1; graine <= 8; graine++) {
      const fin = jouerPartie({ j1: ia, j2: [...ia].reverse() }, graine, {
        j1: choisirActionBatchDeNuit,
        j2: choisirActionBatchDeNuit,
      });
      expect(fin.issue, `graine ${graine}`).not.toBeNull();
    }
  });
});
