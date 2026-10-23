import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { type App, construireApp } from './app.ts';
import { executer, lireArguments } from './comptes/commande-invitation.ts';
import { CLE_CODES_DEVELOPPEMENT, empreinteCode } from './comptes/comptes.ts';
import { creerInvitation, revoquerInvitation } from './comptes/invitations.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { invitations, joueurs } from './db/schema.ts';

// Inscription sur invitation (US-048, ADR 0027).

const ouverte = baseDeTest();
const applis: App[] = [];
afterEach(async () => {
  await Promise.all(applis.splice(0).map((a) => a.close()));
});

function appli(inscriptionSurInvitation: boolean): App {
  const app = construireApp({ base: ouverte.base, inscriptionSurInvitation });
  applis.push(app);
  return app;
}

const JOUR_MS = 24 * 60 * 60 * 1000;
const CODE_INVITATION = /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/;
const REFUS = {
  type: 'about:blank',
  title: 'Invitation refusée : code absent, inconnu, expiré ou épuisé',
  status: 403,
};

function inviter(utilisations = 5, expireLe = new Date(Date.now() + JOUR_MS)) {
  return creerInvitation(
    ouverte.base,
    { libelle: 'Équipe intégration', utilisations, expireLe },
    CLE_CODES_DEVELOPPEMENT,
  );
}

const inscrire = (app: App, invitation?: string, pseudo = 'Ada') =>
  app.inject({
    method: 'POST',
    url: '/api/v1/joueurs',
    payload: { pseudo, ...(invitation !== undefined && { invitation }) },
  });

async function lireInvitation(id: string) {
  const [ligne] = await ouverte.base.select().from(invitations).where(eq(invitations.id, id));
  return ligne;
}

async function nombreDeComptes() {
  return (await ouverte.base.select({ id: joueurs.id }).from(joueurs)).length;
}

describe('inscription sur invitation', () => {
  it('avec un code valide, crée le compte comme avant et retient de quelle invitation il vient', async () => {
    const app = appli(true);
    const { id, code } = await inviter();
    expect(code).toMatch(CODE_INVITATION);
    // Saisi en minuscules, avec des espaces : accepté.
    const reponse = await inscrire(app, ` ${code.toLowerCase().replaceAll('-', ' ')} `);
    expect(reponse.statusCode).toBe(201);
    const { joueur, jeton, codeRecuperation } = reponse.json<{
      joueur: { id: string };
      jeton: string;
      codeRecuperation: string;
    }>();
    expect(codeRecuperation).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){2}$/);
    const moi = await app.inject({
      method: 'GET',
      url: '/api/v1/moi',
      headers: { authorization: `Bearer ${jeton}` },
    });
    expect(moi.statusCode).toBe(200);
    const [compte] = await ouverte.base
      .select({ invitationId: joueurs.invitationId, boosters: joueurs.boosters })
      .from(joueurs)
      .where(eq(joueurs.id, joueur.id));
    expect(compte).toEqual({ invitationId: id, boosters: 5 });
    expect(await lireInvitation(id)).toMatchObject({ utilisations: 1, utilisationsMax: 5 });
  });

  it('refuse un code absent, inconnu, expiré ou épuisé : 403, le même message, aucun compte créé', async () => {
    const app = appli(true);
    const expiree = await inviter(5, new Date(Date.now() - 1000));
    const unique = await inviter(1);
    expect((await inscrire(app, unique.code)).statusCode).toBe(201);
    const comptes = await nombreDeComptes();

    for (const code of [undefined, 'ABCD-EFGH-JKLM-NPQR', expiree.code, unique.code]) {
      const reponse = await inscrire(app, code);
      expect(reponse.statusCode, String(code)).toBe(403);
      expect(reponse.headers['content-type']).toContain('application/problem+json');
      expect(reponse.json()).toEqual(REFUS);
    }
    expect(await nombreDeComptes()).toBe(comptes);
    expect(await lireInvitation(expiree.id)).toMatchObject({ utilisations: 0 });
    expect(await lireInvitation(unique.id)).toMatchObject({ utilisations: 1 });
  });

  it('sans invitation exigée (développement, e2e), l’inscription reste libre ; un code fourni est vérifié', async () => {
    const app = appli(false);
    const libre = await inscrire(app);
    expect(libre.statusCode).toBe(201);
    const id = libre.json<{ joueur: { id: string } }>().joueur.id;
    const [compte] = await ouverte.base
      .select({ invitationId: joueurs.invitationId })
      .from(joueurs)
      .where(eq(joueurs.id, id));
    expect(compte?.invitationId).toBeNull();

    expect((await inscrire(app, 'ABCD-EFGH-JKLM-NPQR')).statusCode).toBe(403);
    const { id: invitation, code } = await inviter(2);
    expect((await inscrire(app, code)).statusCode).toBe(201);
    expect(await lireInvitation(invitation)).toMatchObject({ utilisations: 1 });
  });

  it('un code d’invitation ne vaut pas code de récupération, et inversement', async () => {
    const app = appli(true);
    const { code } = await inviter();
    const { codeRecuperation } = (await inscrire(app, code)).json<{ codeRecuperation: string }>();
    expect((await inscrire(app, codeRecuperation, 'Bob')).statusCode).toBe(403);
    const session = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { code },
    });
    expect(session.statusCode).toBe(401);
  });

  it('une invitation révoquée ne crée plus de compte ; les comptes déjà créés restent', async () => {
    const app = appli(true);
    const { id, code } = await inviter();
    const { jeton } = (await inscrire(app, code)).json<{ jeton: string }>();
    expect(await revoquerInvitation(ouverte.base, id)).toBe(true);
    expect(await revoquerInvitation(ouverte.base, id)).toBe(false);
    expect((await inscrire(app, code, 'Bob')).statusCode).toBe(403);
    const moi = await app.inject({
      method: 'GET',
      url: '/api/v1/moi',
      headers: { authorization: `Bearer ${jeton}` },
    });
    expect(moi.statusCode).toBe(200);
  });

  it('refuse un code d’invitation trop long ou vide (400)', async () => {
    const app = appli(true);
    expect((await inscrire(app, 'A'.repeat(41))).statusCode).toBe(400);
    expect((await inscrire(app, '   ')).statusCode).toBe(400);
  });
});

