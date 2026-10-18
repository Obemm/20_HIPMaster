import { describe, expect, it } from 'vitest';
import { suivant } from './combat/alea.ts';
import { ouvrirBooster, REGLES_BOOSTERS, stockA, TAILLE_BOOSTER } from './booster.ts';
import { CHANCES_BOOSTER, RARETES } from './rarete.ts';
import { trouverCarte } from './set-1.ts';

const MINUTE = 60 * 1000;

/** Hasard à graine, pour des tirages rejouables. */
function hasard(graine: number): () => number {
  let etat = graine;
  return () => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
}

describe('ouvrirBooster', () => {
  it('contient 5 cartes du set 1', () => {
    const cartes = ouvrirBooster(hasard(1));
    expect(cartes).toHaveLength(TAILLE_BOOSTER);
    for (const numero of cartes) expect(trouverCarte(numero)).toBeDefined();
  });

  it('suit les chances de rareté sur 20 000 boosters', () => {
    const aleatoire = hasard(42);
    const comptes = Object.fromEntries(RARETES.map((r) => [r, 0]));
    const boosters = 20_000;
    for (let i = 0; i < boosters; i++) {
      for (const numero of ouvrirBooster(aleatoire)) {
        const rarete = trouverCarte(numero)?.rarete ?? 'commune';
        comptes[rarete] = (comptes[rarete] ?? 0) + 1;
      }
    }
    for (const rarete of RARETES) {
      expect((comptes[rarete] ?? 0) / (boosters * TAILLE_BOOSTER)).toBeCloseTo(
        CHANCES_BOOSTER[rarete],
        2,
      );
    }
  });

  it('donne chaque carte du set 1 sur un grand nombre de boosters', () => {
    const aleatoire = hasard(7);
    const vues = new Set<number>();
    for (let i = 0; i < 20_000; i++)
      for (const numero of ouvrirBooster(aleatoire)) vues.add(numero);
    expect(vues.size).toBe(71);
  });
});

describe('stockA', () => {
  const t0 = Date.UTC(2026, 9, 18, 12);

  it('gagne un booster toutes les 10 minutes et annonce le suivant', () => {
    expect(stockA({ stock: 2, depuis: t0 }, t0 + 25 * MINUTE)).toEqual({
      stock: 4,
      depuis: t0 + 20 * MINUTE,
      prochainDansMs: 5 * MINUTE,
    });
  });

  it('plafonne le stock à 10 et arrête alors la recharge', () => {
    expect(stockA({ stock: 8, depuis: t0 }, t0 + 5 * 60 * MINUTE)).toEqual({
      stock: REGLES_BOOSTERS.plafond,
      depuis: t0 + 5 * 60 * MINUTE,
      prochainDansMs: null,
    });
  });

  it('relance la recharge dès qu’un booster est ouvert depuis un stock plein', () => {
    const plein = stockA({ stock: 10, depuis: t0 }, t0 + 60 * MINUTE);
    const apresOuverture = { stock: plein.stock - 1, depuis: plein.depuis };
    expect(stockA(apresOuverture, t0 + 69 * MINUTE).stock).toBe(9);
    expect(stockA(apresOuverture, t0 + 70 * MINUTE).stock).toBe(10);
  });

  it('ignore une horloge qui recule', () => {
    expect(stockA({ stock: 3, depuis: t0 }, t0 - MINUTE).stock).toBe(3);
  });
});
