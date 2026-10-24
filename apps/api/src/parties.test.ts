import { choisirActionBatchDeNuit, type VueJoueur } from '@hipmaster/domain';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur, empreinteJeton } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { parties } from './db/schema.ts';
import {
  lancerPartie,
  lirePartie,
  type OptionsParties,
  type PartieVisible,
} from './parties/parties.ts';

const ouverte = baseDeTest();
type App = ReturnType<typeof construireApp>;
const applis: App[] = [];

/** Une application dont les parties sont reproductibles (graines 1, 2, 3…) et l'horloge réglable. */
function appli(options: { partiesMax?: number; premiereGraine?: number } = {}) {
  const { premiereGraine = 1, ...reglages } = options;
  let temps = 0;
  let graine = premiereGraine - 1;
  const reglesParties: OptionsParties = {
    maintenant: () => temps,
    tirerGraine: () => ++graine,
    dureeVieMs: 1000,
    ...reglages,
  };
  const app = construireApp({ base: ouverte.base, parties: reglesParties });
  applis.push(app);
  return { app, reglesParties, avancer: (ms: number) => (temps += ms) };
}
afterEach(async () => {
  await Promise.all(applis.splice(0).map((a) => a.close()));
});

/** Les identifiants des parties gardées en base. */
const enBase = () => ouverte.base.select({ id: parties.id }).from(parties);

async function creer(app: App, deck = 'moderne') {
  const reponse = await app.inject({ method: 'POST', url: '/api/v1/parties', payload: { deck } });
  return { reponse, partie: reponse.json<PartieVisible>() };
}

const jouer = (app: App, id: string, payload: object) =>
  app.inject({ method: 'POST', url: `/api/v1/parties/${id}/actions`, payload });

describe('decks prêtés', () => {
  it('GET /api/v1/decks liste les trois decks prêtés de 20 cartes', async () => {
    const { app } = appli();
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/decks' });
    expect(reponse.statusCode).toBe(200);
    const decks = reponse.json<{ id: string; cartes: number[] }[]>();
    expect(decks.map((d) => d.id)).toEqual(['heritage', 'moderne', 'hybride']);
    expect(decks.every((d) => d.cartes.length === 20)).toBe(true);
  });
});

describe('niveaux du bot', () => {
  it('GET /api/v1/niveaux liste les quatre niveaux, du plus simple au plus fort', async () => {
    const { app } = appli();
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/niveaux' });
    expect(reponse.json<{ id: string }[]>().map((n) => n.id)).toEqual([
      'stagiaire',
      'batch-de-nuit',
      'architecte-esb',
      'agent-autonome',
    ]);
  });

  it('crée une partie au niveau demandé (Stagiaire par défaut), refuse un niveau inconnu', async () => {
    const { app } = appli();
    expect((await creer(app)).partie.niveau).toBe('stagiaire');
    const difficile = await app.inject({
      method: 'POST',
      url: '/api/v1/parties',
      payload: { deck: 'moderne', niveau: 'agent-autonome' },
    });
    expect(difficile.json<PartieVisible>().niveau).toBe('agent-autonome');
    const inconnu = await app.inject({
      method: 'POST',
      url: '/api/v1/parties',
      payload: { deck: 'moderne', niveau: 'expert' },
    });
    expect(inconnu.statusCode).toBe(422);
    expect(inconnu.json()).toMatchObject({ title: 'Niveau de bot inconnu' });
  });

  it('mène une partie contre l’Agent autonome jusqu’à son terme', async () => {
    const { app } = appli();
    const creation = await app.inject({
      method: 'POST',
      url: '/api/v1/parties',
      payload: { deck: 'heritage', niveau: 'agent-autonome' },
    });
    let partie = creation.json<PartieVisible>();
    let tours = 0;
    while (!partie.vue.issue) {
      tours += 1;
      if (tours > 30) throw new Error('La partie ne se termine pas.');
      partie = (await jouer(app, partie.id, { type: 'finirTour' })).json<PartieVisible>();
    }
    expect(partie.vue.issue).not.toBeNull();
  });
});

