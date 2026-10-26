import { DECKS_PRETES } from '@hipmaster/domain';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { collection, duels, parties } from './db/schema.ts';
import type { DeckJoueur } from './decks/decks.ts';
import type { DuelVisible } from './duels/duels.ts';

/** Jouer avec son deck contre le bot et en duel (US-084, ADR 0049). */
const ouverte = baseDeTest();
let app: ReturnType<typeof construireApp>;

beforeEach(() => {
  let graine = 0;
  app = construireApp({
    base: ouverte.base,
    duels: { tirerGraine: () => ++graine },
    parties: { tirerGraine: () => ++graine },
  });
});
afterEach(() => app.close());

const heritage = [...(DECKS_PRETES[0]?.cartes ?? [])];

/** Un joueur qui possède le deck Héritage, et un deck à lui de même composition. */
async function joueurAvecDeck(pseudo: string) {
  const creation = await creerJoueur(ouverte.base, pseudo, CLE_CODES_DEVELOPPEMENT);
  const exemplaires = new Map<number, number>();
  for (const n of heritage) exemplaires.set(n, (exemplaires.get(n) ?? 0) + 1);
  await ouverte.base.insert(collection).values(
    [...exemplaires].map(([numero, n]) => ({
      joueurId: creation.joueur.id,
      numero,
      exemplaires: n,
    })),
  );
  const entetes = { authorization: `Bearer ${creation.jeton}` };
  const deck = (
    await app.inject({
      method: 'POST',
      url: '/api/v1/moi/decks',
      headers: entetes,
      payload: { nom: `Deck de ${pseudo}`, cartes: heritage },
    })
  ).json<DeckJoueur>();
  return { id: creation.joueur.id, entetes, deck };
}

const poster = (url: string, entetes: Record<string, string>, payload: object) =>
  app.inject({ method: 'POST', url: `/api/v1${url}`, headers: entetes, payload });

/** Retire une carte de la collection d'un joueur : le deck qui la contient devient incomplet. */
const retirerCarte = (joueurId: string, numero: number) =>
  ouverte.base
    .delete(collection)
    .where(and(eq(collection.joueurId, joueurId), eq(collection.numero, numero)));

describe('jouer avec son deck contre le bot', () => {
  it('lance la partie avec le deck choisi, figé dans l’état du moteur', async () => {
    const ada = await joueurAvecDeck('Ada');
    const reponse = await poster('/parties', ada.entetes, { deck: ada.deck.id });
    expect(reponse.statusCode).toBe(201);
    const { id, deck } = reponse.json<{ id: string; deck: string }>();
    expect(deck).toBe(ada.deck.id);

    // Le deck modifié ensuite ne change rien à la partie.
    await app.inject({
      method: 'PUT',
      url: `/api/v1/moi/decks/${ada.deck.id}`,
      headers: ada.entetes,
      payload: { nom: 'Autre', cartes: [3] },
    });
    const [ligne] = await ouverte.base.select().from(parties).where(eq(parties.id, id));
    const etat = ligne?.etat;
    if (!etat) throw new Error('partie absente');
    const cartesJ1 = [
      ...etat.joueurs.j1.main,
      ...etat.joueurs.j1.pioche,
      ...etat.joueurs.j1.defausse,
      ...etat.joueurs.j1.plateau,
    ].map((c) => c.numero);
    expect(cartesJ1.sort((a, b) => a - b)).toEqual([...heritage].sort((a, b) => a - b));
  });

  it('refuse un deck incomplet, le deck d’un autre joueur, et un deck à soi sans compte', async () => {
    const ada = await joueurAvecDeck('Ada');
    const bob = await joueurAvecDeck('Bob');
    expect((await poster('/parties', bob.entetes, { deck: ada.deck.id })).json()).toMatchObject({
      code: 'deck-inconnu',
    });
    expect((await poster('/parties', {}, { deck: ada.deck.id })).json()).toMatchObject({
      code: 'deck-inconnu',
    });

    await retirerCarte(ada.id, 58);
    const incomplet = await poster('/parties', ada.entetes, { deck: ada.deck.id });
    expect(incomplet.statusCode).toBe(422);
    expect(incomplet.json()).toMatchObject({ code: 'deck-incomplet' });
    // Les decks prêtés restent disponibles.
    expect((await poster('/parties', ada.entetes, { deck: 'moderne' })).statusCode).toBe(201);
  });
});

describe('jouer avec son deck en duel', () => {
  it('fige le deck du créateur dès le défi, même modifié ou supprimé avant le lancement', async () => {
    const ada = await joueurAvecDeck('Ada');
    const bob = await joueurAvecDeck('Bob');
    const cree = await poster('/duels', ada.entetes, { deck: ada.deck.id });
    expect(cree.statusCode).toBe(201);
    const defi = cree.json<DuelVisible>();
    expect(defi).toMatchObject({ deckCreateur: ada.deck.id, nomDeckCreateur: 'Deck de Ada' });

    await app.inject({
      method: 'DELETE',
      url: `/api/v1/moi/decks/${ada.deck.id}`,
      headers: ada.entetes,
    });
    const rejoint = await poster(`/duels/${defi.id}/rejoindre`, bob.entetes, {
      deck: bob.deck.id,
    });
    expect(rejoint.statusCode).toBe(200);
    expect(rejoint.json<DuelVisible>()).toMatchObject({
      statut: 'en-cours',
      nomDeckCreateur: 'Deck de Ada',
    });
    const [ligne] = await ouverte.base.select().from(duels).where(eq(duels.id, defi.id));
    expect(ligne).toMatchObject({ cartesCreateur: heritage, deckAdversaire: bob.deck.id });
  });

  it('revérifie le deck de l’adversaire au lancement, et celui d’un adversaire au hasard', async () => {
    const ada = await joueurAvecDeck('Ada');
    const bob = await joueurAvecDeck('Bob');
    const defi = (await poster('/duels', ada.entetes, { deck: 'heritage' })).json<DuelVisible>();
    expect(defi.nomDeckCreateur).toBeUndefined();

    await retirerCarte(bob.id, 58);
    const refus = await poster(`/duels/${defi.id}/rejoindre`, bob.entetes, { deck: bob.deck.id });
    expect(refus.statusCode).toBe(422);
    expect(refus.json()).toMatchObject({ code: 'deck-incomplet' });
    expect(
      (await poster('/duels/hasard', bob.entetes, { deck: bob.deck.id })).json(),
    ).toMatchObject({ code: 'deck-incomplet' });

    const hasard = await poster('/duels/hasard', ada.entetes, { deck: ada.deck.id });
    expect(hasard.statusCode).toBe(201);
    expect(hasard.json<DuelVisible>()).toMatchObject({ nomDeckCreateur: 'Deck de Ada' });
  });
});
