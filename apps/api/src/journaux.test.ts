import { DrizzleQueryError } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { type App, construireApp } from './app.ts';
import { champsTrace, creerJournal } from './journaux.ts';

type Ligne = Record<string, unknown>;

/** Un journal qui garde ses lignes, lues comme Cloud Logging les lirait. */
function journalCapture(niveau: 'info' | 'debug' = 'info') {
  const lignes: Ligne[] = [];
  const brut: string[] = [];
  const journal = creerJournal({
    niveau,
    flux: {
      write: (ligne: string) => {
        brut.push(ligne);
        lignes.push(JSON.parse(ligne) as Ligne);
      },
    },
  });
  return { journal, lignes, brut };
}

const TRACE = '105445aa7843bc8bf206b12000100000';
const JETON = 'jeton-de-session-tres-secret';
const CODE = 'ABCD-EFGH-JKLM';

describe('format des journaux (US-046)', () => {
  it('écrit des lignes JSON avec severity, message et une heure ISO, sans level ni msg', () => {
    const { journal, lignes } = journalCapture();
    journal.info({ connexion: 1 }, 'Connexion PostgreSQL fermée');
    journal.warn('Attention');
    journal.fatal('Arrêt');

    expect(lignes[0]).toMatchObject({
      severity: 'INFO',
      message: 'Connexion PostgreSQL fermée',
      connexion: 1,
    });
    expect(lignes[0]?.['time']).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    expect(lignes[0]).not.toHaveProperty('level');
    expect(lignes[0]).not.toHaveProperty('msg');
    expect(lignes[0]).not.toHaveProperty('pid');
    expect(lignes.map((l) => l['severity'])).toEqual(['INFO', 'WARNING', 'CRITICAL']);
  });

  it('respecte le niveau demandé (LOG_LEVEL)', () => {
    const { journal, lignes } = journalCapture('info');
    journal.debug('détail');
    expect(lignes).toHaveLength(0);
  });

  it('range la pile d’une erreur dans stack_trace, pour Error Reporting', () => {
    const { journal, lignes } = journalCapture();
    journal.error({ err: new TypeError('boum') }, 'boum');
    expect(lignes[0]).toMatchObject({
      severity: 'ERROR',
      message: 'boum',
      err: { type: 'TypeError', message: 'boum' },
    });
    expect(lignes[0]?.['stack_trace']).toMatch(/^TypeError: boum\n\s+at /);
  });

  it('ne recopie jamais les paramètres d’une requête SQL en échec', () => {
    const { journal, brut } = journalCapture();
    const cause = Object.assign(new Error('duplicate key value'), {
      code: '23505',
      detail: 'Key (pseudo)=(Alice) already exists.',
    });
    const erreur = new DrizzleQueryError(
      'insert into "joueurs" ("pseudo") values ($1)',
      ['Alice'],
      cause,
    );
    journal.error({ err: erreur }, 'échec');
    const ligne = JSON.parse(brut[0] ?? '{}') as Ligne;
    expect(ligne['err']).toEqual({
      type: 'DrizzleQueryError',
      message: 'Failed query: insert into "joueurs" ("pseudo") values ($1)',
      cause: { type: 'Error', message: 'duplicate key value', code: '23505' },
    });
    expect(ligne['stack_trace']).toMatch(
      /^Error: Failed query: insert into "joueurs" \("pseudo"\) values \(\$1\)\n\s+at /,
    );
    expect(brut[0]).not.toContain('Alice');
  });
});

