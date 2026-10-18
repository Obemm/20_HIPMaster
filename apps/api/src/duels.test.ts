import { choisirActionBatchDeNuit, type VueJoueur } from '@hipmaster/domain';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { creerJoueur } from './comptes/comptes.ts';
import { type BaseOuverte, ouvrirBase } from './db/index.ts';
import type { DuelVisible } from './duels/duels.ts';

let ouverte: BaseOuverte;
let app: ReturnType<typeof construireApp>;

beforeEach(async () => {
  ouverte = await ouvrirBase({ url: null, locale: 'memory://' });
  let graine = 0;
  app = construireApp({ base: ouverte.base, duels: { tirerGraine: () => ++graine } });
});
afterEach(async () => {
  await app.close();
  await ouverte.fermer();
});

async function joueur(pseudo: string) {
  const { jeton } = await creerJoueur(ouverte.base, pseudo);
  return { authorization: `Bearer ${jeton}` };
}

const requete = (
  method: 'GET' | 'POST',
  url: string,
  entetes: Record<string, string>,
  payload?: object,
) => app.inject({ method, url: `/api/v1${url}`, headers: entetes, ...(payload && { payload }) });

/** Un duel lancé entre Ada (créatrice, j1) et Bob (j2). */
async function duelLance() {
  const ada = await joueur('Ada');
  const bob = await joueur('Bob');
  const cree = (await requete('POST', '/duels', ada, { deck: 'moderne' })).json<DuelVisible>();
  const lance = await requete('POST', `/duels/${cree.id}/rejoindre`, bob, { deck: 'heritage' });
  return { ada, bob, id: cree.id, lance: lance.json<DuelVisible>() };
}

describe('duels entre joueurs', () => {
  it('crée un duel en attente, visible par un autre joueur qui peut le rejoindre', async () => {
    const ada = await joueur('Ada');
    const reponse = await requete('POST', '/duels', ada, { deck: 'moderne' });
    expect(reponse.statusCode).toBe(201);
    expect(reponse.headers.etag).toBe('"0"');
    const duel = reponse.json<DuelVisible>();
    expect(duel).toMatchObject({
      statut: 'attente',
      createur: { pseudo: 'Ada' },
      deckCreateur: 'moderne',
      adversaire: null,
      moi: 'j1',
      vue: null,
    });

    const bob = await joueur('Bob');
    const vu = (await requete('GET', `/duels/${duel.id}`, bob)).json<DuelVisible>();
    expect(vu).toMatchObject({ statut: 'attente', moi: null, vue: null, evenements: [] });
  });

  it('refuse un deck inconnu, et exige un compte', async () => {
    const ada = await joueur('Ada');
    expect((await requete('POST', '/duels', ada, { deck: 'inconnu' })).statusCode).toBe(422);
    expect((await requete('POST', '/duels', {}, { deck: 'moderne' })).statusCode).toBe(401);
  });

  it('rejoindre lance la partie : chacun reçoit sa vue, sans la main de l’autre', async () => {
    const { ada, id, lance } = await duelLance();
    expect(lance).toMatchObject({
      statut: 'en-cours',
      version: 1,
      adversaire: { pseudo: 'Bob' },
      moi: 'j2',
    });
    const vueBob = lance.vue;
    expect(vueBob?.joueur).toBe('j2');
    expect(typeof vueBob?.adversaire.main).toBe('number');

    const vueAda = (await requete('GET', `/duels/${id}`, ada)).json<DuelVisible>().vue;
    expect(vueAda?.joueur).toBe('j1');
    expect(vueAda?.moi.main.map((c) => c.id)).not.toEqual(vueBob?.moi.main.map((c) => c.id));
    expect(vueAda?.actif).toBe(vueBob?.actif);
  });

  it('refuse de rejoindre son propre duel, ou un duel déjà commencé ; un tiers ne le voit plus', async () => {
    const ada = await joueur('Ada');
    const cree = (await requete('POST', '/duels', ada, { deck: 'moderne' })).json<DuelVisible>();
    const propre = await requete('POST', `/duels/${cree.id}/rejoindre`, ada, { deck: 'moderne' });
    expect(propre.statusCode).toBe(409);

    const bob = await joueur('Bob');
    await requete('POST', `/duels/${cree.id}/rejoindre`, bob, { deck: 'heritage' });
    const eve = await joueur('Eve');
    const tard = await requete('POST', `/duels/${cree.id}/rejoindre`, eve, { deck: 'hybride' });
    expect(tard.statusCode).toBe(409);
    expect((await requete('GET', `/duels/${cree.id}`, eve)).statusCode).toBe(404);
    expect(
      (await requete('POST', `/duels/${cree.id}/actions`, eve, { type: 'finirTour' })).statusCode,
    ).toBe(404);
  });

  it('seul le joueur actif peut jouer ; l’autre reçoit les événements visibles depuis son curseur', async () => {
    const { ada, bob, id, lance } = await duelLance();
    const actif = lance.vue?.actif === 'j1' ? ada : bob;
    const passif = actif === ada ? bob : ada;

    const horsTour = await requete('POST', `/duels/${id}/actions`, passif, { type: 'finirTour' });
    expect(horsTour.statusCode).toBe(409);
    expect(horsTour.json<{ title: string }>().title).toBe('Ce n’est pas votre tour');

    const avant = (await requete('GET', `/duels/${id}`, passif)).json<DuelVisible>();
    const fin = await requete('POST', `/duels/${id}/actions`, actif, { type: 'finirTour' });
    expect(fin.statusCode).toBe(200);
    expect(fin.headers.etag).toBe('"2"');

    const apres = (
      await requete('GET', `/duels/${id}?depuis=${avant.curseur}`, passif)
    ).json<DuelVisible>();
    expect(apres.version).toBe(2);
    expect(apres.vue?.actif).toBe(apres.moi);
    expect(apres.evenements.map((e) => e.type)).toContain('debut-tour');
  });

  it('répond 304 si rien n’a changé, et refuse une action fondée sur une version périmée', async () => {
    const { ada, bob, id, lance } = await duelLance();
    const actif = lance.vue?.actif === 'j1' ? ada : bob;
    const inchange = await requete('GET', `/duels/${id}`, { ...ada, 'if-none-match': '"1"' });
    expect(inchange.statusCode).toBe(304);
    expect(inchange.body).toBe('');

    const perimee = await requete(
      'POST',
      `/duels/${id}/actions`,
      { ...actif, 'if-match': '"0"' },
      { type: 'finirTour' },
    );
    expect(perimee.statusCode).toBe(409);
    const bonne = await requete(
      'POST',
      `/duels/${id}/actions`,
      { ...actif, 'if-match': '"1"' },
      { type: 'finirTour' },
    );
    expect(bonne.statusCode).toBe(200);
  });

  it('deux actions simultanées du joueur actif ne s’appliquent pas sur la même version', async () => {
    const { ada, bob, id, lance } = await duelLance();
    const actif = lance.vue?.actif === 'j1' ? ada : bob;
    const [a, b] = await Promise.all(
      [1, 2].map(() =>
        requete(
          'POST',
          `/duels/${id}/actions`,
          { ...actif, 'if-match': '"1"' },
          { type: 'finirTour' },
        ),
      ),
    );
    expect([a?.statusCode, b?.statusCode].sort()).toEqual([200, 409]);
  });

  it('se joue jusqu’au bout, puis refuse toute action', async () => {
    const { ada, bob, id, lance } = await duelLance();
    const entetes = { j1: ada, j2: bob };
    let duel = lance;
    let actions = 0;
    while (duel.statut !== 'termine') {
      actions += 1;
      if (actions > 1000) throw new Error('Le duel ne se termine pas.');
      const actif = duel.vue?.actif ?? 'j1';
      const vue = (await requete('GET', `/duels/${id}`, entetes[actif])).json<DuelVisible>().vue;
      if (!vue) throw new Error('Vue absente.');
      const action = choisirActionBatchDeNuit({ ...vue, journal: [] } as VueJoueur);
      const reponse = await requete('POST', `/duels/${id}/actions`, entetes[actif], action);
      expect(reponse.statusCode).toBe(200);
      duel = reponse.json<DuelVisible>();
    }
    expect(duel.vue?.issue).not.toBeNull();
    const apres = await requete('POST', `/duels/${id}/actions`, ada, { type: 'finirTour' });
    expect(apres.statusCode).toBe(422);
  });
});

