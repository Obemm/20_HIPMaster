import { choisirActionBatchDeNuit, type VueJoueur } from '@hipmaster/domain';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { duels } from './db/schema.ts';
import type { DuelVisible } from './duels/duels.ts';

const ouverte = baseDeTest();
let app: ReturnType<typeof construireApp>;

beforeEach(() => {
  let graine = 0;
  app = construireApp({ base: ouverte.base, duels: { tirerGraine: () => ++graine } });
});
afterEach(() => app.close());

async function joueur(pseudo: string) {
  const { jeton } = await creerJoueur(ouverte.base, pseudo, CLE_CODES_DEVELOPPEMENT);
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
    // Le second joueur reçoit 2 Débit à son premier tour, en duel comme contre le bot (ADR 0026).
    expect(apres.vue?.moi.debit).toBe(2);
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

describe('mes duels (US-035)', () => {
  interface MesDuels {
    aMonTour: number;
    duels: {
      id: string;
      statut: string;
      adversaire: { pseudo: string } | null;
      monTour: boolean;
    }[];
  }

  it('liste d’abord les duels à mon tour, puis ceux de l’adversaire, les défis en attente et les terminés', async () => {
    const { ada, bob, id, lance } = await duelLance();
    const attente = (await requete('POST', '/duels', ada, { deck: 'hybride' })).json<DuelVisible>();
    const adaCommence = lance.vue?.actif === 'j1';

    const deAda = (await requete('GET', '/moi/duels', ada)).json<MesDuels>();
    expect(deAda.duels.map((d) => d.id)).toEqual([id, attente.id]);
    expect(deAda.duels[0]).toMatchObject({ adversaire: { pseudo: 'Bob' }, monTour: adaCommence });
    expect(deAda.duels[1]).toMatchObject({ statut: 'attente', adversaire: null, monTour: false });
    expect(deAda.aMonTour).toBe(adaCommence ? 1 : 0);

    const deBob = (await requete('GET', '/moi/duels', bob)).json<MesDuels>();
    expect(deBob.duels.map((d) => d.id)).toEqual([id]);
    expect(deBob.duels[0]).toMatchObject({ adversaire: { pseudo: 'Ada' }, monTour: !adaCommence });
    expect(deBob.aMonTour).toBe(adaCommence ? 0 : 1);
  });

  it('un duel à mon tour passe devant un duel plus récent au tour de l’adversaire', async () => {
    const { ada, bob, id, lance } = await duelLance();
    const actif = lance.vue?.actif === 'j1' ? ada : bob;
    const passif = actif === ada ? bob : ada;
    // Un second duel, plus récent, où le joueur passif attend l'autre.
    const second = (
      await requete('POST', '/duels', passif, { deck: 'moderne' })
    ).json<DuelVisible>();
    const rejoint = (
      await requete('POST', `/duels/${second.id}/rejoindre`, actif, { deck: 'heritage' })
    ).json<DuelVisible>();
    // Dans ce second duel, `actif` (qui l'a rejoint, camp j2) doit attendre : s'il commence, il passe son tour.
    if (rejoint.vue?.actif === 'j2') {
      await requete('POST', `/duels/${second.id}/actions`, actif, { type: 'finirTour' });
    }
    const liste = (await requete('GET', '/moi/duels', actif)).json<MesDuels>();
    expect(liste.duels.map((d) => d.id)).toEqual([id, second.id]);
    expect(liste.duels[0]).toMatchObject({ monTour: true });
    expect(liste.duels[1]).toMatchObject({ monTour: false });
  });

  it('exige un compte', async () => {
    expect((await requete('GET', '/moi/duels', {})).statusCode).toBe(401);
  });
});

describe('abandon et forfait (US-036)', () => {
  const HEURE = 60 * 60 * 1000;

  it('abandonner fait gagner l’adversaire ; un duel terminé ne s’abandonne plus', async () => {
    const { ada, bob, id } = await duelLance();
    const abandon = await requete('POST', `/duels/${id}/abandon`, ada);
    expect(abandon.statusCode).toBe(200);
    expect(abandon.json<DuelVisible>()).toMatchObject({
      statut: 'termine',
      echeance: null,
      vue: { issue: { gagnant: 'j2', raison: 'abandon' } },
    });
    expect((await requete('POST', `/duels/${id}/abandon`, bob)).statusCode).toBe(409);

    const deBob = (await requete('GET', '/moi/duels', bob)).json<{
      duels: { resultat: string; raison: string }[];
    }>();
    expect(deBob.duels[0]).toMatchObject({ resultat: 'victoire', raison: 'abandon' });
  });

  it('un tiers ne peut pas abandonner, et un défi en attente s’annule plutôt qu’il ne s’abandonne', async () => {
    const { id } = await duelLance();
    const eve = await joueur('Eve');
    expect((await requete('POST', `/duels/${id}/abandon`, eve)).statusCode).toBe(404);
    const ada = await joueur('Ada2');
    const attente = (await requete('POST', '/duels', ada, { deck: 'moderne' })).json<DuelVisible>();
    expect((await requete('POST', `/duels/${attente.id}/abandon`, ada)).statusCode).toBe(409);
  });

  it('sans coup pendant 72 h, le joueur actif perd par forfait, évalué à la lecture', async () => {
    let maintenant = Date.now();
    const appli = construireApp({ base: ouverte.base, duels: { maintenant: () => maintenant } });
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const appeler = (method: 'GET' | 'POST', url: string, entetes: object, payload?: object) =>
      appli.inject({
        method,
        url: `/api/v1${url}`,
        headers: { ...entetes },
        ...(payload && { payload }),
      });
    const cree = (await appeler('POST', '/duels', ada, { deck: 'moderne' })).json<DuelVisible>();
    const lance = (
      await appeler('POST', `/duels/${cree.id}/rejoindre`, bob, { deck: 'heritage' })
    ).json<DuelVisible>();
    const echeance = new Date(lance.echeance ?? '').getTime();
    expect(echeance - Date.now()).toBeGreaterThan(71 * HEURE);

    maintenant += 71 * HEURE;
    expect((await appeler('GET', `/duels/${cree.id}`, ada)).json<DuelVisible>().statut).toBe(
      'en-cours',
    );

    maintenant += 2 * HEURE;
    const perdant = lance.vue?.actif ?? 'j1';
    const apres = (await appeler('GET', '/moi/duels', ada)).json<{
      duels: { statut: string; resultat: string; raison: string }[];
    }>();
    expect(apres.duels[0]).toMatchObject({
      statut: 'termine',
      raison: 'forfait',
      resultat: perdant === 'j1' ? 'defaite' : 'victoire',
    });
    const fin = (await appeler('GET', `/duels/${cree.id}`, bob)).json<DuelVisible>();
    expect(fin.vue?.issue).toEqual({ gagnant: perdant === 'j1' ? 'j2' : 'j1', raison: 'forfait' });

    // Un coup arrivé trop tard est refusé.
    const actif = perdant === 'j1' ? ada : bob;
    const tard = await appeler('POST', `/duels/${cree.id}/actions`, actif, { type: 'finirTour' });
    expect(tard.statusCode).toBe(422);
    await appli.close();
  });
});

describe('adversaire au hasard (US-037)', () => {
  const moi = async (entetes: Record<string, string>) =>
    (await requete('GET', '/moi', entetes)).json<{ id: string }>().id;
  const hasard = (entetes: Record<string, string>, deck = 'moderne') =>
    requete('POST', '/duels/hasard', entetes, { deck });

  it('sans personne dans la file, ouvre un duel et attend ; le suivant le rejoint', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    const attente = await hasard(ada);
    expect(attente.statusCode).toBe(201);
    expect(attente.json<DuelVisible>()).toMatchObject({ statut: 'attente', ouvert: true });

    // Ada déjà dans la file y garde sa place.
    expect((await hasard(ada)).json<DuelVisible>().id).toBe(attente.json<DuelVisible>().id);

    const rejoint = await hasard(bob, 'heritage');
    expect(rejoint.statusCode).toBe(200);
    expect(rejoint.json<DuelVisible>()).toMatchObject({
      id: attente.json<DuelVisible>().id,
      statut: 'en-cours',
      createur: { pseudo: 'Ada' },
      moi: 'j2',
    });
  });

  it('ne propose jamais un défi privé, ni son propre duel', async () => {
    const ada = await joueur('Ada');
    const prive = (await requete('POST', '/duels', ada, { deck: 'moderne' })).json<DuelVisible>();
    const bob = await joueur('Bob');
    const pourBob = (await hasard(bob)).json<DuelVisible>();
    expect(pourBob.id).not.toBe(prive.id);
    expect(pourBob).toMatchObject({ statut: 'attente', ouvert: true, moi: 'j1' });
  });

  it('évite de retomber sur le dernier adversaire quand un autre joueur attend', async () => {
    const ada = await joueur('Ada');
    const bob = await joueur('Bob');
    await hasard(ada);
    await hasard(bob); // Bob affronte Ada.

    // Deux joueurs attendent (cas rare : chacun rejoint d'ordinaire le premier qui attend) ; Ada depuis plus longtemps.
    const [idAda, idEve] = await Promise.all([moi(ada), (async () => moi(await joueur('Eve')))()]);
    await ouverte.base.insert(duels).values([
      {
        createurId: idAda,
        deckCreateur: 'moderne',
        ouvert: true,
        creeLe: new Date(Date.now() - 60_000),
      },
      { createurId: idEve, deckCreateur: 'hybride', ouvert: true },
    ]);
    const pourBob = (await hasard(bob)).json<DuelVisible>();
    expect(pourBob).toMatchObject({ statut: 'en-cours', createur: { pseudo: 'Eve' } });
  });

  it('deux joueurs qui cherchent en même temps ne rejoignent pas le même duel', async () => {
    const ada = await joueur('Ada');
    await hasard(ada);
    const [bob, eve] = await Promise.all([joueur('Bob'), joueur('Eve')]);
    const [a, b] = await Promise.all([hasard(bob), hasard(eve)]);
    const statuts = [a?.json<DuelVisible>(), b?.json<DuelVisible>()].map((d) => d?.statut).sort();
    expect(statuts).toEqual(['attente', 'en-cours']);
  });

  it('on quitte la file en annulant son duel ouvert', async () => {
    const ada = await joueur('Ada');
    const ouvert = (await hasard(ada)).json<DuelVisible>();
    const quitter = await app.inject({
      method: 'DELETE',
      url: `/api/v1/duels/${ouvert.id}`,
      headers: ada,
    });
    expect(quitter.statusCode).toBe(204);
    const bob = await joueur('Bob');
    expect((await hasard(bob)).statusCode).toBe(201);
  });
});

