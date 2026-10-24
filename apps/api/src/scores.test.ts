import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur, supprimerCompte } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { duels, joueurs, points, recompenses } from './db/schema.ts';
import type { DuelVisible } from './duels/duels.ts';
import {
  type Classement,
  compterDuel,
  compterVictoireBot,
  rattraperScores,
} from './scores/scores.ts';

const HEURE = 60 * 60 * 1000;
const JOUR = 24 * HEURE;
const ouverte = baseDeTest();
let app: ReturnType<typeof construireApp>;
let maintenant: number;

beforeEach(() => {
  // Midi UTC : les victoires d'un test tombent le même jour.
  maintenant = Date.UTC(2026, 9, 20, 12);
  let graine = 0;
  app = construireApp({ base: ouverte.base, duels: { tirerGraine: () => ++graine } });
});
afterEach(() => app.close());

const options = () => ({ maintenant: () => maintenant });

async function joueur(pseudo: string) {
  const { joueur, jeton } = await creerJoueur(ouverte.base, pseudo, CLE_CODES_DEVELOPPEMENT);
  return { id: joueur.id, entetes: { authorization: `Bearer ${jeton}` } };
}

const requete = (
  method: 'GET' | 'POST' | 'PUT',
  url: string,
  entetes: Record<string, string>,
  payload?: object,
) => app.inject({ method, url: `/api/v1${url}`, headers: entetes, ...(payload && { payload }) });

async function etat(id: string) {
  const [ligne] = await ouverte.base
    .select({ points: joueurs.points, cote: joueurs.cote, duelsCotes: joueurs.duelsCotes })
    .from(joueurs)
    .where(eq(joueurs.id, id));
  return ligne;
}

/** Un duel lancé entre `a` (créateur, j1) et `b` (j2). */
async function duelLance(a: { entetes: Record<string, string> }, b: typeof a) {
  const cree = (
    await requete('POST', '/duels', a.entetes, { deck: 'moderne' })
  ).json<DuelVisible>();
  await requete('POST', `/duels/${cree.id}/rejoindre`, b.entetes, { deck: 'heritage' });
  return cree.id;
}

describe('victoires contre le bot', () => {
  it('rapportent des points selon le niveau, une seule fois par partie', async () => {
    const ada = await joueur('Ada');
    const partie = randomUUID();
    expect(
      await compterVictoireBot(ouverte.base, partie, ada.id, 'architecte-esb', options()),
    ).toBe(3);
    expect(
      await compterVictoireBot(ouverte.base, partie, ada.id, 'architecte-esb', options()),
    ).toBe(3);
    await compterVictoireBot(ouverte.base, randomUUID(), ada.id, 'agent-autonome', options());
    expect(await etat(ada.id)).toMatchObject({ points: 8 });
  });

  it('ne comptent plus au-delà de 10 victoires par jour, puis de nouveau le lendemain', async () => {
    const ada = await joueur('Ada');
    for (let i = 0; i < 10; i++) {
      await compterVictoireBot(ouverte.base, randomUUID(), ada.id, 'stagiaire', options());
    }
    expect(
      await compterVictoireBot(ouverte.base, randomUUID(), ada.id, 'agent-autonome', options()),
    ).toBe(0);
    expect(await etat(ada.id)).toMatchObject({ points: 10 });

    maintenant += JOUR;
    expect(
      await compterVictoireBot(ouverte.base, randomUUID(), ada.id, 'agent-autonome', options()),
    ).toBe(5);
  });
});

describe('duels', () => {
  it('une victoire rapporte 5 points et fait bouger les deux cotes, une seule fois', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const id = await duelLance(ada, bob);
    await requete('POST', `/duels/${id}/abandon`, bob.entetes);
    // Les deux relisent le duel terminé : il n'est compté qu'une fois.
    await requete('GET', `/duels/${id}`, ada.entetes);
    await requete('GET', `/duels/${id}`, bob.entetes);
    await compterDuel(ouverte.base, id);

    expect(await etat(ada.id)).toEqual({ points: 5, cote: 1016, duelsCotes: 1 });
    expect(await etat(bob.id)).toEqual({ points: 0, cote: 984, duelsCotes: 1 });
  });

  it('un nul rapporte 2 points à chacun', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const id = await duelLance(ada, bob);
    const [ligne] = await ouverte.base.select().from(duels).where(eq(duels.id, id));
    if (!ligne?.etat) throw new Error('Duel non lancé.');
    await ouverte.base
      .update(duels)
      .set({
        statut: 'termine',
        etat: { ...ligne.etat, issue: { gagnant: null, raison: 'tours' } },
      })
      .where(eq(duels.id, id));
    await compterDuel(ouverte.base, id);

    expect(await etat(ada.id)).toEqual({ points: 2, cote: 1000, duelsCotes: 1 });
    expect(await etat(bob.id)).toEqual({ points: 2, cote: 1000, duelsCotes: 1 });
  });

  it('ne compte pas un duel en cours', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const id = await duelLance(ada, bob);
    await compterDuel(ouverte.base, id);
    expect(await etat(ada.id)).toEqual({ points: 0, cote: 1000, duelsCotes: 0 });
  });

  it('contre un compte supprimé, le gagnant a ses points mais sa cote ne bouge pas', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const id = await duelLance(ada, bob);
    // Supprimer son compte abandonne ses duels en cours (US-053).
    await supprimerCompte(ouverte.base, bob.id);
    await requete('GET', `/duels/${id}`, ada.entetes);
    expect(await etat(ada.id)).toEqual({ points: 5, cote: 1000, duelsCotes: 0 });
  });
});

