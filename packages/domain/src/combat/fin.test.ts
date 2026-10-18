import { describe, expect, it } from 'vitest';
import { conceder } from './fin.ts';
import { creerPartie } from './tour.ts';
import { vueDe } from './vue.ts';

const DECK = Array.from({ length: 20 }, (_, i) => (i % 10) + 1);

describe('conceder', () => {
  it('fait gagner l’adversaire de celui qui abandonne, et le note au journal', () => {
    const etat = creerPartie({ j1: DECK, j2: DECK }, 7);
    const fin = conceder(etat, 'j1', 'abandon');
    expect(fin.issue).toEqual({ gagnant: 'j2', raison: 'abandon' });
    expect(fin.journal.at(-1)).toMatchObject({ type: 'fin-partie' });
    expect(etat.issue).toBeNull();
    expect(vueDe(fin, 'j2').actions).toEqual([]);
  });

  it('ne change pas une partie déjà terminée', () => {
    const fin = conceder(creerPartie({ j1: DECK, j2: DECK }, 7), 'j2', 'forfait');
    expect(conceder(fin, 'j1', 'abandon')).toBe(fin);
  });
});
