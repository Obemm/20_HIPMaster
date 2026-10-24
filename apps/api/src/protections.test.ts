import { afterEach, describe, expect, it } from 'vitest';
import { type App, construireApp } from './app.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import type { DuelVisible } from './duels/duels.ts';
import { creerJournal } from './journaux.ts';
import { LIMITES_DEBIT, type LimitesDebit, limitesMultipliees } from './limites.ts';
import type { PartieVisible } from './parties/parties.ts';

// Protections avant l'ouverture (US-047, ADR 0025).

const ouverte = baseDeTest();
const applis: App[] = [];
afterEach(async () => {
  await Promise.all(applis.splice(0).map((a) => a.close()));
});

function appli(options: Parameters<typeof construireApp>[0] = {}): App {
  const app = construireApp({ base: ouverte.base, ...options });
  applis.push(app);
  return app;
}

/** Les limites de production, sauf celles qu'un test resserre. */
const limites = (resserrees: Partial<LimitesDebit>): LimitesDebit => ({
  ...LIMITES_DEBIT,
  ...resserrees,
});

const UNE_PAR_MINUTE = { max: 1, fenetreMs: 60_000 };

async function jetonDe(pseudo: string): Promise<string> {
  return (await creerJoueur(ouverte.base, pseudo, CLE_CODES_DEVELOPPEMENT)).jeton;
}

const auth = (jeton: string) => ({ authorization: `Bearer ${jeton}` });

