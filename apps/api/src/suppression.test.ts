import { randomUUID } from 'node:crypto';
import { eq, or } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { ouvrirUnBooster, recompenserVictoire } from './comptes/boosters.ts';
import { CLE_CODES_DEVELOPPEMENT, connecterParCode, creerJoueur } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { collection, duels, joueurs, parties, recompenses, sessions } from './db/schema.ts';
import { COMPTE_SUPPRIME, type DuelVisible, type ResumeDuel } from './duels/duels.ts';

/** Suppression de son compte (US-053, ADR 0031). */
const ouverte = baseDeTest();
let app: ReturnType<typeof construireApp>;

beforeEach(() => {
  let graine = 0;
  app = construireApp({ base: ouverte.base, duels: { tirerGraine: () => ++graine } });
});
afterEach(() => app.close());

async function joueur(pseudo: string) {
  const creation = await creerJoueur(ouverte.base, pseudo, CLE_CODES_DEVELOPPEMENT);
  return {
    id: creation.joueur.id,
    code: creation.codeRecuperation,
    entetes: { authorization: `Bearer ${creation.jeton}` },
  };
}

const requete = (
  method: 'GET' | 'POST' | 'DELETE',
  url: string,
  entetes: Record<string, string>,
  payload?: object,
) => app.inject({ method, url: `/api/v1${url}`, headers: entetes, ...(payload && { payload }) });

const supprimer = (entetes: Record<string, string>) => requete('DELETE', '/moi', entetes);

/** Un duel lancé entre Ada (créatrice, j1) et Bob (j2). */
async function duelLance(ada: Awaited<ReturnType<typeof joueur>>, bob: typeof ada) {
  const cree = (
    await requete('POST', '/duels', ada.entetes, { deck: 'moderne' })
  ).json<DuelVisible>();
  await requete('POST', `/duels/${cree.id}/rejoindre`, bob.entetes, { deck: 'heritage' });
  return cree.id;
}

describe('suppression de son compte', () => {
  it('exige une session', async () => {
    expect((await supprimer({})).statusCode).toBe(401);
  });

  it('supprime le compte, ses sessions, sa collection, ses récompenses et ses parties, et rien d’autre', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    for (const j of [ada, bob]) {
      await ouvrirUnBooster(ouverte.base, j.id);
      await recompenserVictoire(ouverte.base, randomUUID(), j.id);
      await requete('POST', '/parties', j.entetes, { deck: 'moderne' });
    }
    // Bob est aussi connecté sur un autre appareil : il y sera déconnecté.
    const ailleurs = await connecterParCode(ouverte.base, bob.code, CLE_CODES_DEVELOPPEMENT);
    if (!ailleurs) throw new Error('Seconde session non ouverte.');

    const reponse = await supprimer(bob.entetes);
    expect(reponse.statusCode).toBe(204);
    expect((await requete('GET', '/moi', bob.entetes)).statusCode).toBe(401);
    expect((await supprimer(bob.entetes)).statusCode).toBe(401);
    const autreAppareil = { authorization: `Bearer ${ailleurs.jeton}` };
    expect((await requete('GET', '/moi', autreAppareil)).statusCode).toBe(401);

    const de = async (id: string) => ({
      joueurs: (await ouverte.base.select().from(joueurs).where(eq(joueurs.id, id))).length,
      sessions: (await ouverte.base.select().from(sessions).where(eq(sessions.joueurId, id)))
        .length,
      collection: (await ouverte.base.select().from(collection).where(eq(collection.joueurId, id)))
        .length,
      recompenses: (
        await ouverte.base.select().from(recompenses).where(eq(recompenses.joueurId, id))
      ).length,
      parties: (await ouverte.base.select().from(parties).where(eq(parties.joueurId, id))).length,
    });
    expect(await de(bob.id)).toEqual({
      joueurs: 0,
      sessions: 0,
      collection: 0,
      recompenses: 0,
      parties: 0,
    });
    const chezAda = await de(ada.id);
    expect(chezAda.joueurs).toBe(1);
    expect(chezAda.sessions).toBe(1);
    expect(chezAda.collection).toBeGreaterThan(0);
    expect(chezAda.recompenses).toBe(1);
    expect(chezAda.parties).toBe(1);
  });

  it('un duel en cours se termine par forfait : l’adversaire le voit gagné, au lieu d’une erreur', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const id = await duelLance(ada, bob);
    const avant = (await requete('GET', `/duels/${id}`, ada.entetes)).json<DuelVisible>();

    expect((await supprimer(bob.entetes)).statusCode).toBe(204);

    const lu = await requete('GET', `/duels/${id}`, ada.entetes);
    expect(lu.statusCode).toBe(200);
    const duel = lu.json<DuelVisible>();
    expect(duel).toMatchObject({
      statut: 'termine',
      version: avant.version + 1,
      createur: { pseudo: 'Ada' },
      adversaire: { pseudo: COMPTE_SUPPRIME },
      vue: { issue: { gagnant: 'j1', raison: 'forfait' } },
    });
    // Une victoire par forfait comme une autre (US-038).
    expect(duel.recompense).toMatchObject({ booster: true });
    // Un coup joué ensuite arrive sur une partie terminée.
    const coup = await requete('POST', `/duels/${id}/actions`, ada.entetes, { type: 'finirTour' });
    expect(coup.statusCode).toBe(422);

    const mes = (await requete('GET', '/moi/duels', ada.entetes)).json<{ duels: ResumeDuel[] }>();
    expect(mes.duels).toEqual([
      expect.objectContaining({
        id,
        statut: 'termine',
        adversaire: { pseudo: COMPTE_SUPPRIME },
        resultat: 'victoire',
        raison: 'forfait',
      }),
    ]);
  });

  it('le créateur parti, son adversaire garde le duel terminé ; ses défis en attente disparaissent', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const id = await duelLance(ada, bob);
    const defi = (
      await requete('POST', '/duels', ada.entetes, { deck: 'moderne' })
    ).json<DuelVisible>();

    expect((await supprimer(ada.entetes)).statusCode).toBe(204);

    expect(await ouverte.base.select().from(duels).where(eq(duels.id, defi.id))).toEqual([]);
    const duel = (await requete('GET', `/duels/${id}`, bob.entetes)).json<DuelVisible>();
    expect(duel).toMatchObject({
      statut: 'termine',
      createur: { pseudo: COMPTE_SUPPRIME },
      adversaire: { pseudo: 'Bob' },
      moi: 'j2',
      vue: { issue: { gagnant: 'j2', raison: 'forfait' } },
    });
    const mes = (await requete('GET', '/moi/duels', bob.entetes)).json<{ duels: ResumeDuel[] }>();
    expect(mes.duels).toEqual([
      expect.objectContaining({
        id,
        adversaire: { pseudo: COMPTE_SUPPRIME },
        resultat: 'victoire',
      }),
    ]);
  });

  it('un duel dont les deux joueurs sont partis est supprimé', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const eve = await joueur('Eve');
    const id = await duelLance(ada, bob);
    const avecEve = await duelLance(eve, bob);

    await supprimer(ada.entetes);
    expect(await ouverte.base.select().from(duels).where(eq(duels.id, id))).toHaveLength(1);
    await supprimer(bob.entetes);
    expect(await ouverte.base.select().from(duels).where(eq(duels.id, id))).toEqual([]);
    // Eve garde le sien.
    const restants = await ouverte.base
      .select({ id: duels.id })
      .from(duels)
      .where(or(eq(duels.createurId, eve.id), eq(duels.adversaireId, eve.id)));
    expect(restants).toEqual([{ id: avecEve }]);
  });
});