describe('rattrapage des scores', () => {
  it('compte les victoires passées contre le bot à 1 point, plafond compris, et les duels terminés', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const hier = new Date(maintenant - JOUR);
    // 12 victoires contre le bot hier, d'avant le score : 10 comptent.
    await ouverte.base.insert(recompenses).values(
      Array.from({ length: 12 }, (_, i) => ({
        partieId: randomUUID(),
        joueurId: ada.id,
        booster: false,
        accordeeLe: new Date(hier.getTime() + i * 1000),
      })),
    );
    // Une victoire toute récente est peut-être en train d'être comptée : elle attend.
    await ouverte.base.insert(recompenses).values({
      partieId: randomUUID(),
      joueurId: bob.id,
      booster: true,
      accordeeLe: new Date(maintenant),
    });
    // Un duel terminé d'avant le score : Bob l'a gagné.
    const id = await duelLance(ada, bob);
    await requete('POST', `/duels/${id}/abandon`, ada.entetes);
    await ouverte.base.update(duels).set({ scoreCompte: false }).where(eq(duels.id, id));
    await ouverte.base.update(joueurs).set({ points: 0, cote: 1000, duelsCotes: 0 });
    await ouverte.base.delete(points);

    expect(await rattraperScores(ouverte.base, options())).toEqual({ victoiresBot: 12, duels: 1 });
    expect(await etat(ada.id)).toEqual({ points: 10, cote: 984, duelsCotes: 1 });
    expect(await etat(bob.id)).toEqual({ points: 5, cote: 1016, duelsCotes: 1 });

    // Une seconde fois, il n'y a plus rien à rattraper.
    expect(await rattraperScores(ouverte.base, options())).toEqual({ victoiresBot: 0, duels: 0 });
    expect(await etat(ada.id)).toMatchObject({ points: 10 });
  });
});

describe('classement', () => {
  it('exige un compte', async () => {
    expect((await requete('GET', '/classement', {})).statusCode).toBe(401);
    expect((await requete('PUT', '/moi/classement', {}, { classe: false })).statusCode).toBe(401);
  });

  it('montre mon score et mon rang, et les joueurs classés par score', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const cleo = await joueur('Cléo');
    const dan = await joueur('Dan');
    await compterVictoireBot(ouverte.base, randomUUID(), ada.id, 'batch-de-nuit');
    await compterVictoireBot(ouverte.base, randomUUID(), bob.id, 'architecte-esb');
    await compterVictoireBot(ouverte.base, randomUUID(), cleo.id, 'batch-de-nuit');

    const reponse = await requete('GET', '/classement', cleo.entetes);
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json<Classement>()).toEqual({
      moi: { pseudo: 'Cléo', points: 2, cote: null, rang: 2, classe: true },
      joueurs: [
        { rang: 1, pseudo: 'Bob', points: 3, cote: null, moi: false },
        { rang: 2, pseudo: 'Ada', points: 2, cote: null, moi: false },
        { rang: 2, pseudo: 'Cléo', points: 2, cote: null, moi: true },
      ],
    });

    // Sans aucun point, pas encore de rang.
    const sansPoint = (await requete('GET', '/classement', dan.entetes)).json<Classement>();
    expect(sansPoint.moi).toEqual({
      pseudo: 'Dan',
      points: 0,
      cote: null,
      rang: null,
      classe: true,
    });
  });

  it('montre la cote une fois un duel compté', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const id = await duelLance(ada, bob);
    await requete('POST', `/duels/${id}/abandon`, bob.entetes);
    const classement = (await requete('GET', '/classement', bob.entetes)).json<Classement>();
    expect(classement.moi).toMatchObject({ points: 0, cote: 984, rang: null });
    expect(classement.joueurs).toEqual([
      { rang: 1, pseudo: 'Ada', points: 5, cote: 1016, moi: false },
    ]);
  });

  it('un joueur peut se retirer du classement, et y revenir', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    await compterVictoireBot(ouverte.base, randomUUID(), ada.id, 'stagiaire');
    await compterVictoireBot(ouverte.base, randomUUID(), bob.id, 'stagiaire');

    expect(
      (await requete('PUT', '/moi/classement', ada.entetes, { classe: false })).statusCode,
    ).toBe(204);
    const vuParBob = (await requete('GET', '/classement', bob.entetes)).json<Classement>();
    expect(vuParBob.joueurs.map((j) => j.pseudo)).toEqual(['Bob']);
    // Retirée, Ada voit toujours son score, sans rang.
    const vuParAda = (await requete('GET', '/classement', ada.entetes)).json<Classement>();
    expect(vuParAda.moi).toEqual({
      pseudo: 'Ada',
      points: 1,
      cote: null,
      rang: null,
      classe: false,
    });

    await requete('PUT', '/moi/classement', ada.entetes, { classe: true });
    const deRetour = (await requete('GET', '/classement', bob.entetes)).json<Classement>();
    expect(deRetour.joueurs.map((j) => j.pseudo)).toEqual(['Ada', 'Bob']);
  });

  it('refuse un corps invalide', async () => {
    const ada = await joueur('Ada');
    const reponse = await requete('PUT', '/moi/classement', ada.entetes, { classe: 'non' });
    expect(reponse.statusCode).toBe(400);
  });
});
