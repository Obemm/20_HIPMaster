import { choisirActionBatchDeNuit, type VueJoueur } from '@hipmaster/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import type { PartieVisible } from './parties/depot.ts';

type App = ReturnType<typeof construireApp>;
const applis: App[] = [];

/** Une application dont les parties sont reproductibles (graines 1, 2, 3…) et l'horloge réglable. */
function appli(options: { partiesMax?: number; premiereGraine?: number } = {}) {
  const { premiereGraine = 1, ...reglages } = options;
  let temps = 0;
  let graine = premiereGraine - 1;
  const app = construireApp({
    parties: {
      maintenant: () => temps,
      tirerGraine: () => ++graine,
      dureeVieMs: 1000,
      ...reglages,
    },
  });
  applis.push(app);
  return { app, avancer: (ms: number) => (temps += ms) };
}
afterEach(async () => {
  await Promise.all(applis.splice(0).map((a) => a.close()));
});

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
    const { partie } = await creer(app);
    avancer(1001);
    const expiree = await jouer(app, partie.id, { type: 'finirTour' });
    expect(expiree.statusCode).toBe(404);
    expect(expiree.json()).toMatchObject({ title: 'Partie introuvable ou expirée' });
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

  it('accepte l’action jouer (sort ou incident) avec ses cibles, et refuse des cibles invalides', async () => {
    const { app } = appli();
    let { partie } = await creer(app, 'moderne');
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
