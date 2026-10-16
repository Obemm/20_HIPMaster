import { describe, expect, it } from 'vitest';
import { CHANCES_BOOSTER, RARETES, tirerRarete } from '@/domain/rarete';

describe('tirerRarete', () => {
  it('les chances du booster totalisent 100 %', () => {
    const total = RARETES.reduce((somme, r) => somme + CHANCES_BOOSTER[r], 0);
    expect(total).toBeCloseTo(1);
  });

  it.each([
    [0, 'commune'],
    [0.69, 'commune'],
    [0.7, 'rare'],
    [0.95, 'epique'],
    [0.995, 'legendaire'],
  ] as const)('un tirage à %s donne %s', (valeur, attendu) => {
    expect(tirerRarete(() => valeur)).toBe(attendu);
  });
});
