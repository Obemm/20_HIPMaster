import { afterEach, describe, expect, it } from 'vitest';
import { type App, construireApp } from './app.ts';
import {
  type Administrateurs,
  estAdministrateur,
  lireAdministrateurs,
  TOUS,
} from './comptes/administrateurs.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur } from './comptes/comptes.ts';
import { finDuJour, lienInvitation, statutInvitation } from './comptes/invitations.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { invitations } from './db/schema.ts';
import { creerJournal } from './journaux.ts';
import { LIMITES_DEBIT } from './limites.ts';

// Page « Inviter » réservée aux administrateurs (US-072, ADR 0029).

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

const auth = (jeton: string) => ({ authorization: `Bearer ${jeton}` });
const CODE_INVITATION = /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/;
const JOUR_MS = 24 * 60 * 60 * 1000;
/** Une date limite `AAAA-MM-JJ`, dans `jours` jours. */
const dansJours = (jours: number) =>
  new Date(Date.now() + jours * JOUR_MS).toISOString().slice(0, 10);

/** Deux comptes : l'administrateur et un joueur ordinaire, et une application qui ne connaît que le premier. */
async function preparer(options: Parameters<typeof construireApp>[0] = {}) {
  const admin = await creerJoueur(ouverte.base, 'Porteur', CLE_CODES_DEVELOPPEMENT);
  const joueur = await creerJoueur(ouverte.base, 'Ada', CLE_CODES_DEVELOPPEMENT);
  const app = appli({ administrateurs: new Set([admin.joueur.id]), ...options });
  return { app, admin, joueur };
}

interface Invitation {
  id: string;
  libelle: string;
  utilisations: number;
  utilisationsMax: number;
  comptes: number;
  expireLe: string;
  revoqueeLe: string | null;
  statut: string;
}

const creer = (app: App, jeton: string, corps: object) =>
  app.inject({
    method: 'POST',
    url: '/api/v1/admin/invitations',
    headers: auth(jeton),
    payload: corps,
  });

const lister = async (app: App, jeton: string) =>
  (
    await app.inject({ method: 'GET', url: '/api/v1/admin/invitations', headers: auth(jeton) })
  ).json<{ invitations: Invitation[] }>().invitations;

const revoquer = (app: App, jeton: string, id: string) =>
  app.inject({
    method: 'POST',
    url: `/api/v1/admin/invitations/${id}/revocation`,
    headers: auth(jeton),
  });

describe('qui est administrateur', () => {
  it('lit des identifiants séparés par des virgules ou des espaces, sans tenir compte de la casse', () => {
    const lus = lireAdministrateurs(
      '0F8FAD5B-D9CB-469F-A165-70867728950E 7c9e6679-7425-40de-944b-e07fc1f90ae7',
    );
    if (!('administrateurs' in lus)) throw new Error(lus.erreur);
    expect(estAdministrateur(lus.administrateurs, '0f8fad5b-d9cb-469f-a165-70867728950e')).toBe(
      true,
    );
    expect(estAdministrateur(lus.administrateurs, '00000000-0000-4000-8000-000000000001')).toBe(
      false,
    );
    const personne = lireAdministrateurs(undefined) as { administrateurs: Administrateurs };
    expect(
      estAdministrateur(personne.administrateurs, '0f8fad5b-d9cb-469f-a165-70867728950e'),
    ).toBe(false);
    expect(estAdministrateur(TOUS, '00000000-0000-4000-8000-000000000001')).toBe(true);
    expect(lireAdministrateurs('Ada')).toEqual({
      erreur: 'des identifiants de joueur (UUID) étaient attendus : Ada',
    });
  });
});

describe('statut et lien d’une invitation', () => {
  const MAINTENANT = new Date('2026-10-23T10:00:00Z');
  const base = {
    utilisations: 1,
    utilisationsMax: 5,
    expireLe: new Date('2026-11-01T00:00:00Z'),
    revoqueeLe: null,
  };

  it('active, épuisée, expirée ou révoquée : la révocation prime, puis l’expiration', () => {
    expect(statutInvitation(base, MAINTENANT)).toBe('active');
    expect(statutInvitation({ ...base, utilisations: 5 }, MAINTENANT)).toBe('epuisee');
    expect(statutInvitation({ ...base, utilisations: 5, expireLe: MAINTENANT }, MAINTENANT)).toBe(
      'expiree',
    );
    expect(
      statutInvitation({ ...base, expireLe: MAINTENANT, revoqueeLe: MAINTENANT }, MAINTENANT),
    ).toBe('revoquee');
  });

  it('une date limite vaut tout le jour ; le lien remplit le code de « Mon compte »', () => {
    expect(finDuJour('2026-12-31')).toEqual(new Date('2027-01-01T00:00:00Z'));
    expect(lienInvitation('ABCD-EFGH-JKLM-NPQR', 'https://hipmaster.web.app')).toBe(
      'https://hipmaster.web.app/compte?invitation=ABCD-EFGH-JKLM-NPQR',
    );
  });
});