describe('limitation de débit par adresse', () => {
  it('au-delà de sa limite, une adresse reçoit 429 en Problem Details avec Retry-After ; les autres non', async () => {
    const app = appli({ limites: limites({ inscription: { max: 2, fenetreMs: 3_600_000 } }) });
    const creer = (adresse: string) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/joueurs',
        remoteAddress: adresse,
        payload: { pseudo: 'Ada' },
      });
    expect((await creer('203.0.113.1')).statusCode).toBe(201);
    const deuxieme = await creer('203.0.113.1');
    expect(deuxieme.statusCode).toBe(201);
    expect(deuxieme.headers['x-ratelimit-remaining']).toBe('0');

    const refus = await creer('203.0.113.1');
    expect(refus.statusCode).toBe(429);
    expect(refus.headers['content-type']).toContain('application/problem+json');
    expect(refus.json()).toEqual({
      type: 'about:blank',
      title: expect.stringMatching(/^Trop de requêtes : réessayez dans \d+ s$/),
      status: 429,
    });
    const attente = Number(refus.headers['retry-after']);
    expect(attente).toBeGreaterThan(3500);
    expect(attente).toBeLessThanOrEqual(3600);
    expect(refus.headers['x-ratelimit-limit']).toBe('2');
    expect(refus.headers['cache-control']).toBe('no-store');

    expect((await creer('203.0.113.2')).statusCode).toBe(201);
  });

  it('limite la connexion par code, la création de partie, ses actions et ses conseils', async () => {
    const app = appli({
      limites: limites({
        connexion: UNE_PAR_MINUTE,
        creationPartie: UNE_PAR_MINUTE,
        actionPartie: UNE_PAR_MINUTE,
        conseilPartie: UNE_PAR_MINUTE,
      }),
    });
    const connexion = () =>
      app.inject({ method: 'POST', url: '/api/v1/sessions', payload: { code: 'AAAA-BBBB-CCCC' } });
    expect((await connexion()).statusCode).toBe(401);
    expect((await connexion()).statusCode).toBe(429);

    const creerPartie = () =>
      app.inject({ method: 'POST', url: '/api/v1/parties', payload: { deck: 'moderne' } });
    const partie = (await creerPartie()).json<PartieVisible>();
    expect((await creerPartie()).statusCode).toBe(429);

    const finir = () =>
      app.inject({
        method: 'POST',
        url: `/api/v1/parties/${partie.id}/actions`,
        payload: { type: 'finirTour' },
      });
    expect((await finir()).statusCode).toBe(200);
    expect((await finir()).statusCode).toBe(429);
    const conseil = () =>
      app.inject({ method: 'GET', url: `/api/v1/parties/${partie.id}/conseil` });
    expect((await conseil()).statusCode).toBe(200);
    expect((await conseil()).statusCode).toBe(429);
    // La lecture d'une partie n'est pas limitée.
    expect(
      (await app.inject({ method: 'GET', url: `/api/v1/parties/${partie.id}` })).statusCode,
    ).toBe(200);
  });

  it('limite chaque route de duel, avec son propre compteur', async () => {
    const app = appli({
      limites: limites({
        creationDuel: UNE_PAR_MINUTE,
        coupDuel: UNE_PAR_MINUTE,
        lectureDuel: UNE_PAR_MINUTE,
      }),
    });
    const ada = auth(await jetonDe('Ada'));
    const bob = auth(await jetonDe('Bob'));
    const requete = (
      method: 'GET' | 'POST' | 'DELETE',
      url: string,
      entetes: Record<string, string>,
      payload?: object,
    ) =>
      app.inject({
        method,
        url: `/api/v1${url}`,
        headers: entetes,
        // Bob joue depuis une autre adresse : chacun a ses compteurs.
        remoteAddress: entetes === bob ? '198.51.100.2' : '198.51.100.1',
        ...(payload && { payload }),
      });

    const duel = (await requete('POST', '/duels', ada, { deck: 'moderne' })).json<DuelVisible>();
    expect((await requete('POST', '/duels', ada, { deck: 'moderne' })).statusCode).toBe(429);
    expect((await requete('POST', '/duels/hasard', ada, { deck: 'moderne' })).statusCode).toBe(201);
    expect((await requete('POST', '/duels/hasard', ada, { deck: 'moderne' })).statusCode).toBe(429);

    expect((await requete('GET', `/duels/${duel.id}`, ada)).statusCode).toBe(200);
    expect((await requete('GET', `/duels/${duel.id}`, ada)).statusCode).toBe(429);
    expect((await requete('GET', '/moi/duels', ada)).statusCode).toBe(200);
    expect((await requete('GET', '/moi/duels', ada)).statusCode).toBe(429);

    const rejoint = await requete('POST', `/duels/${duel.id}/rejoindre`, bob, { deck: 'heritage' });
    expect(rejoint.statusCode).toBe(200);
    expect(
      (await requete('POST', `/duels/${duel.id}/rejoindre`, bob, { deck: 'heritage' })).statusCode,
    ).toBe(429);
    expect((await requete('POST', `/duels/${duel.id}/abandon`, ada)).statusCode).toBe(200);
    expect((await requete('POST', `/duels/${duel.id}/abandon`, ada)).statusCode).toBe(429);
    expect((await requete('DELETE', `/duels/${duel.id}`, ada)).statusCode).toBe(409);
    expect((await requete('DELETE', `/duels/${duel.id}`, ada)).statusCode).toBe(429);
    const jouer = () => requete('POST', `/duels/${duel.id}/actions`, ada, { type: 'finirTour' });
    expect((await jouer()).statusCode).not.toBe(429);
    expect((await jouer()).statusCode).toBe(429);
  });

  it('une adresse IPv6 compte pour son préfixe /64', async () => {
    const app = appli({ limites: limites({ creationPartie: UNE_PAR_MINUTE }) });
    const creer = (adresse: string) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/parties',
        remoteAddress: adresse,
        payload: { deck: 'moderne' },
      });
    expect((await creer('2001:db8:1:2::1')).statusCode).toBe(201);
    expect((await creer('2001:db8:1:2:ffff::9')).statusCode).toBe(429);
    expect((await creer('2001:db8:1:3::1')).statusCode).toBe(201);
  });

  it('se règle par un facteur, à une requête par fenêtre au moins', () => {
    expect(limitesMultipliees(2).inscription).toEqual({ max: 60, fenetreMs: 3_600_000 });
    expect(limitesMultipliees(1)).toEqual(LIMITES_DEBIT);
    expect(limitesMultipliees(0.001).connexion.max).toBe(1);
  });

  it('sans limites (développement, tests), aucune route ne répond 429', async () => {
    const app = appli();
    for (let i = 0; i < 12; i++) {
      const reponse = await app.inject({
        method: 'POST',
        url: '/api/v1/sessions',
        payload: { code: 'AAAA-BBBB-CCCC' },
      });
      expect(reponse.statusCode).toBe(401);
    }
  });
});

