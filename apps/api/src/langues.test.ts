import { describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { ETAGS_CATALOGUE } from './cache-catalogue.ts';
import { baseDeTest } from './db/base-de-test.ts';

const ouverte = baseDeTest();

interface CarteLue {
  numero: number;
  nom: string;
  cout: number;
  capacites: { id: string; nom: string }[];
  fiche?: { definition: string; liens: { url: string; langue: string }[] };
}

// US-081 : l'API sert les textes du jeu dans la langue demandée (`?langue=en`), le français par défaut.
describe('textes du jeu dans la langue demandée (US-081)', () => {
  it('le catalogue en anglais : mêmes cartes, mêmes règles, d’autres textes', async () => {
    const app = construireApp({ base: ouverte.base });
    const francais = (await app.inject({ url: '/api/v1/cartes' })).json<CarteLue[]>();
    const anglais = (await app.inject({ url: '/api/v1/cartes?langue=en' })).json<CarteLue[]>();
    expect(anglais.map((c) => [c.numero, c.cout])).toEqual(francais.map((c) => [c.numero, c.cout]));
    const sap = (cartes: CarteLue[]) => cartes.find((c) => c.numero === 13);
    expect(sap(francais)?.nom).toBe('Adaptateur SAP');
    expect(sap(anglais)?.nom).toBe('SAP Adapter');
    expect(sap(anglais)?.capacites.map((c) => c.nom)).toContain('Guard');
    await app.close();
  });

  it('la fiche « En savoir plus » en anglais pointe vers une ressource anglaise', async () => {
    const app = construireApp({ base: ouverte.base });
    const ftp = (await app.inject({ url: '/api/v1/cartes/1?langue=en' })).json<CarteLue>();
    expect(ftp.fiche?.liens.map((l) => l.langue)).not.toContain('fr');
    expect(ftp.fiche?.liens[0]?.url).toBe('https://en.wikipedia.org/wiki/File_Transfer_Protocol');
    await app.close();
  });

  it('une langue inconnue vaut le français', async () => {
    const app = construireApp({ base: ouverte.base });
    const reponse = await app.inject({ url: '/api/v1/cartes/13?langue=de' });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json<CarteLue>().nom).toBe('Adaptateur SAP');
    expect(reponse.headers.etag).toBe(ETAGS_CATALOGUE.fr);
    await app.close();
  });

  it('chaque langue a son ETag : le cache HTTP ne mélange jamais les langues', async () => {
    const app = construireApp({ base: ouverte.base });
    expect(ETAGS_CATALOGUE.en).not.toBe(ETAGS_CATALOGUE.fr);
    for (const route of ['/cartes', '/cartes/1', '/decks', '/niveaux']) {
      const anglais = await app.inject({ url: `/api/v1${route}?langue=en` });
      expect(anglais.headers.etag, route).toBe(ETAGS_CATALOGUE.en);
      // L'ETag du français ne vaut pas pour l'anglais : 200, pas 304.
      const croise = await app.inject({
        url: `/api/v1${route}?langue=en`,
        headers: { 'if-none-match': ETAGS_CATALOGUE.fr },
      });
      expect(croise.statusCode, route).toBe(200);
      const connu = await app.inject({
        url: `/api/v1${route}?langue=en`,
        headers: { 'if-none-match': ETAGS_CATALOGUE.en },
      });
      expect(connu.statusCode, route).toBe(304);
    }
    await app.close();
  });

  it('decks prêtés et niveaux du bot en anglais', async () => {
    const app = construireApp({ base: ouverte.base });
    const niveaux = (await app.inject({ url: '/api/v1/niveaux?langue=en' })).json<
      { id: string; nom: string }[]
    >();
    expect(niveaux.find((n) => n.id === 'stagiaire')?.nom).toBe('Intern');
    const decks = (await app.inject({ url: '/api/v1/decks?langue=en' })).json<
      { id: string; nom: string; cartes: number[] }[]
    >();
    expect(decks.find((d) => d.id === 'heritage')?.nom).toBe('Legacy');
    expect(decks.every((d) => d.cartes.length > 0)).toBe(true);
    await app.close();
  });

  it('la bulle de la partie guidée suit la langue, l’action attendue non', async () => {
    const app = construireApp({ base: ouverte.base });
    const anglaise = await app.inject({
      method: 'POST',
      url: '/api/v1/parties?langue=en',
      payload: { guidee: true },
    });
    expect(anglaise.statusCode).toBe(201);
    const partie = anglaise.json<{
      id: string;
      guide: { titre: string; texte: string; attendu: unknown };
    }>();
    expect(partie.guide.titre).toBe('Throughput pays for your cards');
    const francaise = await app.inject({ url: `/api/v1/parties/${partie.id}` });
    const guide = francaise.json<{ guide: { titre: string; attendu: unknown } }>().guide;
    expect(guide.titre).toBe('Le Débit paie vos cartes');
    expect(guide.attendu).toEqual(partie.guide.attendu);
    const conseil = await app.inject({ url: `/api/v1/parties/${partie.id}/conseil?langue=en` });
    expect(conseil.json<{ explication: string }>().explication).toMatch(/^Deploy /);
    await app.close();
  });
});

describe('codes d’erreur stables (US-082)', () => {
  it('chaque erreur porte un code que le front traduit, le titre français en repli', async () => {
    const app = construireApp({ base: ouverte.base });
    const invalide = await app.inject({ method: 'GET', url: '/api/v1/cartes/abc' });
    expect(invalide.json()).toMatchObject({ status: 400, code: 'requete-invalide' });
    const partie = await app.inject({ method: 'GET', url: '/api/v1/parties/inconnue' });
    expect(partie.json()).toMatchObject({
      status: 404,
      code: 'partie-inconnue',
      title: 'Partie introuvable ou expirée',
    });
    const sansCompte = await app.inject({ method: 'GET', url: '/api/v1/moi' });
    expect(sansCompte.json()).toMatchObject({ status: 401, code: 'compte-requis' });
    await app.close();
  });
});
