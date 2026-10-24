import { brotliDecompressSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { CACHE_CATALOGUE, ETAG_CATALOGUE, etiquetteConnue } from './cache-catalogue.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';

const ouverte = baseDeTest();

describe('cache HTTP et compression (US-057)', () => {
  const ROUTES = ['/cartes', '/cartes/1', '/decks', '/niveaux', '/raretes'];

  it('le catalogue part en cache public de 5 minutes, avec un ETag commun', async () => {
    const app = construireApp({ base: ouverte.base });
    for (const route of ROUTES) {
      const reponse = await app.inject({ method: 'GET', url: `/api/v1${route}` });
      expect(reponse.statusCode, route).toBe(200);
      expect(reponse.headers['cache-control'], route).toBe(CACHE_CATALOGUE);
      expect(reponse.headers.etag, route).toBe(ETAG_CATALOGUE);
    }
    await app.close();
  });

  it('répond 304 sans corps à qui a déjà cette version du catalogue', async () => {
    const app = construireApp({ base: ouverte.base });
    for (const route of ROUTES) {
      const reponse = await app.inject({
        method: 'GET',
        url: `/api/v1${route}`,
        headers: { 'if-none-match': `W/"autre", ${ETAG_CATALOGUE}` },
      });
      expect(reponse.statusCode, route).toBe(304);
      expect(reponse.body, route).toBe('');
      expect(reponse.headers['cache-control'], route).toBe(CACHE_CATALOGUE);
    }
    const perimee = await app.inject({
      method: 'GET',
      url: '/api/v1/cartes',
      headers: { 'if-none-match': '"ancienne-version"' },
    });
    expect(perimee.statusCode).toBe(200);
    await app.close();
  });

  it('les réponses d’un joueur et les erreurs ne sont jamais en cache', async () => {
    const app = construireApp({ base: ouverte.base });
    const { jeton } = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
    const moi = await app.inject({
      method: 'GET',
      url: '/api/v1/moi/collection',
      headers: { authorization: `Bearer ${jeton}` },
    });
    expect(moi.headers['cache-control']).toBe('no-store');
    expect(moi.headers.etag).toBeUndefined();
    const inconnue = await app.inject({ method: 'GET', url: '/api/v1/cartes/9999' });
    expect(inconnue.statusCode).toBe(404);
    expect(inconnue.headers['cache-control']).toBe('no-store');
    await app.close();
  });

  it('compresse le catalogue en Brotli : 21 Ko deviennent moins de 6 Ko', async () => {
    const app = construireApp({ base: ouverte.base });
    const brut = await app.inject({ method: 'GET', url: '/api/v1/cartes' });
    const compresse = await app.inject({
      method: 'GET',
      url: '/api/v1/cartes',
      headers: { 'accept-encoding': 'gzip, deflate, br' },
    });
    expect(brut.headers['content-encoding']).toBeUndefined();
    expect(compresse.headers['content-encoding']).toBe('br');
    expect(compresse.headers.vary).toContain('accept-encoding');
    expect(compresse.rawPayload.length).toBeLessThan(6 * 1024);
    expect(brotliDecompressSync(compresse.rawPayload).toString()).toBe(brut.body);
    // Une petite réponse (moins de 1 Ko) part telle quelle.
    const petite = await app.inject({
      method: 'GET',
      url: '/api/v1/raretes',
      headers: { 'accept-encoding': 'br' },
    });
    expect(petite.headers['content-encoding']).toBeUndefined();
    await app.close();
  });

  it('reconnaît une étiquette dans un If-None-Match', () => {
    expect(etiquetteConnue('"a"', '"a"')).toBe(true);
    expect(etiquetteConnue('W/"a"', '"a"')).toBe(true);
    expect(etiquetteConnue('"b", "a"', '"a"')).toBe(true);
    expect(etiquetteConnue('*', '"a"')).toBe(true);
    expect(etiquetteConnue('"b"', '"a"')).toBe(false);
    expect(etiquetteConnue(undefined, '"a"')).toBe(false);
  });
});
