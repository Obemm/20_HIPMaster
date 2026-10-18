import { describe, expect, it } from 'vitest';
import { scenario } from './aide-tests.ts';
import { choisirActionBatchDeNuit } from './bot.ts';
import { DECKS_PRETES, trouverDeckPrete, validerDeck } from './decks.ts';
import { CARTES_PRISES_EN_CHARGE } from './prise-en-charge.ts';
import { jouerPartie, simuler } from './simulation.ts';
import type { Scenario } from './aide-tests.ts';
import { vueDe } from './vue.ts';

const choix = (s: Scenario, modifier?: (e: ReturnType<typeof scenario>) => void) => {
  const etat = scenario(s);
  modifier?.(etat);
  return choisirActionBatchDeNuit(vueDe(etat, 'j1'));
};

describe('validerDeck', () => {
  it('accepte un deck de 20 cartes qui respecte le nombre d’exemplaires', () => {
    expect(validerDeck(DECKS_PRETES[0]?.cartes ?? [])).toEqual([]);
  });

  it('refuse un deck de mauvaise taille, trop d’exemplaires, deux légendaires identiques ou une carte inconnue', () => {
    expect(validerDeck([4, 4])).toEqual([expect.stringContaining('20 cartes')]);
    const troisCsv = [4, 4, 4, ...(DECKS_PRETES[1]?.cartes.slice(3) ?? [])];
    expect(validerDeck(troisCsv)).toEqual(
      expect.arrayContaining(['Fichier CSV : 3 exemplaires, 2 au plus.']),
    );
    const deuxFtp = [1, 1, ...(DECKS_PRETES[0]?.cartes.slice(2) ?? [])];
    expect(validerDeck(deuxFtp)).toEqual(
      expect.arrayContaining(['FTP : 2 exemplaires, 1 au plus.']),
    );
    expect(validerDeck([999, ...(DECKS_PRETES[0]?.cartes.slice(1) ?? [])])).toEqual(
      expect.arrayContaining(['La carte n° 999 n’existe pas.']),
    );
  });
});

describe('decks prêtés', () => {
  it('sont valides et ne contiennent que des cartes que le moteur sait jouer', () => {
    expect(DECKS_PRETES.map((d) => d.id)).toEqual(['heritage', 'moderne', 'hybride']);
    for (const deck of DECKS_PRETES) {
      expect(validerDeck(deck.cartes), deck.nom).toEqual([]);
      expect(
        deck.cartes.every((n) => CARTES_PRISES_EN_CHARGE.includes(n)),
        deck.nom,
      ).toBe(true);
    }
    expect(trouverDeckPrete('moderne')?.nom).toBe('Moderne');
    expect(trouverDeckPrete('inconnu')).toBeUndefined();
  });
});

describe('bot Batch de nuit', () => {
  it('pose d’abord une évolution, sinon la carte la plus chère qu’il peut payer', () => {
    expect(choix({ main: [4, 17, 41], debit: 3 })).toEqual({ type: 'poser', carte: 'm2' });
    expect(choix({ main: [41, 26], plateau: [9], debit: 5 })).toEqual({
      type: 'evoluer',
      carte: 'm2',
      origine: 'a1',
    });
  });

  it('achève le SI quand il le peut', () => {
    const action = choix({ plateau: [41], plateauAdverse: [16] }, (e) => {
      e.joueurs.j2.sla = 6;
    });
    expect(action).toEqual({ type: 'attaquer', attaquant: 'a1', cible: 'si' });
  });

  it('détruit ce qu’il peut détruire en survivant, plutôt que de frapper le SI', () => {
    expect(choix({ plateau: [17], plateauAdverse: [16] })).toEqual({
      type: 'attaquer',
      attaquant: 'a1',
      cible: 'b1',
    });
  });

  it('frappe le SI plutôt qu’un composant qu’il ne peut pas détruire', () => {
    expect(choix({ plateau: [22], plateauAdverse: [17] })).toEqual({
      type: 'attaquer',
      attaquant: 'a1',
      cible: 'si',
    });
  });

  it('n’attaque pas un composant avec Garde s’il y perd sa carte sans le détruire', () => {
    expect(choix({ plateau: [4], plateauAdverse: [18] })).toEqual({ type: 'finirTour' });
  });

  it('décommissionne une carte qu’il ne sait pas jouer, ou pour pouvoir en poser une autre', () => {
    expect(choix({ main: [21, 4], debit: 0 })).toEqual({ type: 'decommissionner', carte: 'm1' });
    // Sacrifier Flow service (1 Débit) ne permet pas de payer l'API REST ; l'inverse, si.
    expect(choix({ main: [15, 22], debit: 0 })).toEqual({ type: 'decommissionner', carte: 'm2' });
    expect(choix({ main: [41], debit: 0 })).toEqual({ type: 'finirTour' });
  });
});

describe('simulation bot contre bot', () => {
  it('joue des parties qui se terminent toutes, sans action illégale', () => {
    const [heritage, moderne] = DECKS_PRETES;
    if (!heritage || !moderne) throw new Error('decks prêtés manquants');
    for (let graine = 1; graine <= 10; graine++) {
      const fin = jouerPartie({ j1: heritage.cartes, j2: moderne.cartes }, graine, {
        j1: choisirActionBatchDeNuit,
        j2: choisirActionBatchDeNuit,
      });
      expect(fin.issue).not.toBeNull();
    }
  });

  it('donne le même résultat pour la même graine, et compte chaque partie une fois', () => {
    const [heritage, , hybride] = DECKS_PRETES;
    if (!heritage || !hybride) throw new Error('decks prêtés manquants');
    const r = simuler(heritage.cartes, hybride.cartes, 12, 3);
    expect(simuler(heritage.cartes, hybride.cartes, 12, 3)).toEqual(r);
    expect(r.victoiresA + r.victoiresB + r.nulles).toBe(12);
    expect(r.toursMoyens).toBeGreaterThan(1);
    expect(r.toursMoyens).toBeLessThanOrEqual(20);
  });
});
