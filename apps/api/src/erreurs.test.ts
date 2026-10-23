import { afterEach, describe, expect, it } from 'vitest';
import { type App, construireApp } from './app.ts';
import { creerJournal } from './journaux.ts';
import { LIMITES_DEBIT } from './limites.ts';
import { EVENEMENT_ERREUR, MESSAGE_MAX, SERVICE_FRONT } from './routes/erreurs.ts';

// Erreurs JavaScript des navigateurs, vers Error Reporting (US-051).

type Ligne = Record<string, unknown>;

const applis: App[] = [];
afterEach(async () => {
  await Promise.all(applis.splice(0).map((a) => a.close()));
});

function appCapturee(options: Parameters<typeof construireApp>[0] = {}) {
  const lignes: Ligne[] = [];
  const brut: string[] = [];
  const journal = creerJournal({
    niveau: 'info',
    flux: {
      write: (ligne: string) => {
        brut.push(ligne);
        lignes.push(JSON.parse(ligne) as Ligne);
      },
    },
  });
  const app = construireApp({ journal, projet: 'hipmaster', ...options });
  applis.push(app);
  return { app, lignes, brut };
}

const PILE_CHROME = `TypeError: Cannot read properties of undefined (reading 'nom')
    at e.afficher (https://hipmaster.web.app/main-ABCD1234.js:1:2345)
    at https://hipmaster.web.app/main-ABCD1234.js:1:6789`;

const signaler = (app: App, payload: object, remoteAddress = '203.0.113.1') =>
  app.inject({ method: 'POST', url: '/api/v1/erreurs', payload, remoteAddress });

describe('POST /erreurs', () => {
  it('journalise l’erreur comme un événement Error Reporting du service front, sans données du joueur', async () => {
    const { app, lignes, brut } = appCapturee();
    const reponse = await app.inject({
      method: 'POST',
      url: '/api/v1/erreurs',
      headers: { authorization: 'Bearer jeton-secret-du-joueur' },
      payload: {
        message: "Cannot read properties of undefined (reading 'nom')",
        page: '/collection/12',
        version: 'main-ABCD1234',
        pile: PILE_CHROME,
      },
    });
    expect(reponse.statusCode).toBe(204);
    expect(reponse.body).toBe('');

    const erreur = lignes.find((l) => l['severity'] === 'ERROR');
    expect(erreur).toMatchObject({
      '@type': EVENEMENT_ERREUR,
      serviceContext: { service: SERVICE_FRONT, version: 'main-ABCD1234' },
      context: { reportLocation: { filePath: '/collection/12', lineNumber: 0 } },
      // La pile reprend déjà le message : elle est le texte lu par Error Reporting.
      message: PILE_CHROME,
    });
    expect(brut.join('')).not.toContain('jeton-secret-du-joueur');
  });

  it('place le message avant une pile qui ne le reprend pas (format de Firefox), et s’en passe sans pile', async () => {
    const { app, lignes } = appCapturee();
    const pileFirefox = 'afficher@https://hipmaster.web.app/main-ABCD1234.js:1:2345';
    await signaler(app, {
      message: 'e is undefined',
      page: '/',
      version: 'main-A',
      pile: pileFirefox,
    });
    await signaler(app, { message: 'Échec', page: '/duels', version: 'main-A' });
    const messages = lignes.filter((l) => l['severity'] === 'ERROR').map((l) => l['message']);
    expect(messages).toEqual([`e is undefined\n${pileFirefox}`, 'Échec']);
  });

  it('refuse une page avec paramètres (code d’invitation), une adresse complète ou un message trop long', async () => {
    const { app, brut } = appCapturee();
    const base = { message: 'boum', version: 'main-A' };
    for (const page of [
      '/compte?invitation=ABCD-EFGH',
      '/compte#x',
      'https://hipmaster.web.app/',
    ]) {
      expect((await signaler(app, { ...base, page })).statusCode).toBe(400);
    }
    const long = await signaler(app, { ...base, page: '/', message: 'x'.repeat(MESSAGE_MAX + 1) });
    expect(long.statusCode).toBe(400);
    expect((await signaler(app, { ...base, page: '/', version: '../x y' })).statusCode).toBe(400);
    expect(brut.join('')).not.toContain('ABCD-EFGH');
  });

  it('est limitée en débit par adresse', async () => {
    const { app } = appCapturee({
      limites: { ...LIMITES_DEBIT, erreurNavigateur: { max: 2, fenetreMs: 3_600_000 } },
    });
    const corps = { message: 'boum', page: '/', version: 'main-A' };
    expect((await signaler(app, corps)).statusCode).toBe(204);
    expect((await signaler(app, corps)).statusCode).toBe(204);
    const refus = await signaler(app, corps);
    expect(refus.statusCode).toBe(429);
    expect(refus.headers['retry-after']).toBeDefined();
    expect((await signaler(app, corps, '203.0.113.2')).statusCode).toBe(204);
  });
});