describe('adresse du joueur derrière les relais', () => {
  /** Une application dont le journal garde l'adresse retenue pour chaque requête. */
  function appliJournalisee(options: Parameters<typeof construireApp>[0]) {
    const adresses: string[] = [];
    const journal = creerJournal({
      niveau: 'info',
      flux: {
        write: (ligne: string) => {
          const lue = JSON.parse(ligne) as { message: string; req?: { remoteAddress: string } };
          if (lue.message === 'incoming request' && lue.req) adresses.push(lue.req.remoteAddress);
        },
      },
    });
    return { app: appli({ journal, ...options }), adresses };
  }

  it('avec deux relais (Firebase Hosting, frontal de Cloud Run), retient le joueur, même avec un X-Forwarded-For inventé', async () => {
    const { app, adresses } = appliJournalisee({
      proxysDeConfiance: 2,
      limites: limites({ inscription: UNE_PAR_MINUTE }),
    });
    // Le frontal de Cloud Run se connecte à l'API ; Firebase Hosting l'a précédé et a noté l'adresse du joueur.
    const creer = (transmis: string) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/joueurs',
        remoteAddress: '192.0.2.10',
        headers: { 'x-forwarded-for': transmis },
        payload: { pseudo: 'Ada' },
      });
    expect((await creer('198.51.100.7, 35.191.0.1')).statusCode).toBe(201);
    // Le joueur ajoute lui-même un maillon : il reste le même joueur, et sa limite le rattrape.
    expect((await creer('203.0.113.99, 198.51.100.7, 35.191.0.1')).statusCode).toBe(429);
    expect((await creer('198.51.100.8, 35.191.0.1')).statusCode).toBe(201);
    expect(adresses).toEqual(['198.51.100.7', '198.51.100.7', '198.51.100.8']);
  });

  it('sans relais de confiance (développement), ignore X-Forwarded-For', async () => {
    const { app, adresses } = appliJournalisee({});
    await app.inject({
      method: 'GET',
      url: '/api/v1/sante',
      remoteAddress: '127.0.0.1',
      headers: { 'x-forwarded-for': '203.0.113.99' },
    });
    expect(adresses).toEqual(['127.0.0.1']);
  });
});

