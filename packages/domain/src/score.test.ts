import { describe, expect, it } from 'vitest';
import { NIVEAUX_BOT } from './combat/niveaux.ts';
import { cotesApresDuel, pointsVictoireBot, REGLES_SCORE } from './score.ts';

describe('points de victoire contre le bot', () => {
  it('croissent avec le niveau du bot', () => {
    expect(NIVEAUX_BOT.map((n) => pointsVictoireBot(n.id))).toEqual([1, 2, 3, 5]);
  });

  it('valent une victoire sans niveau pour un niveau inconnu', () => {
    expect(pointsVictoireBot('inconnu')).toBe(REGLES_SCORE.victoireBotSansNiveau);
  });
});

describe('cote de duel', () => {
  it('fait gagner 16 points au vainqueur entre deux cotes égales', () => {
    expect(cotesApresDuel(1000, 1000, 1)).toEqual([1016, 984]);
    expect(cotesApresDuel(1000, 1000, 0)).toEqual([984, 1016]);
  });

  it('ne bouge pas sur un nul entre égaux, et favorise le moins bien coté sinon', () => {
    expect(cotesApresDuel(1000, 1000, 0.5)).toEqual([1000, 1000]);
    expect(cotesApresDuel(1200, 1000, 0.5)).toEqual([1192, 1008]);
  });

  it('récompense davantage une victoire inattendue', () => {
    const [favori] = cotesApresDuel(1200, 1000, 1);
    const [outsider] = cotesApresDuel(1000, 1200, 1);
    expect(favori - 1200).toBe(8);
    expect(outsider - 1000).toBe(24);
  });

  it('garde la somme des cotes', () => {
    const [a, b] = cotesApresDuel(1137, 921, 0);
    expect(a + b).toBe(1137 + 921);
  });
});
