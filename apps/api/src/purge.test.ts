import { creerPartie, DECKS_PRETES } from '@hipmaster/domain';
import { eq, ne } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur, joueurDuJeton } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { collection, duels, joueurs, parties, recompenses, sessions } from './db/schema.ts';
import { abandonnerDuel, creerDuel, rejoindreDuel } from './duels/duels.ts';
import { purger } from './purge/purge.ts';

const ouverte = baseDeTest();
const JOUR = 24 * 60 * 60 * 1000;
const ilYA = (jours: number) => new Date(Date.now() - jours * JOUR);
const etat = creerPartie(
  { j1: DECKS_PRETES[0]?.cartes ?? [], j2: DECKS_PRETES[1]?.cartes ?? [] },
  1,
);

/** Un duel entre Ada et Bob : lancé, puis terminé par abandon si demandé ; daté de `jours` jours. */
async function duel(ada: string, bob: string, termine: boolean, jours: number) {
  const cree = await creerDuel(ouverte.base, ada, 'moderne');
  if (!cree.ok) throw new Error('Duel non créé.');
  await rejoindreDuel(ouverte.base, cree.valeur.id, bob, 'heritage');
  if (termine) await abandonnerDuel(ouverte.base, cree.valeur.id, ada);
  await ouverte.base
    .update(duels)
    .set({ creeLe: ilYA(jours), majLe: ilYA(jours) })
    .where(eq(duels.id, cree.valeur.id));
  return cree.valeur.id;
}

/** Ada, inactive depuis des années (collection, récompense, duels, session oubliée), et Bob, venu hier. */
async function deuxJoueurs() {
  const ada = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
  const bob = await creerJoueur(ouverte.base, 'Bob', CLE_CODES_DEVELOPPEMENT);
  const idAda = ada.joueur.id;
  const idBob = bob.joueur.id;
  await ouverte.base
    .update(joueurs)
    .set({ creeLe: ilYA(5 * 365) })
    .where(eq(joueurs.id, idAda));
  await ouverte.base.insert(collection).values({ joueurId: idAda, numero: 1, exemplaires: 2 });
  await ouverte.base.insert(recompenses).values({
    partieId: crypto.randomUUID(),
    joueurId: idAda,
    booster: true,
    accordeeLe: ilYA(4 * 365),
  });
  const termine = await duel(idAda, idBob, true, 3 * 365);
  const enCours = await duel(idAda, idBob, false, 400);
  await ouverte.base
    .update(sessions)
    .set({ utiliseeLe: ilYA(4 * 365) })
    .where(eq(sessions.joueurId, idAda));
  await ouverte.base
    .update(sessions)
    .set({ utiliseeLe: ilYA(1) })
    .where(eq(sessions.joueurId, idBob));
  return { ada, bob, termine, enCours };
}

async function compter() {
  const [j, c, r, d, s, p] = await Promise.all([
    ouverte.base.$count(joueurs),
    ouverte.base.$count(collection),
    ouverte.base.$count(recompenses),
    ouverte.base.$count(duels, ne(duels.statut, 'attente')),
    ouverte.base.$count(sessions),
    ouverte.base.$count(parties),
  ]);
  return { joueurs: j, collection: c, recompenses: r, duelsCommences: d, sessions: s, parties: p };
}

