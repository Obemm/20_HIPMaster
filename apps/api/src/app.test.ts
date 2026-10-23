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

  it('GET /api/v1/cartes liste les 71 cartes du set 1, triées par numéro, capacités détaillées', async () => {
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/cartes' });
    expect(reponse.statusCode).toBe(200);
    const cartes = reponse.json<{ numero: number; capacites: { nom: string }[] }[]>();
    expect(cartes).toHaveLength(71);
    expect(cartes.map((c) => c.numero)).toEqual(Array.from({ length: 71 }, (_, i) => i + 1));
    expect(cartes[0]?.capacites.map((c) => c.nom)).toEqual(['Batch', 'Vétéran', 'Non conforme']);
  });

  it('GET /api/v1/cartes/26 renvoie webMethods.io, évolution de la carte 9', async () => {
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/cartes/26' });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json()).toMatchObject({
      numero: 26,
      nom: 'webMethods.io',
      type: 'evolution',
      origine: 9,
      capacites: [{ id: 'hub' }, { id: 'connecteur', nom: 'Connecteur (2)', valeur: 2 }],
    });
  });

  it('GET /api/v1/cartes/1 renvoie la fiche « En savoir plus » de FTP, absente de la liste', async () => {
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/cartes/1' });
    expect(reponse.statusCode).toBe(200);
    const { fiche } = reponse.json<{ fiche: { definition: string; liens: unknown[] } }>();
    expect(fiche.definition).toContain('File Transfer Protocol');
    expect(fiche.liens).toContainEqual({
      titre: 'File Transfer Protocol',
      url: 'https://fr.wikipedia.org/wiki/File_Transfer_Protocol',
      langue: 'fr',
    });

    const liste = await app.inject({ method: 'GET', url: '/api/v1/cartes' });
    expect(liste.json<object[]>().some((carte) => 'fiche' in carte)).toBe(false);
  });

  it('GET /api/v1/cartes/{numero} répond 404 au format Problem Details pour un numéro inconnu', async () => {
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/cartes/72' });
    expect(reponse.statusCode).toBe(404);
    expect(reponse.headers['content-type']).toContain('application/problem+json');
    expect(reponse.json()).toEqual({
      type: 'about:blank',
      title: 'Carte introuvable',
      status: 404,
    });
  });

  it('GET /api/v1/cartes/{numero} répond 400 pour un numéro invalide', async () => {
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/cartes/abc' });
    expect(reponse.statusCode).toBe(400);
    expect(reponse.headers['content-type']).toContain('application/problem+json');
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
