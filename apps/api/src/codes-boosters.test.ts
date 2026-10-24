import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REGLES_BOOSTERS } from '@hipmaster/domain';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { type App, construireApp } from './app.ts';
import {
  beneficiairesCodeBoosters,
  creerCodeBoosters,
  lienCodeBoosters,
  revoquerCodeBoosters,
  statutCodeBoosters,
  utiliserCodeBoosters,
} from './comptes/codes-boosters.ts';
import { executer, lireArguments } from './comptes/commande-code-boosters.ts';
import { CLE_CODES_DEVELOPPEMENT, creerJoueur, empreinteCode } from './comptes/comptes.ts';
import { creerInvitation } from './comptes/invitations.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { boostersOfferts, codesBoosters, joueurs } from './db/schema.ts';
import { LIMITES_DEBIT } from './limites.ts';

// Boosters offerts par code (US-070, ADR 0045).

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

const JOUR_MS = 24 * 60 * 60 * 1000;
const CODE = /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/;
const REFUS = {
  type: 'about:blank',
  title: 'Ce code ne donne pas de booster : inconnu, expiré, épuisé ou déjà utilisé',
  status: 403,
  code: 'code-boosters-refuse',
};
const auth = (jeton: string) => ({ authorization: `Bearer ${jeton}` });
/** Une date limite `AAAA-MM-JJ`, dans `jours` jours. */
const dansJours = (jours: number) =>
  new Date(Date.now() + jours * JOUR_MS).toISOString().slice(0, 10);

function offrir(
  { boosters = 3, utilisations = 5, expireLe = new Date(Date.now() + JOUR_MS) } = {},
  libelle = '1re API publiée',
) {
  return creerCodeBoosters(
    ouverte.base,
    { libelle, boosters, utilisations, expireLe },
    CLE_CODES_DEVELOPPEMENT,
  );
}

const joueur = (pseudo = 'Ada') => creerJoueur(ouverte.base, pseudo, CLE_CODES_DEVELOPPEMENT);

const utiliser = (app: App, jeton: string | null, code: unknown) =>
  app.inject({
    method: 'POST',
    url: '/api/v1/moi/boosters/codes',
    ...(jeton && { headers: auth(jeton) }),
    payload: { code },
  });

async function stockEnBase(joueurId: string): Promise<number> {
  const [ligne] = await ouverte.base
    .select({ boosters: joueurs.boosters })
    .from(joueurs)
    .where(eq(joueurs.id, joueurId));
  return ligne?.boosters ?? -1;
}