describe('routes d’administration : 404 pour tout autre appelant', () => {
  it('sans jeton, avec un jeton inconnu ou d’un joueur ordinaire : la réponse exacte d’une route inexistante', async () => {
    const { app, joueur } = await preparer({
      // Même au-delà de la limite, jamais de 429 : la limite ne compte que l'administrateur.
      limites: { ...LIMITES_DEBIT, administration: { max: 1, fenetreMs: 60_000 } },
    });
    const inexistante = await app.inject({ method: 'GET', url: '/api/v1/admin/inexistante' });
    expect(inexistante.statusCode).toBe(404);

    const id = '00000000-0000-4000-8000-000000000001';
    for (const headers of [{}, auth('jeton-inconnu'), auth(joueur.jeton)]) {
      for (const requete of [
        { method: 'GET' as const, url: '/api/v1/admin/invitations' },
        // Corps valide, invalide ou trop gros : le refus vient avant toute lecture du corps.
        {
          method: 'POST' as const,
          url: '/api/v1/admin/invitations',
          payload: { libelle: 'Fuite', utilisations: 1000, expire: dansJours(30) },
        },
        { method: 'POST' as const, url: '/api/v1/admin/invitations', payload: { libelle: '' } },
        {
          method: 'POST' as const,
          url: '/api/v1/admin/invitations',
          payload: { libelle: 'x'.repeat(20_000) },
        },
        { method: 'POST' as const, url: `/api/v1/admin/invitations/${id}/revocation` },
        { method: 'POST' as const, url: '/api/v1/admin/invitations/pas-un-uuid/revocation' },
      ]) {
        const reponse = await app.inject({ ...requete, headers });
        expect(reponse.statusCode, `${requete.method} ${requete.url}`).toBe(404);
        expect(reponse.headers['content-type']).toBe(inexistante.headers['content-type']);
        expect(reponse.headers['x-ratelimit-limit']).toBeUndefined();
        expect(reponse.body).toBe(inexistante.body);
      }
    }
    expect(await ouverte.base.select().from(invitations)).toEqual([]);
  });

  it('sans administrateurs configurés, personne n’y a accès', async () => {
    const admin = await creerJoueur(ouverte.base, 'Porteur', CLE_CODES_DEVELOPPEMENT);
    const app = appli();
    const reponse = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/invitations',
      headers: auth(admin.jeton),
    });
    expect(reponse.statusCode).toBe(404);
  });

  it('« Mon compte » ne dit administrateur que l’administrateur ; pour les autres, le champ est absent', async () => {
    const { app, admin, joueur } = await preparer();
    const moi = (jeton: string) =>
      app.inject({ method: 'GET', url: '/api/v1/moi', headers: auth(jeton) });
    expect((await moi(admin.jeton)).json()).toEqual({
      id: admin.joueur.id,
      pseudo: 'Porteur',
      administrateur: true,
    });
    expect((await moi(joueur.jeton)).json()).toEqual({ id: joueur.joueur.id, pseudo: 'Ada' });

    // Connexion par code de récupération sur un autre appareil : il le sait aussitôt.
    const session = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { code: admin.codeRecuperation },
    });
    expect(session.json<{ joueur: object }>().joueur).toMatchObject({ administrateur: true });
  });

  it('avec « tous » (e2e, développement), chaque compte créé est administrateur', async () => {
    const app = appli({ administrateurs: TOUS });
    const creation = await app.inject({
      method: 'POST',
      url: '/api/v1/joueurs',
      payload: { pseudo: 'Testeuse' },
    });
    expect(creation.json<{ joueur: object }>().joueur).toMatchObject({ administrateur: true });
  });
});

