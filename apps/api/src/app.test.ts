import { afterAll, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';

const app = construireApp();
afterAll(() => app.close());

describe('API v1', () => {
  it('GET /api/v1/sante répond ok', async () => {
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/sante' });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json()).toEqual({ statut: 'ok' });
  });

  it('GET /api/v1/raretes liste les quatre raretés, dont le total des chances vaut 1', async () => {
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/raretes' });
    const raretes = reponse.json<{ rarete: string; chance: number }[]>();
    expect(raretes.map((r) => r.rarete)).toEqual(['commune', 'rare', 'epique', 'legendaire']);
    expect(raretes.reduce((somme, r) => somme + r.chance, 0)).toBeCloseTo(1);
  });

  it('une route inconnue répond 404 au format Problem Details', async () => {
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/inconnue' });
    expect(reponse.statusCode).toBe(404);
    expect(reponse.headers['content-type']).toContain('application/problem+json');
    expect(reponse.json()).toEqual({
      type: 'about:blank',
      title: 'Ressource introuvable',
      status: 404,
    });
  });
});