describe('trace Cloud Run', () => {
  it('relie un journal à la trace et au span de sa requête', () => {
    expect(champsTrace(`${TRACE}/1;o=1`, 'hipmaster')).toEqual({
      'logging.googleapis.com/trace': `projects/hipmaster/traces/${TRACE}`,
      'logging.googleapis.com/spanId': '0000000000000001',
      'logging.googleapis.com/trace_sampled': true,
    });
    expect(champsTrace(`${TRACE}/12345678901234567890`, 'hipmaster')).toMatchObject({
      'logging.googleapis.com/spanId': 'ab54a98ceb1f0ad2',
    });
  });

  it('ne produit rien sans projet, sans en-tête ou avec un en-tête invalide', () => {
    expect(champsTrace(`${TRACE}/1;o=1`, null)).toEqual({});
    expect(champsTrace(undefined, 'hipmaster')).toEqual({});
    expect(champsTrace('pas-une-trace', 'hipmaster')).toEqual({});
  });
});

describe('journaux des requêtes', () => {
  let app: App | undefined;
  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  /** L'API avec deux routes qui échouent, et ses journaux capturés. */
  function appCapturee() {
    const capture = journalCapture();
    app = construireApp({ journal: capture.journal, projet: 'hipmaster' });
    app.post('/api/v1/essais/panne', () => {
      throw new Error('Base injoignable');
    });
    app.get('/api/v1/essais/requete-sql', () => {
      throw new DrizzleQueryError('select 1 where $1', [CODE], new Error('timeout'));
    });
    return { app, ...capture };
  }

  it('chaque journal d’une requête porte la trace de Cloud Run', async () => {
    const { app, lignes } = appCapturee();
    const reponse = await app.inject({
      method: 'GET',
      url: '/api/v1/sante',
      headers: { 'x-cloud-trace-context': `${TRACE}/7;o=1` },
    });
    expect(reponse.statusCode).toBe(200);
    const requete = lignes.filter((l) => l['reqId'] !== undefined);
    expect(requete.map((l) => l['message'])).toEqual(['incoming request', 'request completed']);
    for (const ligne of requete) {
      expect(ligne['logging.googleapis.com/trace']).toBe(`projects/hipmaster/traces/${TRACE}`);
    }
  });

  it('journalise une erreur 500 avec son message et sa pile, sans jeton, code ni corps de requête', async () => {
    const { app, lignes, brut } = appCapturee();
    const reponse = await app.inject({
      method: 'POST',
      url: '/api/v1/essais/panne',
      headers: { authorization: `Bearer ${JETON}`, 'x-cloud-trace-context': `${TRACE}/1` },
      payload: { code: CODE },
    });
    expect(reponse.statusCode).toBe(500);
    expect(reponse.json()).toEqual({ type: 'about:blank', title: 'Erreur interne', status: 500 });

    const erreur = lignes.find((l) => l['severity'] === 'ERROR');
    expect(erreur).toMatchObject({
      message: 'Base injoignable',
      err: { type: 'Error', message: 'Base injoignable' },
      'logging.googleapis.com/trace': `projects/hipmaster/traces/${TRACE}`,
    });
    expect(erreur?.['stack_trace']).toMatch(/^Error: Base injoignable\n\s+at .*journaux\.test\.ts/);
    const tout = brut.join('');
    expect(tout).not.toContain(JETON);
    expect(tout).not.toContain(CODE);
  });

  it('ne recopie pas les paramètres SQL d’une erreur 500', async () => {
    const { app, lignes, brut } = appCapturee();
    await app.inject({ method: 'GET', url: '/api/v1/essais/requete-sql' });
    expect(lignes.find((l) => l['severity'] === 'ERROR')).toMatchObject({
      message: 'Failed query: select 1 where $1',
    });
    expect(brut.join('')).not.toContain(CODE);
  });

  it('une requête refusée ne laisse que son code, pas le corps cité par l’erreur de syntaxe', async () => {
    const { app, lignes, brut } = appCapturee();
    const reponse = await app.inject({
      method: 'POST',
      url: '/api/v1/essais/panne',
      headers: { 'content-type': 'application/json' },
      payload: `{"code": ${CODE}}`,
    });
    expect(reponse.statusCode).toBe(400);
    expect(lignes.find((l) => l['message'] === 'Requête refusée')).toMatchObject({
      severity: 'INFO',
      statut: 400,
    });
    expect(brut.join('')).not.toContain(CODE);
  });
});
