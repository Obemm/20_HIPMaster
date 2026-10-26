import { DECKS_PRETES } from '@hipmaster/domain';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { collection } from './db/schema.ts';
import type { DeckJoueur } from './decks/decks.ts';

/** Mes decks (US-083, ADR 0048). */
const ouverte = baseDeTest();
let app: ReturnType<typeof construireApp>;

beforeEach(() => {
  app = construireApp({ base: ouverte.base });
});
afterEach(() => app.close());

const heritage = [...(DECKS_PRETES[0]?.cartes ?? [])];

/** Un joueur qui possède `cartes` (un exemplaire par occurrence). */
async function joueur(pseudo: string, cartes: readonly number[] = heritage) {
  const creation = await creerJoueur(ouverte.base, pseudo, CLE_CODES_DEVELOPPEMENT);
  const exemplaires = new Map<number, number>();
  for (const n of cartes) exemplaires.set(n, (exemplaires.get(n) ?? 0) + 1);
  if (exemplaires.size > 0) {
    await ouverte.base.insert(collection).values(
      [...exemplaires].map(([numero, n]) => ({
        joueurId: creation.joueur.id,
        numero,
        exemplaires: n,
      })),
    );
  }
  return { id: creation.joueur.id, entetes: { authorization: `Bearer ${creation.jeton}` } };
}

type Entetes = Record<string, string>;
const lire = (entetes: Entetes) =>
  app.inject({ method: 'GET', url: '/api/v1/moi/decks', headers: entetes });
const creer = (entetes: Entetes, payload: object) =>
  app.inject({ method: 'POST', url: '/api/v1/moi/decks', headers: entetes, payload });
const modifier = (entetes: Entetes, id: string, payload: object) =>
  app.inject({ method: 'PUT', url: `/api/v1/moi/decks/${id}`, headers: entetes, payload });
const supprimer = (entetes: Entetes, id: string) =>
  app.inject({ method: 'DELETE', url: `/api/v1/moi/decks/${id}`, headers: entetes });
const decksDe = async (entetes: Entetes) =>
  (await lire(entetes)).json<{ decks: DeckJoueur[] }>().decks;