describe('utiliser un code de boosters', () => {
  it('ajoute les boosters au stock, au-delà du plafond de recharge, et dit quelle réussite est récompensée', async () => {
    const { code } = await offrir({ boosters: 8 });
    const { joueur: ada, jeton } = await joueur();
    const app = appli();

    // Le code se saisit sans tenir compte de la casse, des espaces ni des tirets.
    const reponse = await utiliser(app, jeton, ` ${code.toLowerCase().replaceAll('-', ' ')} `);
    expect(reponse.statusCode).toBe(201);
    const corps = reponse.json<{ libelle: string; offerts: number; boosters: object }>();
    expect(corps.libelle).toBe('1re API publiée');
    expect(corps.offerts).toBe(8);
    // 5 boosters de bienvenue + 8 : 13, au-delà du plafond de 10 ; la recharge attend que le stock redescende.
    expect(corps.boosters).toEqual({
      stock: REGLES_BOOSTERS.bienvenue + 8,
      plafond: REGLES_BOOSTERS.plafond,
      prochainDans: null,
    });
    expect(await stockEnBase(ada.id)).toBe(13);
    expect(reponse.headers['cache-control']).toBe('no-store');

    // La trace : qui a reçu quoi, et le compteur du code.
    const traces = await ouverte.base.select().from(boostersOfferts);
    expect(traces).toEqual([expect.objectContaining({ joueurId: ada.id, boosters: 8 })]);
    const [ligne] = await ouverte.base.select().from(codesBoosters);
    expect(ligne?.utilisations).toBe(1);
  });

  it('refuse un code inconnu, déjà utilisé, épuisé, expiré ou révoqué : 403, le même message, rien de consommé', async () => {
    const app = appli();
    const { joueur: ada, jeton } = await joueur('Ada');
    const { jeton: jetonGrace } = await joueur('Grace');

    expect((await utiliser(app, jeton, 'ABCD-EFGH-JKLM-NPQR')).json()).toEqual(REFUS);

    const unique = await offrir({ utilisations: 1 });
    expect((await utiliser(app, jeton, unique.code)).statusCode).toBe(201);
    // Déjà utilisé par ce joueur : la seconde utilisation n'est ni comptée ni créditée.
    const deja = await utiliser(app, jeton, unique.code);
    expect(deja.statusCode).toBe(403);
    expect(deja.json()).toEqual(REFUS);
    expect(await stockEnBase(ada.id)).toBe(REGLES_BOOSTERS.bienvenue + 3);
    // Épuisé pour un autre joueur.
    expect((await utiliser(app, jetonGrace, unique.code)).json()).toEqual(REFUS);

    const expire = await offrir({ expireLe: new Date(Date.now() - 1000) });
    expect((await utiliser(app, jeton, expire.code)).json()).toEqual(REFUS);

    const revoque = await offrir();
    expect(await revoquerCodeBoosters(ouverte.base, revoque.id)).toBe(true);
    expect((await utiliser(app, jeton, revoque.code)).json()).toEqual(REFUS);

    const lignes = await ouverte.base
      .select({ id: codesBoosters.id, utilisations: codesBoosters.utilisations })
      .from(codesBoosters);
    expect(lignes.find((l) => l.id === unique.id)?.utilisations).toBe(1);
    expect(lignes.filter((l) => l.id !== unique.id).every((l) => l.utilisations === 0)).toBe(true);
    expect(await ouverte.base.select().from(boostersOfferts)).toHaveLength(1);
  });

  it('un code de boosters ne vaut pas invitation, et inversement', async () => {
    const app = appli({ inscriptionSurInvitation: true });
    const { jeton } = await joueur();
    const invitation = await creerInvitation(
      ouverte.base,
      { libelle: 'Équipe', utilisations: 5, expireLe: new Date(Date.now() + JOUR_MS) },
      CLE_CODES_DEVELOPPEMENT,
    );
    expect((await utiliser(app, jeton, invitation.code)).statusCode).toBe(403);
    const { code } = await offrir();
    const inscription = await app.inject({
      method: 'POST',
      url: '/api/v1/joueurs',
      payload: { pseudo: 'Linus', invitation: code },
    });
    expect(inscription.statusCode).toBe(403);
    expect(empreinteCode(CLE_CODES_DEVELOPPEMENT, 'boosters', code)).not.toBe(
      empreinteCode(CLE_CODES_DEVELOPPEMENT, 'invitation', code),
    );
  });

  it('deux joueurs simultanés ne dépassent jamais le nombre d’utilisations', async () => {
    const { code } = await offrir({ utilisations: 2 });
    const comptes = await Promise.all(['A', 'B', 'C', 'D'].map((p) => joueur(p)));
    const resultats = await Promise.all(
      comptes.map((c) =>
        utiliserCodeBoosters(ouverte.base, c.joueur.id, code, CLE_CODES_DEVELOPPEMENT),
      ),
    );
    expect(resultats.filter(Boolean)).toHaveLength(2);
    const [ligne] = await ouverte.base.select().from(codesBoosters);
    expect(ligne?.utilisations).toBe(2);
  });

  it('exige un compte (401) et un code de 1 à 64 caractères (400)', async () => {
    const app = appli();
    const { code } = await offrir();
    expect((await utiliser(app, null, code)).statusCode).toBe(401);
    const { jeton } = await joueur();
    expect((await utiliser(app, jeton, '')).statusCode).toBe(400);
    expect((await utiliser(app, jeton, 'A'.repeat(65))).statusCode).toBe(400);
  });

  it('limite les essais par adresse : 429 au-delà', async () => {
    const app = appli({
      limites: { ...LIMITES_DEBIT, codeBoosters: { max: 2, fenetreMs: 3_600_000 } },
    });
    const { jeton } = await joueur();
    expect((await utiliser(app, jeton, 'AAAA-AAAA-AAAA-AAAA')).statusCode).toBe(403);
    expect((await utiliser(app, jeton, 'BBBB-BBBB-BBBB-BBBB')).statusCode).toBe(403);
    const refus = await utiliser(app, jeton, 'CCCC-CCCC-CCCC-CCCC');
    expect(refus.statusCode).toBe(429);
    expect(refus.headers['retry-after']).toBeDefined();
  });

  it('un compte supprimé emporte sa trace ; le compteur du code, lui, reste', async () => {
    const { id, code } = await offrir();
    const { joueur: ada } = await joueur();
    await utiliserCodeBoosters(ouverte.base, ada.id, code, CLE_CODES_DEVELOPPEMENT);
    expect(await beneficiairesCodeBoosters(ouverte.base, id)).toHaveLength(1);
    await ouverte.base.delete(joueurs).where(eq(joueurs.id, ada.id));
    expect(await beneficiairesCodeBoosters(ouverte.base, id)).toEqual([]);
    const [ligne] = await ouverte.base.select().from(codesBoosters);
    expect(ligne?.utilisations).toBe(1);
  });
});