describe('défis (US-033)', () => {
  it('le créateur peut annuler un défi tant qu’il n’est pas accepté, pas un autre joueur', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const cree = (await requete('POST', '/duels', ada, { deck: 'moderne' })).json<DuelVisible>();
    const annuler = (entetes: Record<string, string>) =>
      app.inject({ method: 'DELETE', url: `/api/v1/duels/${cree.id}`, headers: entetes });
    expect((await annuler(bob)).statusCode).toBe(404);
    expect((await annuler(ada)).statusCode).toBe(204);
    expect((await requete('GET', `/duels/${cree.id}`, ada)).statusCode).toBe(404);

    const lance = (await duelLance()).id;
    const refus = await app.inject({
      method: 'DELETE',
      url: `/api/v1/duels/${lance}`,
      headers: ada,
    });
    expect(refus.statusCode).toBe(404);
  });

  it('un défi commencé ne s’annule plus', async () => {
    const { ada, id } = await duelLance();
    const refus = await app.inject({ method: 'DELETE', url: `/api/v1/duels/${id}`, headers: ada });
    expect(refus.statusCode).toBe(409);
  });

  it('un défi non accepté expire après 7 jours (410)', async () => {
    let maintenant = Date.now();
    const appli = construireApp({ base: ouverte.base, duels: { maintenant: () => maintenant } });
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const cree = (
      await appli.inject({
        method: 'POST',
        url: '/api/v1/duels',
        headers: ada,
        payload: { deck: 'moderne' },
      })
    ).json<DuelVisible>();
    maintenant += 7 * 24 * 60 * 60 * 1000 + 60_000;
    const lu = await appli.inject({ method: 'GET', url: `/api/v1/duels/${cree.id}`, headers: bob });
    expect(lu.statusCode).toBe(410);
    const rejoint = await appli.inject({
      method: 'POST',
      url: `/api/v1/duels/${cree.id}/rejoindre`,
      headers: bob,
      payload: { deck: 'heritage' },
    });
    expect(rejoint.statusCode).toBe(410);
    await appli.close();
  });
});