describe('mes decks', () => {
  it('exigent une session', async () => {
    expect((await lire({})).statusCode).toBe(401);
    expect((await creer({}, { nom: 'X', cartes: [] })).statusCode).toBe(401);
  });

  it('commencent vides, avec les règles du deck, sans cache', async () => {
    const ada = await joueur('Ada');
    const reponse = await lire(ada.entetes);
    expect(reponse.statusCode).toBe(200);
    expect(reponse.headers['cache-control']).toBe('no-store');
    expect(reponse.json()).toEqual({
      regles: { taille: 20, exemplairesMax: 2, exemplairesMaxLegendaire: 1, decksMax: 5 },
      decks: [],
    });
  });

  it('enregistrent un deck complet avec les cartes possédées, retrouvé à la lecture', async () => {
    const ada = await joueur('Ada');
    const reponse = await creer(ada.entetes, { nom: '  Mon héritage ', cartes: heritage });
    expect(reponse.statusCode).toBe(201);
    const deck = reponse.json<DeckJoueur>();
    expect(deck).toMatchObject({
      nom: 'Mon héritage',
      cartes: heritage,
      complet: true,
      liberees: 0,
    });
    expect(await decksDe(ada.entetes)).toEqual([deck]);
  });

  it('enregistrent un brouillon de moins de 20 cartes, signalé incomplet', async () => {
    const ada = await joueur('Ada');
    const deck = (
      await creer(ada.entetes, { nom: 'Brouillon', cartes: [3, 3] })
    ).json<DeckJoueur>();
    expect(deck).toMatchObject({ cartes: [3, 3], complet: false });
  });

  it('refusent une carte non possédée, trop d’exemplaires ou plus de 20 cartes, avec un code par problème', async () => {
    const ada = await joueur('Ada', [...heritage, 4, 4]);
    const nonPossedee = await creer(ada.entetes, { nom: 'X', cartes: [22] });
    expect(nonPossedee.statusCode).toBe(422);
    expect(nonPossedee.headers['content-type']).toContain('application/problem+json');
    expect(nonPossedee.json()).toMatchObject({
      code: 'deck-carte-non-possedee',
      problemes: [{ code: 'non-possedee', numero: 22, nombre: 1, possedes: 0 }],
    });

    const exemplaires = await creer(ada.entetes, { nom: 'X', cartes: [4, 4, 4] });
    expect(exemplaires.json()).toMatchObject({
      code: 'deck-exemplaires',
      problemes: [{ code: 'exemplaires', numero: 4, nombre: 3, max: 2 }],
    });

    const tropGrand = await creer(ada.entetes, { nom: 'X', cartes: [...heritage, 4] });
    expect(tropGrand.json()).toMatchObject({ code: 'deck-taille' });

    const inconnue = await creer(ada.entetes, { nom: 'X', cartes: [999] });
    expect(inconnue.json()).toMatchObject({ code: 'deck-carte-inconnue' });

    expect((await creer(ada.entetes, { nom: '   ', cartes: [] })).statusCode).toBe(400);
    expect(await decksDe(ada.entetes)).toEqual([]);
  });

  it('se limitent à 5 par joueur, même demandés en même temps', async () => {
    const ada = await joueur('Ada');
    for (let i = 1; i <= 3; i++) {
      expect((await creer(ada.entetes, { nom: `Deck ${i}`, cartes: [3] })).statusCode).toBe(201);
    }
    const reponses = await Promise.all(
      [4, 5, 6].map((i) => creer(ada.entetes, { nom: `Deck ${i}`, cartes: [3] })),
    );
    expect(reponses.map((r) => r.statusCode).sort()).toEqual([201, 201, 409]);
    expect(reponses.find((r) => r.statusCode === 409)?.json()).toMatchObject({
      code: 'decks-plafond',
    });
    expect(await decksDe(ada.entetes)).toHaveLength(5);
  });

  it('se modifient et se suppriment, par leur seul propriétaire', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const { id } = (await creer(ada.entetes, { nom: 'Avant', cartes: [3] })).json<DeckJoueur>();

    expect((await modifier(bob.entetes, id, { nom: 'Volé', cartes: [] })).statusCode).toBe(404);
    expect((await supprimer(bob.entetes, id)).statusCode).toBe(404);

    const modifie = await modifier(ada.entetes, id, { nom: 'Après', cartes: heritage });
    expect(modifie.statusCode).toBe(200);
    expect(modifie.json()).toMatchObject({ id, nom: 'Après', complet: true });
    expect((await modifier(ada.entetes, id, { nom: 'X', cartes: [22] })).statusCode).toBe(422);
    expect((await decksDe(ada.entetes))[0]?.nom).toBe('Après');

    expect((await supprimer(ada.entetes, id)).statusCode).toBe(204);
    expect((await supprimer(ada.entetes, id)).statusCode).toBe(404);
    expect(await decksDe(ada.entetes)).toEqual([]);
    expect((await modifier(ada.entetes, 'pas-un-uuid', { nom: 'X', cartes: [] })).statusCode).toBe(
      400,
    );
  });

  it('libèrent la place d’une carte sortie de la collection : le deck redevient incomplet', async () => {
    const ada = await joueur('Ada');
    await creer(ada.entetes, { nom: 'Héritage', cartes: heritage });
    // EDI (n° 3) : 2 exemplaires dans le deck, il n'en reste qu'un ; Retry (n° 58) disparaît.
    await ouverte.base
      .update(collection)
      .set({ exemplaires: 1 })
      .where(and(eq(collection.joueurId, ada.id), eq(collection.numero, 3)));
    await ouverte.base
      .delete(collection)
      .where(and(eq(collection.joueurId, ada.id), eq(collection.numero, 58)));

    const [deck] = await decksDe(ada.entetes);
    expect(deck).toMatchObject({ complet: false, liberees: 2 });
    expect(deck?.cartes).toHaveLength(18);
    expect(deck?.cartes.filter((n) => n === 3)).toEqual([3]);
    expect(deck?.cartes).not.toContain(58);
  });
});