describe('parties contre le bot', () => {
  it('crée une partie : identifiant UUID, vue du joueur, main adverse cachée, et c’est à lui de jouer', async () => {
    const { app } = appli();
    const { reponse, partie } = await creer(app, 'heritage');
    expect(reponse.statusCode).toBe(201);
    expect(partie.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(partie.deck).toBe('heritage');
    expect(partie.vue.joueur).toBe('j1');
    expect(partie.vue.actif).toBe('j1');
    expect(typeof partie.vue.adversaire.main).toBe('number');
    expect(partie.vue.actions.length).toBeGreaterThan(0);
    expect(JSON.stringify(partie)).not.toContain('"journal"');
  });

  it('dit pourquoi chaque carte de la main qui ne se joue pas ne se joue pas (US-071)', async () => {
    const { app } = appli();
    const { partie } = await creer(app, 'heritage');
    const { main } = partie.vue.moi;
    const joue = new Set(['poser', 'evoluer', 'jouer', 'migrer', 'router']);
    for (const carte of main) {
      const jouable = partie.vue.actions.some(
        (a) => joue.has(a.type) && 'carte' in a && a.carte === carte.id,
      );
      expect(carte.injouable === null).toBe(jouable);
      if (!jouable) expect(carte.injouable).toEqual(expect.any(String));
    }
    // Premier tour, 1 Débit : au moins une carte de la main est trop chère.
    expect(main.some((c) => c.injouable?.startsWith('Il vous faut'))).toBe(true);
  });

  it('fait jouer le premier tour du bot quand il commence', async () => {
    // Graine 3 : le tirage au sort fait commencer le bot (j2), qui a donc déjà joué son tour.
    const { app } = appli({ premiereGraine: 3 });
    const { partie } = await creer(app);
    expect(partie.evenements.find((e) => e.type === 'debut-tour')).toMatchObject({ joueur: 'j2' });
    expect(partie.evenements.some((e) => e.type === 'pose' && e.joueur === 'j2')).toBe(true);
    expect(partie.vue.actif).toBe('j1');
  });

  it('refuse un deck inconnu (422) et un corps invalide (400)', async () => {
    const { app } = appli();
    const inconnu = await creer(app, 'inexistant');
    expect(inconnu.reponse.statusCode).toBe(422);
    expect(inconnu.reponse.headers['content-type']).toContain('application/problem+json');
    const invalide = await app.inject({ method: 'POST', url: '/api/v1/parties', payload: {} });
    expect(invalide.statusCode).toBe(400);
  });

  it('relit une partie avec tout son journal visible, sans les cartes piochées par le bot', async () => {
    const { app } = appli();
    const { partie } = await creer(app);
    const lue = await app.inject({ method: 'GET', url: `/api/v1/parties/${partie.id}` });
    expect(lue.statusCode).toBe(200);
    const evenements = lue.json<PartieVisible>().evenements;
    expect(evenements.some((e) => e.type === 'pioche')).toBe(true);
    expect(evenements.every((e) => !('pour' in e) || e.pour === 'j1')).toBe(true);
  });

  it('applique une action, puis fait jouer le bot après la fin du tour', async () => {
    const { app } = appli();
    const { partie } = await creer(app);
    const tour = partie.vue.tour;
    const reponse = await jouer(app, partie.id, { type: 'finirTour' });
    expect(reponse.statusCode).toBe(200);
    const apres = reponse.json<PartieVisible>();
    expect(apres.vue.tour).toBe(tour + 2);
    expect(apres.vue.actif).toBe('j1');
    expect(apres.evenements.filter((e) => e.type === 'debut-tour')).toHaveLength(2);
  });

  it('refuse une action illégale (422 avec son code) et une action mal formée (400)', async () => {
    const { app } = appli();
    const { partie } = await creer(app);
    const illegale = await jouer(app, partie.id, {
      type: 'attaquer',
      attaquant: 'zz',
      cible: 'si',
    });
    expect(illegale.statusCode).toBe(422);
    expect(illegale.json()).toMatchObject({
      status: 422,
      title: 'Action refusée',
      code: 'carte-absente',
    });
    const malFormee = await jouer(app, partie.id, { type: 'tricher' });
    expect(malFormee.statusCode).toBe(400);
  });

  it('répond 404 pour une partie inconnue ou expirée', async () => {
    const { app, avancer } = appli();
    const inconnue = await app.inject({ method: 'GET', url: '/api/v1/parties/nimporte-quoi' });
    expect(inconnue.statusCode).toBe(404);
    const absente = await app.inject({ method: 'GET', url: `/api/v1/parties/${randomUUID()}` });
    expect(absente.statusCode).toBe(404);
    const { partie } = await creer(app);
    avancer(1001);
    const expiree = await jouer(app, partie.id, { type: 'finirTour' });
    expect(expiree.statusCode).toBe(404);
    expect(expiree.json()).toMatchObject({ title: 'Partie introuvable ou expirée' });
  });

  it('compte la durée de vie depuis le dernier coup, qu’une lecture ne prolonge pas (US-052)', async () => {
    const { app, avancer } = appli();
    const { partie } = await creer(app);
    avancer(600);
    expect((await jouer(app, partie.id, { type: 'finirTour' })).statusCode).toBe(200);
    avancer(600);
    const lire = () => app.inject({ method: 'GET', url: `/api/v1/parties/${partie.id}` });
    expect((await lire()).statusCode).toBe(200);
    avancer(600);
    expect((await lire()).statusCode).toBe(404);
  });

  it('purge les parties expirées à la création suivante (US-052)', async () => {
    const { app, avancer } = appli();
    const ancienne = (await creer(app)).partie;
    avancer(1001);
    // Expirée, elle reste en base jusqu'à la création suivante.
    expect(await enBase()).toEqual([{ id: ancienne.id }]);
    const nouvelle = (await creer(app)).partie;
    expect(await enBase()).toEqual([{ id: nouvelle.id }]);
  });

  it('reprend une partie après un redémarrage de l’API sur la même base (US-052)', async () => {
    const avant = appli();
    const { partie } = await creer(avant.app);
    await avant.app.close();
    // Une nouvelle instance, sur la même base : la partie reprend là où elle en était.
    const apres = construireApp({ base: ouverte.base, parties: avant.reglesParties });
    applis.push(apres);
    const relue = await apres.inject({ method: 'GET', url: `/api/v1/parties/${partie.id}` });
    expect(relue.statusCode).toBe(200);
    expect(relue.json<PartieVisible>().vue).toEqual(partie.vue);
    const suite = await jouer(apres, partie.id, { type: 'finirTour' });
    expect(suite.statusCode).toBe(200);
    expect(suite.json<PartieVisible>().vue.tour).toBe(partie.vue.tour + 2);
  });

  it('donne sa version en ETag, et refuse (409) une action sur une version dépassée (US-052)', async () => {
    const { app } = appli();
    const { reponse, partie } = await creer(app);
    expect(partie.version).toBe(0);
    expect(reponse.headers['etag']).toBe('"0"');
    const finirTour = (version: string) =>
      app.inject({
        method: 'POST',
        url: `/api/v1/parties/${partie.id}/actions`,
        headers: { 'if-match': version },
        payload: { type: 'finirTour' },
      });
    const premiere = await finirTour('"0"');
    expect(premiere.statusCode).toBe(200);
    expect(premiere.headers['etag']).toBe('"1"');
    expect(premiere.json<PartieVisible>().version).toBe(1);
    // Un double clic : la seconde fin de tour porte encore la version 0.
    const doublon = await finirTour('"0"');
    expect(doublon.statusCode).toBe(409);
    expect(doublon.headers['content-type']).toContain('application/problem+json');
    const relue = await app.inject({ method: 'GET', url: `/api/v1/parties/${partie.id}` });
    expect(relue.headers['etag']).toBe('"1"');
    expect(relue.json<PartieVisible>().vue.tour).toBe(partie.vue.tour + 2);
  });

  it('au plafond, oublie la partie la moins récemment jouée', async () => {
    const { app, avancer } = appli({ partiesMax: 2 });
    const premiere = (await creer(app)).partie;
    avancer(10);
    const deuxieme = (await creer(app)).partie;
    avancer(10);
    await creer(app);
    const lire = (id: string) => app.inject({ method: 'GET', url: `/api/v1/parties/${id}` });
    expect((await lire(premiere.id)).statusCode).toBe(404);
    expect((await lire(deuxieme.id)).statusCode).toBe(200);
  });

  it('au plafond, oublie d’abord les parties anonymes, puis celles des joueurs connectés (US-047)', async () => {
    let temps = 0;
    const options: OptionsParties = {
      partiesMax: 2,
      maintenant: () => temps,
      tirerGraine: () => 1,
    };
    const { joueur, jeton } = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
    const ada = { joueurId: joueur.id, session: empreinteJeton(jeton) };
    const creerDans = async (proprietaire: typeof ada | null = null) => {
      temps += 10;
      const resultat = await lancerPartie(
        ouverte.base,
        'moderne',
        undefined,
        proprietaire,
        options,
      );
      if (!resultat.ok) throw new Error(resultat.raison);
      return resultat.valeur.id;
    };
    const lire = (id: string, session: string | null) =>
      lirePartie(ouverte.base, id, session, options);
    const connectee = await creerDans(ada);
    const anonyme = await creerDans();
    // Un afflux de parties anonymes n'évince que des parties anonymes, même plus récentes.
    const suivante = await creerDans();
    expect(await lire(anonyme, null)).toMatchObject({ ok: false, raison: 'partie-inconnue' });
    expect((await lire(connectee, ada.session)).ok).toBe(true);
    expect((await lire(suivante, null)).ok).toBe(true);
    // Sans partie anonyme à évincer, la moins récemment jouée part.
    await creerDans(ada);
    await creerDans(ada);
    expect((await lire(connectee, ada.session)).ok).toBe(false);
    expect(await enBase()).toHaveLength(2);
  });

  it('disparaît avec la session qui l’a lancée (US-052)', async () => {
    const { app } = appli();
    const { jeton } = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
    const entetes = { authorization: `Bearer ${jeton}` };
    const reponse = await app.inject({
      method: 'POST',
      url: '/api/v1/parties',
      headers: entetes,
      payload: { deck: 'moderne' },
    });
    const { id } = reponse.json<PartieVisible>();
    expect(await enBase()).toEqual([{ id }]);
    await app.inject({ method: 'DELETE', url: '/api/v1/sessions/courante', headers: entetes });
    expect(await ouverte.base.select().from(parties).where(eq(parties.id, id))).toEqual([]);
  });

  it('accepte l’action jouer (sort ou incident) avec ses cibles, et refuse des cibles invalides', async () => {
    const { app } = appli();
    let { partie } = await creer(app, 'hybride');
    let jeu = partie.vue.actions.find((a) => a.type === 'jouer');
    for (let tour = 0; !jeu && !partie.vue.issue && tour < 15; tour++) {
      partie = (await jouer(app, partie.id, { type: 'finirTour' })).json<PartieVisible>();
      jeu = partie.vue.actions.find((a) => a.type === 'jouer');
    }
    expect(jeu, 'un sort ou un incident jouable').toBeDefined();
    if (jeu?.type !== 'jouer') return;
    const mauvaises = await jouer(app, partie.id, { ...jeu, cibles: ['inconnue', 'si', 'x'] });
    expect(mauvaises.json()).toMatchObject({ status: 422, code: 'cible-invalide' });
    const reponse = await jouer(app, partie.id, jeu);
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json<PartieVisible>().evenements[0]).toMatchObject({ type: 'jeu' });
  });

  it('mène une partie jusqu’à son terme, puis refuse toute nouvelle action', async () => {
    const { app } = appli();
    let { partie } = await creer(app, 'hybride');
    let actions = 0;
    while (!partie.vue.issue) {
      actions += 1;
      if (actions > 500) throw new Error('La partie ne se termine pas.');
      const vue: VueJoueur = { ...partie.vue, journal: [] };
      const reponse = await jouer(app, partie.id, choisirActionBatchDeNuit(vue));
      expect(reponse.statusCode).toBe(200);
      partie = reponse.json<PartieVisible>();
    }
    expect(partie.evenements.at(-1)?.type).toBe('fin-partie');
    expect(partie.vue.actions).toEqual([]);
    const apres = await jouer(app, partie.id, { type: 'finirTour' });
    expect(apres.json()).toMatchObject({ status: 422, code: 'partie-terminee' });
  });
});