describe('purge des données techniques (US-054)', () => {
  it('supprime les sessions inutilisées 90 jours, les défis jamais acceptés et les parties abandonnées', async () => {
    const { ada, bob } = await deuxJoueurs();
    // Défis : celui d'Ada attend depuis 8 jours, celui de Bob depuis hier.
    const vieux = await creerDuel(ouverte.base, ada.joueur.id, 'moderne');
    const recent = await creerDuel(ouverte.base, bob.joueur.id, 'moderne');
    if (!vieux.ok || !recent.ok) throw new Error('Défis non créés.');
    await ouverte.base
      .update(duels)
      .set({ creeLe: ilYA(8) })
      .where(eq(duels.id, vieux.valeur.id));
    // Parties contre le bot : une abandonnée depuis 2 jours, une jouée il y a une heure.
    await ouverte.base.insert(parties).values([
      { deck: 'moderne', deckBot: 'heritage', niveau: 'stagiaire', etat, majLe: ilYA(2) },
      { deck: 'moderne', deckBot: 'heritage', niveau: 'stagiaire', etat, majLe: ilYA(1 / 24) },
    ]);

    const bilan = await purger(ouverte.base);

    expect(bilan).toEqual({ sessions: 1, defis: 1, parties: 1 });
    const defis = await ouverte.base
      .select({ id: duels.id })
      .from(duels)
      .where(eq(duels.statut, 'attente'));
    expect(defis.map((d) => d.id)).toEqual([recent.valeur.id]);
    expect(await joueurDuJeton(ouverte.base, ada.jeton)).toBeNull();
    expect(await joueurDuJeton(ouverte.base, bob.jeton)).toMatchObject({ pseudo: 'Bob' });
    expect(await compter()).toMatchObject({
      joueurs: 2,
      collection: 1,
      recompenses: 1,
      duelsCommences: 2,
    });
  });

  it('ne supprime jamais un compte, sa collection, ses récompenses ni ses duels, même dix ans plus tard', async () => {
    const { termine, enCours } = await deuxJoueurs();
    const avant = await compter();

    const bilan = await purger(ouverte.base, { maintenant: () => Date.now() + 10 * 365 * JOUR });

    expect(bilan.sessions).toBe(2);
    expect(await compter()).toEqual({ ...avant, sessions: 0 });
    const restants = await ouverte.base.select().from(duels);
    expect(restants.map((d) => [d.id, d.statut]).sort()).toEqual(
      [
        [termine, 'termine'],
        [enCours, 'en-cours'],
      ].sort(),
    );
    // Du duel terminé restent les deux joueurs, le gagnant, la raison de la fin et la date.
    const fini = restants.find((d) => d.id === termine);
    expect(fini?.createurId).not.toBeNull();
    expect(fini?.adversaireId).not.toBeNull();
    expect(fini?.etat?.issue).toMatchObject({ gagnant: 'j2', raison: 'abandon' });
  });

  it('une session purgée emporte ses parties contre le bot, jamais le compte', async () => {
    const ada = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
    const [session] = await ouverte.base.select().from(sessions);
    await ouverte.base.insert(parties).values({
      joueurId: ada.joueur.id,
      session: session?.empreinteJeton ?? '',
      deck: 'moderne',
      deckBot: 'heritage',
      niveau: 'stagiaire',
      etat,
    });

    await purger(ouverte.base, { maintenant: () => Date.now() + 91 * JOUR });

    expect(await compter()).toMatchObject({ joueurs: 1, sessions: 0, parties: 0 });
  });
});

describe('expiration des sessions (US-054)', () => {
  it('une session inutilisée 90 jours est refusée (401) ; le joueur se reconnecte avec son code', async () => {
    const ada = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
    const app = construireApp({
      base: ouverte.base,
      sessions: { maintenant: () => Date.now() + 91 * JOUR },
    });
    const moi = await app.inject({
      method: 'GET',
      url: '/api/v1/moi',
      headers: { authorization: `Bearer ${ada.jeton}` },
    });
    expect(moi.statusCode).toBe(401);
    expect(moi.json()).toMatchObject({ title: 'Compte requis : session absente ou expirée' });

    const reconnexion = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { code: ada.codeRecuperation },
    });
    expect(reconnexion.statusCode).toBe(201);
    await app.close();
  });

  it('chaque usage prolonge la session, avec au plus une écriture par jour', async () => {
    const ada = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
    const utiliseeLe = async () =>
      (await ouverte.base.select({ le: sessions.utiliseeLe }).from(sessions))[0]?.le.getTime();
    const creee = await utiliseeLe();
    const a = (jours: number) => ({ maintenant: () => Date.now() + jours * JOUR });

    // Une heure plus tard : rien n'est écrit.
    expect(await joueurDuJeton(ouverte.base, ada.jeton, a(1 / 24))).not.toBeNull();
    expect(await utiliseeLe()).toBe(creee);
    // 89 jours plus tard : la session vaut encore, et repart pour 90 jours.
    expect(await joueurDuJeton(ouverte.base, ada.jeton, a(89))).not.toBeNull();
    expect(await utiliseeLe()).toBeGreaterThan((creee ?? 0) + 88 * JOUR);
    expect(await joueurDuJeton(ouverte.base, ada.jeton, a(178))).not.toBeNull();
    // Puis 91 jours sans usage : expirée.
    expect(await joueurDuJeton(ouverte.base, ada.jeton, a(270))).toBeNull();
  });

  it('la durée se règle', async () => {
    const ada = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
    const options = { dureeMs: 7 * JOUR, maintenant: () => Date.now() + 8 * JOUR };
    expect(await joueurDuJeton(ouverte.base, ada.jeton, options)).toBeNull();
  });
});