describe('en-têtes et taille des requêtes', () => {
  it('jetons, codes et données du joueur ne vont dans aucun cache ; aucune réponse n’est réinterprétée', async () => {
    const app = appli();
    const creation = await app.inject({
      method: 'POST',
      url: '/api/v1/joueurs',
      payload: { pseudo: 'Ada' },
    });
    const { jeton, codeRecuperation } = creation.json<{
      jeton: string;
      codeRecuperation: string;
    }>();
    const reponses = [
      creation,
      await app.inject({
        method: 'POST',
        url: '/api/v1/sessions',
        payload: { code: codeRecuperation },
      }),
      await app.inject({ method: 'GET', url: '/api/v1/moi', headers: auth(jeton) }),
      await app.inject({ method: 'POST', url: '/api/v1/moi/code', headers: auth(jeton) }),
      await app.inject({ method: 'GET', url: '/api/v1/moi/collection', headers: auth(jeton) }),
      await app.inject({ method: 'GET', url: '/api/v1/moi' }),
      // Une carte inconnue : le catalogue n'est en cache que pour ses réponses réussies (US-057).
      await app.inject({ method: 'GET', url: '/api/v1/cartes/9999' }),
      await app.inject({ method: 'GET', url: '/api/v1/inconnue' }),
    ];
    for (const reponse of reponses) {
      expect(reponse.headers['cache-control'], reponse.raw.req.url).toBe('no-store');
      expect(reponse.headers['x-content-type-options'], reponse.raw.req.url).toBe('nosniff');
    }
  });

  it('une route qui choisit sa politique de cache la garde', async () => {
    const app = appli();
    app.get('/api/v1/essai-cache', (_requete, reponse) =>
      reponse.header('cache-control', 'public, max-age=60').send({ ok: true }),
    );
    const reponse = await app.inject({ method: 'GET', url: '/api/v1/essai-cache' });
    expect(reponse.headers['cache-control']).toBe('public, max-age=60');
    expect(reponse.headers['x-content-type-options']).toBe('nosniff');
  });

  it('refuse un corps de plus de 16 Ko (413, en français), accepte juste en dessous', async () => {
    const app = appli();
    const envoyer = (taille: number) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/joueurs',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ pseudo: 'x'.repeat(taille) }),
      });
    const trop = await envoyer(16 * 1024);
    expect(trop.statusCode).toBe(413);
    expect(trop.headers['content-type']).toContain('application/problem+json');
    expect(trop.json()).toEqual({
      type: 'about:blank',
      title: 'Corps de requête trop volumineux : 16 Ko au plus',
      status: 413,
    });
    // Juste sous la limite, le corps est lu, puis refusé pour son pseudo trop long.
    expect((await envoyer(16 * 1024 - 20)).statusCode).toBe(400);
  });
});

describe('partie contre le bot d’un joueur connecté', () => {
  it('ne se lit et ne se joue qu’avec la session qui l’a créée : 404 pour toute autre requête', async () => {
    const app = appli();
    const { codeRecuperation, jeton } = await creerJoueur(
      ouverte.base,
      'Ada',
      CLE_CODES_DEVELOPPEMENT,
    );
    // Le même joueur, sur un autre appareil : une autre session.
    const autre = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/sessions',
        payload: { code: codeRecuperation },
      })
    ).json<{ jeton: string }>().jeton;
    const partie = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/parties',
        headers: auth(jeton),
        payload: { deck: 'moderne' },
      })
    ).json<PartieVisible>();

    const lire = (entetes: Record<string, string>) =>
      app.inject({ method: 'GET', url: `/api/v1/parties/${partie.id}`, headers: entetes });
    const jouer = (entetes: Record<string, string>) =>
      app.inject({
        method: 'POST',
        url: `/api/v1/parties/${partie.id}/actions`,
        headers: entetes,
        payload: { type: 'finirTour' },
      });
    for (const entetes of [{}, auth(autre), auth('jeton-invente')]) {
      const lue = await lire(entetes);
      expect(lue.statusCode).toBe(404);
      expect(lue.json()).toMatchObject({ title: 'Partie introuvable ou expirée' });
      expect((await jouer(entetes)).statusCode).toBe(404);
    }
    expect((await lire(auth(jeton))).statusCode).toBe(200);
    expect((await jouer(auth(jeton))).statusCode).toBe(200);
  });

  it('une partie lancée sans compte reste à qui connaît son identifiant', async () => {
    const app = appli();
    const jeton = await jetonDe('Bob');
    const partie = (
      await app.inject({ method: 'POST', url: '/api/v1/parties', payload: { deck: 'heritage' } })
    ).json<PartieVisible>();
    for (const entetes of [{}, auth(jeton)]) {
      const lue = await app.inject({
        method: 'GET',
        url: `/api/v1/parties/${partie.id}`,
        headers: entetes,
      });
      expect(lue.statusCode).toBe(200);
    }
  });
});