describe('conseil (US-066)', () => {
  const conseil = (app: App, id: string) =>
    app.inject({ method: 'GET', url: `/api/v1/parties/${id}/conseil` });

  it('conseille une des actions possibles, l’explique, et donne la version où il vaut', async () => {
    const { app } = appli();
    const { partie } = await creer(app);
    const reponse = await conseil(app, partie.id);
    expect(reponse.statusCode).toBe(200);
    const lu = reponse.json<{ version: number; action: object; explication: string }>();
    // Rien d'autre que le coup et sa raison : ni la main ni la pioche du bot.
    expect(Object.keys(lu).sort()).toEqual(['action', 'explication', 'version']);
    expect(partie.vue.actions).toContainEqual(lu.action);
    expect(lu.explication).toMatch(
      /^(Posez|Faites|Jouez|Attaquez|Décommissionnez|Finissez|Migrez|Utilisez) /,
    );
    expect(lu.version).toBe(partie.version);
    expect(reponse.headers.etag).toBe(`"${partie.version}"`);
  });

  it('se suit jusqu’à la fin de la partie, puis répond 409 : plus rien à conseiller', async () => {
    const { app } = appli();
    let { partie } = await creer(app, 'hybride');
    let actions = 0;
    while (!partie.vue.issue) {
      actions += 1;
      if (actions > 500) throw new Error('La partie ne se termine pas.');
      const { action } = (await conseil(app, partie.id)).json<{ action: object }>();
      const reponse = await jouer(app, partie.id, action);
      expect(reponse.statusCode).toBe(200);
      partie = reponse.json<PartieVisible>();
    }
    const apres = await conseil(app, partie.id);
    expect(apres.statusCode).toBe(409);
    expect(apres.json()).toMatchObject({ status: 409, title: expect.stringContaining('conseil') });
  });

  it('répond 404 pour une partie inconnue, et n’existe pas pour les duels', async () => {
    const { app } = appli();
    expect((await conseil(app, randomUUID())).statusCode).toBe(404);
    const duel = await app.inject({ method: 'GET', url: `/api/v1/duels/${randomUUID()}/conseil` });
    expect(duel.statusCode).toBe(404);
  });
});
