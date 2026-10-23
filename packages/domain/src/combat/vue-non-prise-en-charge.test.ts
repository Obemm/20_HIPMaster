import { describe, expect, it, vi } from 'vitest';
import { scenario } from './aide-tests.ts';
import { vueDe } from './vue.ts';

const API_REST = 22;

// Toutes les cartes du set 1 sont prises en charge : on en retire une pour vérifier la raison (US-071).
vi.mock('./prise-en-charge.ts', async (original) => {
  const module = await original<typeof import('./prise-en-charge.ts')>();
  return {
    ...module,
    estPriseEnCharge: (carte: { numero: number }) =>
      carte.numero !== API_REST && module.estPriseEnCharge(carte as never),
  };
});

describe('Raison de ne pas jouer une carte de la main (US-071)', () => {
  it('dit qu’une carte n’est pas encore prise en charge par le jeu', () => {
    expect(vueDe(scenario({ main: [API_REST] }), 'j1').moi.main[0]?.injouable).toBe(
      'Cette carte n’est pas encore prise en charge par le jeu.',
    );
  });
});
