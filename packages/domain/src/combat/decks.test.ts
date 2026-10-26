import { describe, expect, it } from 'vitest';
import { DECKS_PRETES, exemplairesMax, libererPlaces, problemesDeck } from './decks.ts';

const heritage = DECKS_PRETES[0]?.cartes ?? [];
/** Une collection qui contient chaque carte du deck en autant d'exemplaires que le deck. */
const collectionDe = (cartes: readonly number[]) => {
  const possedes = new Map<number, number>();
  for (const n of cartes) possedes.set(n, (possedes.get(n) ?? 0) + 1);
  return possedes;
};

describe('problemesDeck (US-083)', () => {
  it('ne trouve rien à redire à un deck prêté possédé en entier', () => {
    expect(problemesDeck(heritage, collectionDe(heritage))).toEqual([]);
  });

  it('signale la taille, les exemplaires en trop et les cartes inconnues, par code', () => {
    expect(problemesDeck([4, 4, 4, 1, 1, 999])).toEqual([
      { code: 'taille', cartes: 6 },
      { code: 'exemplaires', numero: 4, nombre: 3, max: 2 },
      { code: 'exemplaires', numero: 1, nombre: 2, max: 1 },
      { code: 'carte-inconnue', numero: 999 },
    ]);
  });

  it('signale les cartes que la collection n’a pas en assez d’exemplaires', () => {
    const possedes = collectionDe(heritage);
    possedes.set(3, 1);
    possedes.delete(53);
    expect(problemesDeck(heritage, possedes)).toEqual([
      { code: 'non-possedee', numero: 3, nombre: 2, possedes: 1 },
      { code: 'non-possedee', numero: 53, nombre: 1, possedes: 0 },
    ]);
  });

  it('permet un brouillon de moins de 20 cartes, jamais un deck de plus de 20', () => {
    expect(problemesDeck([4, 4], undefined, { incompletPermis: true })).toEqual([]);
    expect(problemesDeck([], undefined, { incompletPermis: true })).toEqual([]);
    expect(problemesDeck([...heritage, 4], undefined, { incompletPermis: true })).toContainEqual({
      code: 'taille',
      cartes: 21,
    });
  });

  it('permet 1 exemplaire d’une légendaire et 2 des autres cartes', () => {
    expect(exemplairesMax(1)).toBe(1);
    expect(exemplairesMax(4)).toBe(2);
  });
});

describe('libererPlaces (US-083, ADR 0048)', () => {
  it('garde un deck dont toutes les cartes sont encore là', () => {
    expect(libererPlaces(heritage, collectionDe(heritage))).toEqual({
      cartes: [...heritage],
      liberees: 0,
    });
  });

  it('libère la place des exemplaires sortis de la collection ou du catalogue, dans l’ordre', () => {
    const possedes = new Map([
      [4, 1],
      [7, 2],
      [999, 2],
    ]);
    expect(libererPlaces([4, 7, 4, 999, 7, 12], possedes)).toEqual({
      cartes: [4, 7, 7],
      liberees: 3,
    });
  });
});