describe('statut et lien d’un code', () => {
  const base = {
    utilisations: 0,
    utilisationsMax: 2,
    expireLe: new Date('2027-01-01T00:00:00Z'),
    revoqueLe: null,
  };
  const avant = new Date('2026-12-01T00:00:00Z');

  it('la révocation prime sur l’expiration, qui prime sur l’épuisement', () => {
    expect(statutCodeBoosters(base, avant)).toBe('actif');
    expect(statutCodeBoosters({ ...base, utilisations: 2 }, avant)).toBe('epuise');
    expect(statutCodeBoosters({ ...base, utilisations: 2 }, base.expireLe)).toBe('expire');
    expect(statutCodeBoosters({ ...base, revoqueLe: avant }, avant)).toBe('revoque');
  });

  it('le lien ouvre « Mes boosters » avec le code', () => {
    expect(lienCodeBoosters('ABCD-EFGH-JKLM-NPQR', 'https://hipmaster.web.app')).toBe(
      'https://hipmaster.web.app/boosters?code=ABCD-EFGH-JKLM-NPQR',
    );
  });
});

describe('page « Offrir des boosters » (routes d’administration)', () => {
  async function preparer() {
    const admin = await joueur('Porteur');
    const ordinaire = await joueur('Ada');
    const app = appli({
      administrateurs: new Set([admin.joueur.id]),
      site: 'https://hipmaster.web.app',
    });
    return { app, admin, ordinaire };
  }

  const creer = (app: App, jeton: string, corps: object) =>
    app.inject({
      method: 'POST',
      url: '/api/v1/admin/codes-boosters',
      headers: auth(jeton),
      payload: corps,
    });

  it('crée un code : le code et son lien une seule fois, l’empreinte seule en base', async () => {
    const { app, admin } = await preparer();
    const reponse = await creer(app, admin.jeton, {
      libelle: '  File la moins en retard  ',
      boosters: 2,
      utilisations: 10,
      expire: dansJours(7),
    });
    expect(reponse.statusCode).toBe(201);
    const { codeBoosters, code, lien } = reponse.json<{
      codeBoosters: { id: string; libelle: string; statut: string; boosters: number };
      code: string;
      lien: string;
    }>();
    expect(code).toMatch(CODE);
    expect(lien).toBe(`https://hipmaster.web.app/boosters?code=${code}`);
    expect(codeBoosters).toMatchObject({
      libelle: 'File la moins en retard',
      boosters: 2,
      statut: 'actif',
    });
    const [ligne] = await ouverte.base.select().from(codesBoosters);
    expect(ligne?.empreinteCode).toBe(empreinteCode(CLE_CODES_DEVELOPPEMENT, 'boosters', code));
    expect(JSON.stringify(ligne)).not.toContain(code);

    const liste = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/codes-boosters',
      headers: auth(admin.jeton),
    });
    expect(liste.body).not.toContain(code);
    expect(liste.json<{ codes: { id: string }[] }>().codes.map((c) => c.id)).toEqual([
      codeBoosters.id,
    ]);
  });

  it('refuse un réglage hors bornes (400) : boosters de 1 à 20, joueurs de 1 à 1000, date à venir', async () => {
    const { app, admin } = await preparer();
    const valide = { libelle: 'Démo', boosters: 1, utilisations: 1, expire: dansJours(1) };
    for (const corps of [
      { ...valide, boosters: 0 },
      { ...valide, boosters: 21 },
      { ...valide, utilisations: 1001 },
      { ...valide, libelle: ' ' },
      { ...valide, expire: dansJours(-2) },
    ]) {
      expect((await creer(app, admin.jeton, corps)).statusCode).toBe(400);
    }
    expect(await ouverte.base.select().from(codesBoosters)).toEqual([]);
  });

  it('montre qui a utilisé un code, puis le révoque ; les boosters reçus restent', async () => {
    const { app, admin, ordinaire } = await preparer();
    const { id, code } = await offrir({ boosters: 2 });
    expect((await utiliser(app, ordinaire.jeton, code)).statusCode).toBe(201);

    const beneficiaires = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/codes-boosters/${id}/beneficiaires`,
      headers: auth(admin.jeton),
    });
    expect(beneficiaires.json()).toEqual({
      beneficiaires: [
        {
          joueurId: ordinaire.joueur.id,
          pseudo: 'Ada',
          boosters: 2,
          recuLe: expect.any(String),
        },
      ],
    });

    const revocation = () =>
      app.inject({
        method: 'POST',
        url: `/api/v1/admin/codes-boosters/${id}/revocation`,
        headers: auth(admin.jeton),
      });
    const revoque = await revocation();
    expect(revoque.statusCode).toBe(200);
    expect(revoque.json()).toMatchObject({ id, statut: 'revoque', revoqueLe: expect.any(String) });
    expect((await revocation()).statusCode).toBe(404);
    expect(await stockEnBase(ordinaire.joueur.id)).toBe(REGLES_BOOSTERS.bienvenue + 2);

    const inconnu = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/codes-boosters/0f8fad5b-d9cb-469f-a165-70867728950e/beneficiaires',
      headers: auth(admin.jeton),
    });
    expect(inconnu.statusCode).toBe(404);
    expect(inconnu.json<{ title: string }>().title).toBe(
      'Aucun code de boosters ne porte cet identifiant',
    );
  });

  it('répond 404, comme une route inexistante, à qui n’est pas administrateur', async () => {
    const { app, ordinaire } = await preparer();
    const { id } = await offrir();
    const introuvable = {
      type: 'about:blank',
      title: 'Ressource introuvable',
      status: 404,
      code: 'ressource-introuvable',
    };
    for (const requete of [
      { method: 'GET' as const, url: '/api/v1/admin/codes-boosters' },
      { method: 'POST' as const, url: '/api/v1/admin/codes-boosters', payload: {} },
      { method: 'GET' as const, url: `/api/v1/admin/codes-boosters/${id}/beneficiaires` },
      { method: 'POST' as const, url: `/api/v1/admin/codes-boosters/${id}/revocation` },
    ]) {
      for (const headers of [{}, auth(ordinaire.jeton)]) {
        const reponse = await app.inject({ ...requete, headers });
        expect(reponse.statusCode).toBe(404);
        expect(reponse.json()).toEqual(introuvable);
      }
    }
  });
});

describe('commande des codes de boosters', () => {
  const MAINTENANT = new Date('2026-10-24T10:00:00Z');

  it('lit une création : libellé, boosters, utilisations, expiration au jour dit ou dans N jours', () => {
    expect(
      lireArguments(
        [
          '--libelle',
          '1re API publiée',
          '--boosters',
          '3',
          '--utilisations',
          '1',
          '--expire',
          '2026-12-31',
        ],
        MAINTENANT,
      ),
    ).toEqual({
      action: 'creer',
      libelle: '1re API publiée',
      boosters: 3,
      utilisations: 1,
      expireLe: new Date('2027-01-01T00:00:00Z'),
      site: 'https://hipmaster.web.app',
    });
    expect(
      lireArguments(['--libelle', 'Démo', '--boosters', '1', '--utilisations', '5'], MAINTENANT),
    ).toMatchObject({ expireLe: new Date(MAINTENANT.getTime() + 30 * JOUR_MS) });
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
    expect(lireArguments(['--lister'])).toEqual({ action: 'lister' });
    expect(lireArguments(['--beneficiaires', id])).toEqual({ action: 'beneficiaires', id });
    expect(lireArguments(['--revoquer', id])).toEqual({ action: 'revoquer', id });
    expect(lireArguments(['--aide'])).toEqual({ action: 'aide' });
  });

  it('refuse des arguments invalides, en disant quoi corriger', () => {
    const refus = (argv: string[]) => () => lireArguments(argv, MAINTENANT);
    const creation = ['--libelle', 'Démo', '--utilisations', '1'];
    expect(refus(creation)).toThrow('--boosters');
    expect(refus([...creation, '--boosters', '21'])).toThrow('de 1 à 20');
    expect(refus([...creation, '--boosters', '1', '--expire', '2026-10-01'])).toThrow(
      '--expire est déjà passé',
    );
    expect(refus(['--lister', '--revoquer', 'x'])).toThrow('s’emploient seuls');
    expect(refus(['--beneficiaires', 'x'])).toThrow('l’identifiant d’un code');
    expect(refus(['--inconnue'])).toThrow('Option inconnue');
  });

  it('crée un code et le montre une seule fois, avec son lien ; liste, montre les bénéficiaires, révoque', async () => {
    const lignes: string[] = [];
    const ecrire = (ligne: string) => lignes.push(ligne);
    const commande = lireArguments([
      '--libelle',
      'Démo',
      '--boosters',
      '2',
      '--utilisations',
      '3',
      '--site',
      'http://localhost:4200',
    ]);
    if (commande.action !== 'creer') throw new Error('création attendue');
    expect(await executer(commande, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire)).toBe(true);
    const code = /affiché cette seule fois : (\S+)$/.exec(lignes[1] ?? '')?.[1] ?? '';
    expect(code).toMatch(CODE);
    expect(lignes[2]).toBe(`Lien à envoyer : http://localhost:4200/boosters?code=${code}`);

    const [ligne] = await ouverte.base.select().from(codesBoosters);
    const id = ligne?.id ?? '';
    const { joueur: ada } = await joueur();
    await utiliserCodeBoosters(ouverte.base, ada.id, code, CLE_CODES_DEVELOPPEMENT);

    lignes.length = 0;
    await executer({ action: 'lister' }, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire);
    expect(lignes[0]).toContain(`${id}  « Démo »  2 booster(s), 1/3 utilisé(s), expire le`);
    lignes.length = 0;
    await executer({ action: 'beneficiaires', id }, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire);
    expect(lignes[0]).toMatch(/UTC {2}Ada \([0-9a-f-]+\) {2}2 booster\(s\)$/);
    lignes.length = 0;
    expect(
      await executer({ action: 'revoquer', id }, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire),
    ).toBe(true);
    expect(
      await executer({ action: 'revoquer', id }, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire),
    ).toBe(false);
    expect(
      await executer(
        { action: 'beneficiaires', id: '0f8fad5b-d9cb-469f-a165-70867728950e' },
        ouverte.base,
        CLE_CODES_DEVELOPPEMENT,
        ecrire,
      ),
    ).toBe(false);
  });

  it('`npm run code-boosters` exige PostgreSQL : sans DATABASE_URL, elle s’arrête en le disant', () => {
    const script = fileURLToPath(new URL('code-boosters.ts', import.meta.url));
    const env = { ...process.env };
    delete env['DATABASE_URL'];
    const sortie = spawnSync(process.execPath, [script, '--lister'], { encoding: 'utf8', env });
    expect(sortie.status).toBe(1);
    expect(sortie.stdout).toContain('DATABASE_URL manque');
    const aide = spawnSync(process.execPath, [script, '--aide'], { encoding: 'utf8', env });
    expect(aide.status).toBe(0);
    expect(aide.stdout).toContain('npm run code-boosters -- --lister');
  });
});