describe('invitations par l’administrateur', () => {
  it('crée une invitation : code et lien renvoyés une seule fois ; la base n’en garde que l’empreinte', async () => {
    const lignes: string[] = [];
    const journal = creerJournal({
      niveau: 'info',
      flux: { write: (l: string) => lignes.push(l) },
    });
    const { app, admin } = await preparer({ journal, site: 'https://hipmaster.web.app' });
    const reponse = await creer(app, admin.jeton, {
      libelle: '  Équipe intégration ',
      utilisations: 20,
      expire: '2099-12-31',
    });
    expect(reponse.statusCode).toBe(201);
    const { invitation, code, lien } = reponse.json<{
      invitation: Invitation;
      code: string;
      lien: string;
    }>();
    expect(code).toMatch(CODE_INVITATION);
    expect(lien).toBe(`https://hipmaster.web.app/compte?invitation=${code}`);
    expect(invitation).toMatchObject({
      libelle: 'Équipe intégration',
      utilisations: 0,
      utilisationsMax: 20,
      comptes: 0,
      expireLe: '2100-01-01T00:00:00.000Z',
      revoqueeLe: null,
      statut: 'active',
    });

    const liste = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/invitations',
      headers: auth(admin.jeton),
    });
    expect(liste.body).not.toContain(code);
    const enBase = JSON.stringify(await ouverte.base.select().from(invitations));
    expect(enBase).not.toContain(code.replaceAll('-', ''));
    // Le journal dit qui a créé quelle invitation, jamais son code.
    const journalise = lignes.join('\n');
    expect(journalise).toContain('Invitation créée');
    expect(journalise).toContain(admin.joueur.id);
    expect(journalise).not.toContain(code);
  });

  it('refuse un libellé vide ou trop long, un nombre de comptes hors bornes, une date passée ou mal formée (400)', async () => {
    const { app, admin } = await preparer();
    const valide = { libelle: 'Démo', utilisations: 3, expire: dansJours(7) };
    for (const corps of [
      { ...valide, libelle: '   ' },
      { ...valide, libelle: 'x'.repeat(81) },
      { ...valide, utilisations: 0 },
      { ...valide, utilisations: 1001 },
      { ...valide, utilisations: 2.5 },
      { ...valide, expire: dansJours(-1) },
      { ...valide, expire: '2026-02-30' },
      { libelle: 'Démo', utilisations: 3 },
    ]) {
      const reponse = await creer(app, admin.jeton, corps);
      expect(reponse.statusCode, JSON.stringify(corps)).toBe(400);
      expect(reponse.headers['content-type']).toContain('application/problem+json');
    }
    // Aujourd'hui reste valable jusqu'à minuit UTC.
    expect((await creer(app, admin.jeton, { ...valide, expire: dansJours(0) })).statusCode).toBe(
      201,
    );
  });

  it('liste les invitations, des plus récentes aux plus anciennes, avec leur usage', async () => {
    const { app, admin } = await preparer();
    await creer(app, admin.jeton, { libelle: 'Première', utilisations: 2, expire: dansJours(7) });
    const seconde = (
      await creer(app, admin.jeton, { libelle: 'Seconde', utilisations: 1, expire: dansJours(7) })
    ).json<{ code: string }>();
    const inscription = await app.inject({
      method: 'POST',
      url: '/api/v1/joueurs',
      payload: { pseudo: 'Invitée', invitation: seconde.code },
    });
    expect(inscription.statusCode).toBe(201);
    expect(inscription.json<{ joueur: object }>().joueur).not.toHaveProperty('administrateur');

    const liste = await lister(app, admin.jeton);
    expect(liste.map((i) => [i.libelle, i.utilisations, i.comptes, i.statut])).toEqual([
      ['Seconde', 1, 1, 'epuisee'],
      ['Première', 0, 0, 'active'],
    ]);
  });

  it('révoque une invitation : son code ne crée plus de compte, les comptes restent, la liste la dit révoquée', async () => {
    const { app, admin } = await preparer();
    const { invitation, code } = (
      await creer(app, admin.jeton, { libelle: 'Fuite', utilisations: 5, expire: dansJours(7) })
    ).json<{ invitation: Invitation; code: string }>();
    const inscrire = (pseudo: string) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/joueurs',
        payload: { pseudo, invitation: code },
      });
    expect((await inscrire('Ada')).statusCode).toBe(201);

    const revocation = await revoquer(app, admin.jeton, invitation.id);
    expect(revocation.statusCode).toBe(200);
    expect(revocation.json<Invitation>()).toMatchObject({
      id: invitation.id,
      comptes: 1,
      statut: 'revoquee',
    });
    expect(revocation.json<Invitation>().revoqueeLe).not.toBeNull();
    expect((await inscrire('Bob')).statusCode).toBe(403);
    expect((await lister(app, admin.jeton))[0]).toMatchObject({ statut: 'revoquee', comptes: 1 });

    const encore = await revoquer(app, admin.jeton, invitation.id);
    expect(encore.statusCode).toBe(404);
    expect(encore.json<{ title: string }>().title).toContain('Aucune invitation en cours');
    expect(
      (await revoquer(app, admin.jeton, '00000000-0000-4000-8000-000000000001')).statusCode,
    ).toBe(404);
    expect((await revoquer(app, admin.jeton, 'pas-un-uuid')).statusCode).toBe(400);
  });

  it('limite le débit de l’administrateur, route par route (429)', async () => {
    const { app, admin } = await preparer({
      limites: { ...LIMITES_DEBIT, administration: { max: 2, fenetreMs: 60_000 } },
    });
    const lire = () =>
      app.inject({ method: 'GET', url: '/api/v1/admin/invitations', headers: auth(admin.jeton) });
    expect((await lire()).statusCode).toBe(200);
    expect((await lire()).statusCode).toBe(200);
    const refus = await lire();
    expect(refus.statusCode).toBe(429);
    expect(refus.headers['retry-after']).toBeDefined();
  });
});
