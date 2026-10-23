import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { CLE_CODES_DEVELOPPEMENT, empreinteCode } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { joueurs, sessions } from './db/schema.ts';

type App = ReturnType<typeof construireApp>;
const ouverte = baseDeTest();
let app: App;

beforeEach(() => {
  app = construireApp({ base: ouverte.base });
});
afterEach(() => app.close());

interface Creation {
  joueur: { id: string; pseudo: string };
  jeton: string;
  codeRecuperation: string;
}

const creer = async (pseudo = 'Ada') =>
  app.inject({ method: 'POST', url: '/api/v1/joueurs', payload: { pseudo } });
const moi = (jeton?: string) =>
  app.inject({
    method: 'GET',
    url: '/api/v1/moi',
    headers: jeton ? { authorization: `Bearer ${jeton}` } : {},
  });
const connecter = async (code: string) =>
  (await app.inject({ method: 'POST', url: '/api/v1/sessions', payload: { code } })).json<{
    jeton: string;
  }>().jeton;

describe('comptes invités', () => {
  it('crée un compte avec un pseudo : jeton de session et code de récupération lisible', async () => {
    const reponse = await creer('  Ada Lovelace ');
    expect(reponse.statusCode).toBe(201);
    const { joueur, jeton, codeRecuperation } = reponse.json<Creation>();
    expect(joueur.pseudo).toBe('Ada Lovelace');
    expect(jeton.length).toBeGreaterThanOrEqual(40);
    expect(codeRecuperation).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect((await moi(jeton)).json()).toEqual(joueur);
  });

  it('ne stocke ni le jeton ni le code en clair', async () => {
    const { jeton, codeRecuperation } = (await creer()).json<Creation>();
    const enBase = JSON.stringify([
      await ouverte.base.select().from(joueurs),
      await ouverte.base.select().from(sessions),
    ]);
    expect(enBase).not.toContain(jeton);
    expect(enBase).not.toContain(codeRecuperation.replaceAll('-', ''));
  });

  it('refuse un pseudo trop court, trop long ou avec des caractères interdits', async () => {
    for (const pseudo of ['A', 'x'.repeat(25), '<script>']) {
      expect((await creer(pseudo)).statusCode, pseudo).toBe(400);
    }
  });

  it('retrouve le compte avec le code de récupération, quelle que soit la casse', async () => {
    const { joueur, codeRecuperation } = (await creer()).json<Creation>();
    const reponse = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { code: ` ${codeRecuperation.toLowerCase().replaceAll('-', ' ')} ` },
    });
    expect(reponse.statusCode).toBe(201);
    const session = reponse.json<{ joueur: Creation['joueur']; jeton: string }>();
    expect(session.joueur).toEqual(joueur);
    expect((await moi(session.jeton)).json()).toEqual(joueur);
  });

  it('refuse un code inconnu (401) et une requête sans jeton valide (401)', async () => {
    const inconnu = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { code: 'AAAA-BBBB-CCCC' },
    });
    expect(inconnu.statusCode).toBe(401);
    expect(inconnu.json()).toMatchObject({ title: 'Code de récupération inconnu' });
    expect((await moi()).statusCode).toBe(401);
    const faux = await moi('faux-jeton');
    expect(faux.statusCode).toBe(401);
    expect(faux.headers['content-type']).toContain('application/problem+json');
  });

  it('se déconnecter ferme la seule session de cet appareil', async () => {
    const { jeton, codeRecuperation } = (await creer()).json<Creation>();
    const autre = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/sessions',
        payload: { code: codeRecuperation },
      })
    ).json<{ jeton: string }>().jeton;
    const sortie = await app.inject({
      method: 'DELETE',
      url: '/api/v1/sessions/courante',
      headers: { authorization: `Bearer ${jeton}` },
    });
    expect(sortie.statusCode).toBe(204);
    expect((await moi(jeton)).statusCode).toBe(401);
    expect((await moi(autre)).statusCode).toBe(200);
  });

  it('un nouveau code de récupération remplace l’ancien', async () => {
    const { jeton, codeRecuperation } = (await creer()).json<Creation>();
    const nouveau = await app.inject({
      method: 'POST',
      url: '/api/v1/moi/code',
      headers: { authorization: `Bearer ${jeton}` },
    });
    expect(nouveau.statusCode).toBe(201);
    const code = nouveau.json<{ codeRecuperation: string }>().codeRecuperation;
    expect(code).not.toBe(codeRecuperation);
    const connecter = (c: string) =>
      app.inject({ method: 'POST', url: '/api/v1/sessions', payload: { code: c } });
    expect((await connecter(codeRecuperation)).statusCode).toBe(401);
    expect((await connecter(code)).statusCode).toBe(201);
  });

  it('un nouveau code ferme toutes les autres sessions du compte, pas celle qui le demande (US-047)', async () => {
    const { jeton, codeRecuperation } = (await creer()).json<Creation>();
    const telephone = await connecter(codeRecuperation);
    const tablette = await connecter(codeRecuperation);
    const autreJoueur = (await creer('Bob')).json<Creation>().jeton;

    const nouveau = await app.inject({
      method: 'POST',
      url: '/api/v1/moi/code',
      headers: { authorization: `Bearer ${jeton}` },
    });
    expect(nouveau.statusCode).toBe(201);
    expect(nouveau.json()).toMatchObject({ sessionsFermees: 2 });
    expect((await moi(jeton)).statusCode).toBe(200);
    expect((await moi(telephone)).statusCode).toBe(401);
    expect((await moi(tablette)).statusCode).toBe(401);
    expect((await moi(autreJoueur)).statusCode).toBe(200);
  });

  it('« Déconnecter mes autres appareils » ferme les autres sessions et garde celle-ci (US-047)', async () => {
    const { jeton, codeRecuperation } = (await creer()).json<Creation>();
    const telephone = await connecter(codeRecuperation);
    const autreJoueur = (await creer('Bob')).json<Creation>().jeton;
    const deconnecter = (j?: string) =>
      app.inject({
        method: 'DELETE',
        url: '/api/v1/sessions/autres',
        headers: j ? { authorization: `Bearer ${j}` } : {},
      });

    const reponse = await deconnecter(jeton);
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json()).toEqual({ sessionsFermees: 1 });
    expect((await moi(jeton)).statusCode).toBe(200);
    expect((await moi(telephone)).statusCode).toBe(401);
    expect((await moi(autreJoueur)).statusCode).toBe(200);
    expect((await deconnecter(jeton)).json()).toEqual({ sessionsFermees: 0 });
    expect((await deconnecter()).statusCode).toBe(401);
    expect((await deconnecter(telephone)).statusCode).toBe(401);
    // Le code, lui, fonctionne toujours : l'appareil déconnecté peut revenir.
    expect((await moi(await connecter(codeRecuperation))).statusCode).toBe(200);
  });

  it('garde du code une empreinte HMAC : sans la clé, ni SHA-256 ni une autre clé ne le retrouvent (ADR 0025)', async () => {
    const cle = 'cle-de-test-tiree-au-hasard-0123456789abcdef';
    await app.close();
    app = construireApp({ base: ouverte.base, cleCodes: cle });
    const { joueur, codeRecuperation } = (await creer()).json<Creation>();
    const [ligne] = await ouverte.base
      .select({ empreinte: joueurs.empreinteCode })
      .from(joueurs)
      .where(eq(joueurs.id, joueur.id));
    const normalise = codeRecuperation.replaceAll('-', '');
    expect(ligne?.empreinte).toBe(empreinteCode(cle, 'recuperation', codeRecuperation));
    expect(ligne?.empreinte).not.toBe(createHash('sha256').update(normalise).digest('hex'));
    expect(ligne?.empreinte).not.toBe(
      empreinteCode(CLE_CODES_DEVELOPPEMENT, 'recuperation', codeRecuperation),
    );

    // Une API qui n'a pas la bonne clé ne reconnaît pas le code.
    const autreCle = construireApp({ base: ouverte.base });
    try {
      const refus = await autreCle.inject({
        method: 'POST',
        url: '/api/v1/sessions',
        payload: { code: codeRecuperation },
      });
      expect(refus.statusCode).toBe(401);
    } finally {
      await autreCle.close();
    }
    expect(await connecter(codeRecuperation)).toBeTruthy();
  });
});
