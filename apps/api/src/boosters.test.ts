import { trouverCarte } from '@hipmaster/domain';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { type BaseOuverte, ouvrirBase } from './db/index.ts';
import { collection, joueurs } from './db/schema.ts';

const MINUTE = 60 * 1000;
let ouverte: BaseOuverte;
let app: ReturnType<typeof construireApp>;
let maintenant: number;

beforeEach(async () => {
  ouverte = await ouvrirBase({ url: null, locale: 'memory://' });
  // Horloge pilotée par le test (calée sur la création du compte) ; hasard réel (le tirage est testé dans
  // le domaine).
  maintenant = Date.now();
  app = construireApp({ base: ouverte.base, boosters: { maintenant: () => maintenant } });
});
afterEach(async () => {
  await app.close();
  await ouverte.fermer();
});

interface Boosters {
  stock: number;
  plafond: number;
  prochainDans: number | null;
}
interface Ouverture {
  cartes: { numero: number; nouvelle: boolean }[];
  boosters: Boosters;
}

async function nouveauJoueur(): Promise<{ id: string; entetes: { authorization: string } }> {
  const reponse = await app.inject({
    method: 'POST',
    url: '/api/v1/joueurs',
    payload: { pseudo: 'Ada' },
  });
  const { joueur, jeton } = reponse.json<{ joueur: { id: string }; jeton: string }>();
  // La recharge court depuis l'instant de création, posé par l'horloge de la base : on s'y cale.
  const [ligne] = await ouverte.base
    .select({ depuis: joueurs.rechargeDepuis })
    .from(joueurs)
    .where(eq(joueurs.id, joueur.id));
  maintenant = ligne?.depuis.getTime() ?? maintenant;
  return { id: joueur.id, entetes: { authorization: `Bearer ${jeton}` } };
}

const ouvrir = (entetes: object) =>
  app.inject({ method: 'POST', url: '/api/v1/moi/boosters/ouvertures', headers: { ...entetes } });
const lire = (entetes: object) =>
  app.inject({ method: 'GET', url: '/api/v1/moi/boosters', headers: { ...entetes } });

describe('boosters', () => {
  it('offre 5 boosters à la création du compte, stock non plein donc recharge en cours', async () => {
    const { entetes } = await nouveauJoueur();
    const boosters = (await lire(entetes)).json<Boosters>();
    expect(boosters).toEqual({ stock: 5, plafond: 10, prochainDans: 600 });
  });

  it('ouvre un booster : 5 cartes du catalogue, ajoutées à la collection, et un booster de moins', async () => {
    const { id, entetes } = await nouveauJoueur();
    const reponse = await ouvrir(entetes);
    expect(reponse.statusCode).toBe(201);
    const { cartes, boosters } = reponse.json<Ouverture>();
    expect(cartes).toHaveLength(5);
    for (const { numero } of cartes) expect(trouverCarte(numero)).toBeDefined();
    expect(cartes[0]?.nouvelle).toBe(true);
    expect(boosters.stock).toBe(4);

    const lignes = await ouverte.base.select().from(collection).where(eq(collection.joueurId, id));
    expect(lignes.reduce((total, l) => total + l.exemplaires, 0)).toBe(5);
  });

  it('ne signale comme nouvelles que les cartes jamais obtenues', async () => {
    const { entetes } = await nouveauJoueur();
    const vues = new Set<number>();
    for (let i = 0; i < 5; i++) {
      const { cartes } = (await ouvrir(entetes)).json<Ouverture>();
      for (const { numero, nouvelle } of cartes) {
        expect(nouvelle).toBe(!vues.has(numero));
        vues.add(numero);
      }
    }
  });

  it('refuse d’ouvrir sans booster en stock (409), puis en redonne un 10 minutes plus tard', async () => {
    const { entetes } = await nouveauJoueur();
    for (let i = 0; i < 5; i++) expect((await ouvrir(entetes)).statusCode).toBe(201);
    const refus = await ouvrir(entetes);
    expect(refus.statusCode).toBe(409);
    expect(refus.headers['content-type']).toContain('application/problem+json');
    expect(refus.json<{ title: string }>().title).toBe('Aucun booster en stock');

    maintenant += 10 * MINUTE;
    expect((await lire(entetes)).json<Boosters>().stock).toBe(1);
    expect((await ouvrir(entetes)).statusCode).toBe(201);
  });

  it('recharge jusqu’au plafond de 10, puis s’arrête', async () => {
    const { entetes } = await nouveauJoueur();
    maintenant += 3 * 60 * MINUTE;
    expect((await lire(entetes)).json<Boosters>()).toEqual({
      stock: 10,
      plafond: 10,
      prochainDans: null,
    });
  });

  it('exige un compte', async () => {
    expect((await lire({})).statusCode).toBe(401);
    expect((await ouvrir({})).statusCode).toBe(401);
  });
});