describe('booster pour une victoire en duel (US-038)', () => {
  it('le vainqueur gagne un booster, une seule fois ; le perdant rien', async () => {
    const { ada, bob, id } = await duelLance();
    const perdant = (await requete('POST', `/duels/${id}/abandon`, ada)).json<DuelVisible>();
    expect(perdant.recompense).toBeUndefined();

    const gagnant = (await requete('GET', `/duels/${id}`, bob)).json<DuelVisible>();
    expect(gagnant.recompense).toEqual({ booster: true, plafondAtteint: false, motif: null });
    const relu = (await requete('GET', `/duels/${id}`, bob)).json<DuelVisible>();
    expect(relu.recompense?.booster).toBe(true);
    const stock = (await requete('GET', '/moi/boosters', bob)).json<{ stock: number }>();
    expect(stock.stock).toBe(6);
  });

  it('une victoire par abandon ne rapporte rien contre un adversaire déjà affronté le même jour', async () => {
    const { ada, bob, id } = await duelLance();
    await requete('POST', `/duels/${id}/abandon`, ada);
    expect(
      (await requete('GET', `/duels/${id}`, bob)).json<DuelVisible>().recompense?.booster,
    ).toBe(true);

    // Deuxième duel entre les mêmes joueurs, abandonné aussitôt : pas de booster.
    const second = (await requete('POST', '/duels', ada, { deck: 'moderne' })).json<DuelVisible>();
    await requete('POST', `/duels/${second.id}/rejoindre`, bob, { deck: 'heritage' });
    await requete('POST', `/duels/${second.id}/abandon`, ada);
    const fin = (await requete('GET', `/duels/${second.id}`, bob)).json<DuelVisible>();
    expect(fin.recompense).toEqual({
      booster: false,
      plafondAtteint: false,
      motif: 'adversaire-deja-affronte',
    });
  });
});