describe('commande des invitations', () => {
  const MAINTENANT = new Date('2026-10-23T10:00:00Z');

  it('lit une création : libellé, utilisations, expiration au jour dit ou dans N jours (30 par défaut)', () => {
    expect(
      lireArguments(
        ['--libelle', ' Équipe intégration ', '--utilisations', '20', '--expire', '2026-12-31'],
        MAINTENANT,
      ),
    ).toEqual({
      action: 'creer',
      libelle: 'Équipe intégration',
      utilisations: 20,
      expireLe: new Date('2027-01-01T00:00:00Z'),
      site: 'https://hipmaster.web.app',
    });
    expect(lireArguments(['--libelle', 'Démo', '--utilisations', '3'], MAINTENANT)).toMatchObject({
      expireLe: new Date('2026-11-22T10:00:00Z'),
    });
    expect(
      lireArguments(
        [
          '--libelle',
          'Démo',
          '--utilisations',
          '3',
          '--jours',
          '7',
          '--site',
          'http://localhost:4200',
        ],
        MAINTENANT,
      ),
    ).toMatchObject({ expireLe: new Date('2026-10-30T10:00:00Z'), site: 'http://localhost:4200' });
    expect(lireArguments(['--lister'])).toEqual({ action: 'lister' });
    const id = '00000000-0000-4000-8000-000000000001';
    expect(lireArguments(['--revoquer', id])).toEqual({ action: 'revoquer', id });
    expect(lireArguments(['-h'])).toEqual({ action: 'aide' });
  });

  it('refuse des arguments invalides, en disant quoi corriger', () => {
    const refus = (argv: string[]) => () => lireArguments(argv, MAINTENANT);
    expect(refus(['--utilisations', '3'])).toThrow(/--libelle/);
    expect(refus(['--libelle', 'Démo', '--utilisations', '0'])).toThrow(/de 1 à 1000/);
    expect(refus(['--libelle', 'Démo', '--utilisations', 'beaucoup'])).toThrow(/--utilisations/);
    expect(refus(['--libelle', 'Démo', '--utilisations', '3', '--expire', '2026-02-30'])).toThrow(
      /AAAA-MM-JJ/,
    );
    expect(refus(['--libelle', 'Démo', '--utilisations', '3', '--expire', '2026-01-01'])).toThrow(
      /déjà passé/,
    );
    expect(
      refus(['--libelle', 'Démo', '--utilisations', '3', '--expire', '2026-12-31', '--jours', '3']),
    ).toThrow(/ne vont pas ensemble/);
    expect(refus(['--lister', '--libelle', 'Démo'])).toThrow(/s’emploient seuls/);
    expect(refus(['--revoquer', '12'])).toThrow(/identifiant/);
    expect(refus(['--inconnue'])).toThrow('Option inconnue : --inconnue');
  });

  it('crée une invitation et montre son code une seule fois, avec le lien à envoyer ; la base n’en garde que l’empreinte', async () => {
    const lignes: string[] = [];
    const commande = lireArguments(
      ['--libelle', 'Équipe intégration', '--utilisations', '20', '--expire', '2026-12-31'],
      MAINTENANT,
    );
    if (commande.action !== 'creer') throw new Error(commande.action);
    expect(
      await executer(
        commande,
        ouverte.base,
        CLE_CODES_DEVELOPPEMENT,
        (l) => lignes.push(l),
        MAINTENANT,
      ),
    ).toBe(true);
    const code = /affiché cette seule fois : (\S+)$/.exec(lignes[1] ?? '')?.[1] ?? '';
    expect(code).toMatch(CODE_INVITATION);
    expect(lignes[0]).toContain('« Équipe intégration »');
    expect(lignes[0]).toContain('20 compte(s) au plus, jusqu’au 2027-01-01 00:00 UTC');
    expect(lignes[2]).toBe(`Lien à envoyer : https://hipmaster.web.app/compte?invitation=${code}`);

    const enBase = JSON.stringify(await ouverte.base.select().from(invitations));
    expect(enBase).not.toContain(code.replaceAll('-', ''));
    expect(enBase).toContain(empreinteCode(CLE_CODES_DEVELOPPEMENT, 'invitation', code));
  });

  it('liste les invitations, avec leurs comptes, et en révoque une', async () => {
    const lignes: string[] = [];
    const ecrire = (l: string) => lignes.push(l);
    await executer({ action: 'lister' }, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire);
    expect(lignes).toEqual(['Aucune invitation.']);

    const app = appli(true);
    const { id, code } = await inviter(5, new Date('2030-01-01T00:00:00Z'));
    await inscrire(app, code);
    lignes.length = 0;
    await executer({ action: 'lister' }, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire);
    expect(lignes).toEqual([
      `${id}  « Équipe intégration »  1/5 utilisée(s), 1 compte(s), expire le 2030-01-01 00:00 UTC`,
    ]);

    lignes.length = 0;
    expect(
      await executer({ action: 'revoquer', id }, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire),
    ).toBe(true);
    expect(
      await executer({ action: 'revoquer', id }, ouverte.base, CLE_CODES_DEVELOPPEMENT, ecrire),
    ).toBe(false);
    expect(lignes[0]).toContain('révoquée');
    expect(lignes[1]).toContain('Aucune invitation en cours');
  });

  it('`npm run invitation` exige PostgreSQL : sans DATABASE_URL, elle s’arrête en le disant', () => {
    const script = fileURLToPath(new URL('invitation.ts', import.meta.url));
    const env = { ...process.env };
    delete env['DATABASE_URL'];
    const sortie = spawnSync(process.execPath, [script, '--lister'], { encoding: 'utf8', env });
    expect(sortie.status).toBe(1);
    expect(sortie.stdout).toContain('"severity":"CRITICAL"');
    expect(sortie.stdout).toContain('DATABASE_URL manque');
    const aide = spawnSync(process.execPath, [script, '--aide'], { encoding: 'utf8', env });
    expect(aide.status).toBe(0);
    expect(aide.stdout).toContain('npm run invitation -- --lister');
  });
});
