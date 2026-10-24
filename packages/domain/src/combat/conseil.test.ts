import { describe, expect, it } from 'vitest';
import { scenario, type Scenario } from './aide-tests.ts';
import { choisirActionBatchDeNuit } from './bot.ts';
import { choisirActionStagiaire } from './bot-stagiaire.ts';
import { conseiller } from './conseil.ts';
import { DECKS_PRETES } from './decks.ts';
import { jouerPartie, simulerCroise, type Strategie } from './simulation.ts';
import type { EtatPartie } from './types.ts';
import { vueDe } from './vue.ts';

const conseil = (s: Scenario, modifier?: (e: EtatPartie) => void) => {
  const etat = scenario(s);
  modifier?.(etat);
  return conseiller(vueDe(etat, 'j1'));
};

/** Un joueur qui suit toujours le conseil. */
const suivreLeConseil: Strategie = (vue) => conseiller(vue)?.action ?? { type: 'finirTour' };

describe('conseiller (US-066)', () => {
  it('conseille de poser la carte la plus forte que le Débit permet, ou la seule possible', () => {
    expect(conseil({ main: [4, 17, 41], debit: 3 })).toEqual({
      action: { type: 'poser', carte: 'm2' },
      explication: 'Posez SOAP / WSDL : c’est la carte la plus forte que votre Débit permet.',
    });
    expect(conseil({ main: [22], debit: 3 })?.explication).toMatch(
      /^Posez API REST : votre Débit le permet/,
    );
  });

  it('conseille une évolution d’abord', () => {
    expect(conseil({ main: [41, 26], plateau: [9], debit: 5 })).toEqual({
      action: { type: 'evoluer', carte: 'm2', origine: 'a1' },
      explication: expect.stringMatching(
        /^Faites évoluer webMethods Integration Server 10\.15 en webMethods\.io : /,
      ),
    });
  });

  it('dit quand une attaque sur le SI fait gagner la partie', () => {
    const c = conseil({ plateau: [41], plateauAdverse: [16] }, (e) => {
      e.joueurs.j2.sla = 6;
    });
    expect(c?.action).toEqual({ type: 'attaquer', attaquant: 'a1', cible: 'si' });
    expect(c?.explication).toBe(
      'Attaquez le SI adverse avec LLM : ses 6 points d’attaque font tomber son SLA à 0, vous gagnez.',
    );
  });

  it('explique la Garde et la riposte quand il faut détruire un composant d’abord', () => {
    expect(conseil({ plateau: [41], plateauAdverse: [13] })).toEqual({
      action: { type: 'attaquer', attaquant: 'a1', cible: 'b1' },
      explication:
        'Attaquez Adaptateur SAP avec LLM : il a Garde et protège le SI ; votre LLM le détruit et survit à sa riposte.',
    });
  });

  it('conseille le SI quand aucun composant ne vaut la peine d’être attaqué', () => {
    expect(conseil({ plateau: [22], plateauAdverse: [17] })?.explication).toBe(
      'Attaquez le SI adverse avec API REST : rien ne le protège, et il perd 3 points de SLA.',
    );
  });

  it('conseille de finir son tour plutôt qu’une attaque perdante, en le disant', () => {
    expect(conseil({ plateau: [4], plateauAdverse: [18] })).toEqual({
      action: { type: 'finirTour' },
      explication:
        'Finissez votre tour : vos attaques possibles vous feraient perdre plus qu’elles ne rapportent.',
    });
    expect(conseil({ main: [41], debit: 0 })?.explication).toBe(
      'Finissez votre tour : il ne vous reste rien d’utile à faire.',
    );
  });

  it('explique un décommissionnement par la carte qu’il permet de poser', () => {
    expect(conseil({ main: [15, 22], debit: 0 })).toEqual({
      action: { type: 'decommissionner', carte: 'm2' },
      explication: 'Décommissionnez API REST : le Débit gagné vous permet de poser Flow service.',
    });
  });

  it('explique un sort par son effet', () => {
    const c = conseil({ main: [54], debit: 2 }, (e) => {
      e.joueurs.j1.sla = 6;
    });
    expect(c?.action).toEqual({ type: 'jouer', carte: 'm1', cibles: [] });
    expect(c?.explication).toMatch(/^Jouez Circuit Breaker : [a-z]/);
  });

  it('ne conseille rien pendant le tour adverse ni une fois la partie finie', () => {
    expect(conseiller(vueDe(scenario({ plateau: [22] }), 'j2'))).toBeNull();
  });

  it('suit exactement les règles de Batch de nuit, avec une explication à chaque coup', () => {
    const [heritage, moderne] = DECKS_PRETES;
    if (!heritage || !moderne) throw new Error('decks prêtés manquants');
    const verifier: Strategie = (vue) => {
      const c = conseiller(vue);
      expect(c?.action).toEqual(choisirActionBatchDeNuit(vue));
      expect(c?.explication.length).toBeGreaterThan(20);
      return c?.action ?? { type: 'finirTour' };
    };
    for (let graine = 1; graine <= 4; graine++) {
      const fin = jouerPartie({ j1: heritage.cartes, j2: moderne.cartes }, graine, {
        j1: verifier,
        j2: choisirActionStagiaire,
      });
      expect(fin.issue).not.toBeNull();
    }
  });

  it('fait gagner contre Stagiaire au moins 85 % du temps, et contre Batch de nuit au moins 45 %', () => {
    const decks = DECKS_PRETES.map((d) => d.cartes);
    const stagiaire = simulerCroise(decks, 10, 1, suivreLeConseil, choisirActionStagiaire);
    expect(stagiaire.victoiresA / stagiaire.parties).toBeGreaterThanOrEqual(0.85);
    const batch = simulerCroise(decks, 10, 1, suivreLeConseil, choisirActionBatchDeNuit);
    expect(batch.victoiresA / batch.parties).toBeGreaterThanOrEqual(0.45);
  });

  it('se calcule en bien moins de 200 ms', () => {
    const vue = vueDe(
      scenario({ main: [4, 17, 41, 54], plateau: [41, 22], plateauAdverse: [13, 18] }),
      'j1',
    );
    const debut = performance.now();
    for (let i = 0; i < 100; i++) conseiller(vue);
    expect((performance.now() - debut) / 100).toBeLessThan(200);
  });
});
