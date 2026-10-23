import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  configurationRest,
  correspond,
  entetesPour,
  fichiersAPublier,
  globVersRegExp,
  lireConfiguration,
  reecriturePour,
} from './hebergement.ts';

const RACINE = join(import.meta.dirname, '..', '..');
const { projet, hosting } = lireConfiguration(RACINE);

const IMMUABLE = 'public, max-age=31536000, immutable';
const UN_JOUR = 'public, max-age=86400';

describe('globs de Firebase Hosting', () => {
  const teste = (glob: string, chemin: string) => correspond({ source: glob }, chemin);

  it('** traverse les dossiers, * et ? s’arrêtent à la barre oblique', () => {
    expect(teste('**', '/')).toBe(true);
    expect(teste('**', '/cartes/set-1/1-320.avif')).toBe(true);
    expect(teste('/*.js', '/main.js')).toBe(true);
    expect(teste('/*.js', '/a/main.js')).toBe(false);
    expect(teste('/?.txt', '/a.txt')).toBe(true);
    expect(teste('/?.txt', '/ab.txt')).toBe(false);
  });

  it('**/ désigne zéro ou plusieurs dossiers', () => {
    expect(teste('/cartes/**/*.webp', '/cartes/a.webp')).toBe(true);
    expect(teste('/cartes/**/*.webp', '/cartes/set-1/a.webp')).toBe(true);
    expect(teste('**/.*', '.cache')).toBe(true);
    expect(teste('**/.*', 'cartes/.DS_Store')).toBe(true);
    expect(teste('**/.*', 'cartes/a.webp')).toBe(false);
  });

  it('comprend les extglobs, les accolades et les classes de caractères, en respectant la casse', () => {
    expect(teste('/*.@(css|js)', '/a.css')).toBe(true);
    expect(teste('/*.@(css|js)', '/a.json')).toBe(false);
    expect(teste('/a-+([0-9A-Z]).js', '/a-B12.js')).toBe(true);
    expect(teste('/a-+([0-9A-Z]).js', '/a-b12.js')).toBe(false);
    expect(teste('/a?(-b).js', '/a.js')).toBe(true);
    expect(teste('/a*(-b).js', '/a-b-b.js')).toBe(true);
    expect(teste('/{x,y}/**', '/y/z')).toBe(true);
    expect(teste('/[!a]', '/b')).toBe(true);
    expect(teste('/[!a]', '/a')).toBe(false);
  });

  it('un ! en tête inverse le motif', () => {
    expect(globVersRegExp('!/api/**').inverse).toBe(true);
    expect(teste('!/api/**', '/api/v1/sante')).toBe(false);
    expect(teste('!/api/**', '/collection')).toBe(true);
    expect(teste('!/api/**', '/')).toBe(true);
  });

  it('les caractères spéciaux des expressions régulières restent littéraux', () => {
    expect(teste('/a.b', '/a.b')).toBe(true);
    expect(teste('/a.b', '/axb')).toBe(false);
    expect(teste('/a+b', '/a+b')).toBe(true);
  });

  it('accepte aussi une expression régulière', () => {
    expect(correspond({ regex: '^/[^.]*$' }, '/collection')).toBe(true);
    expect(correspond({ regex: '^/[^.]*$' }, '/main.js')).toBe(false);
  });

  it('refuse un glob mal formé', () => {
    expect(() => globVersRegExp('/a@(b')).toThrow('non fermée');
    expect(() => globVersRegExp('/[ab')).toThrow('crochet');
  });
});

describe('firebase.json', () => {
  it('vise le projet et le service de l’API créés par US-049', () => {
    expect(projet).toBe('hipmaster');
    expect(reecriturePour(hosting, '/api/v1/sante')).toEqual({
      source: '/api/**',
      run: { serviceId: 'hipmaster-api', region: 'europe-west3' },
    });
  });

  it('renvoie index.html pour les routes Angular', () => {
    for (const route of ['/', '/collection', '/cartes/12', '/duels/abc', '/inconnue']) {
      expect(reecriturePour(hosting, route)?.destination).toBe('/index.html');
    }
  });

  it('pose une CSP stricte, sans unsafe-inline ni unsafe-eval', () => {
    const csp = entetesPour(hosting, '/')['content-security-policy'] ?? '';
    for (const directive of [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ]) {
      expect(csp).toContain(directive);
    }
    expect(csp).not.toMatch(/unsafe-|\*|data:|https?:/);
  });

  it('pose les en-têtes de sécurité sur toutes les réponses, API comprise', () => {
    for (const chemin of [
      '/',
      '/collection',
      '/main-HIUHHL6L.js',
      '/cartes/set-1/1-320.avif',
      '/api/v1/sante',
    ]) {
      expect(entetesPour(hosting, chemin)).toMatchObject({
        'content-security-policy': expect.stringContaining("script-src 'self'") as string,
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'same-origin',
        'permissions-policy': expect.stringContaining('camera=()') as string,
        'x-frame-options': 'DENY',
        'x-robots-tag': 'noindex',
      });
    }
  });

  it('laisse le presse-papiers permis : le code de récupération et le lien de duel s’y copient', () => {
    expect(entetesPour(hosting, '/')['permissions-policy']).not.toContain('clipboard');
  });

  it.each([
    ['/', 'no-cache'],
    ['/index.html', 'no-cache'],
    ['/collection', 'no-cache'],
    // Route Angular sous le même préfixe que les illustrations (US-057) : c'est index.html, jamais en cache.
    ['/cartes/12', 'no-cache'],
    ['/robots.txt', 'no-cache'],
    ['/favicon.ico', 'no-cache'],
    // Le service worker d'une future PWA (US-063) n'a pas d'empreinte : il ne doit pas devenir immuable.
    ['/ngsw-worker.js', 'no-cache'],
    ['/main-HIUHHL6L.js', IMMUABLE],
    ['/chunk-AB12CD34.js', IMMUABLE],
    ['/styles-7UTGZTYA.css', IMMUABLE],
    ['/cartes/set-1/1-320.avif', UN_JOUR],
    ['/cartes/set-1/71-640.webp', UN_JOUR],
  ])('cache de %s : %s', (chemin, attendu) => {
    expect(entetesPour(hosting, chemin)['cache-control']).toBe(attendu);
  });

  it('laisse l’API décider de son cache (no-store d’US-047, cache public d’US-057)', () => {
    expect(entetesPour(hosting, '/api/v1/cartes')['cache-control']).toBeUndefined();
    expect(entetesPour(hosting, '/api/v1/moi')['cache-control']).toBeUndefined();
  });

  it('se traduit pour l’API REST de Firebase Hosting', () => {
    const configuration = configurationRest(hosting);
    expect(configuration.rewrites).toEqual([
      { glob: '/api/**', run: { serviceId: 'hipmaster-api', region: 'europe-west3' } },
      { glob: '**', path: '/index.html' },
    ]);
    expect(configuration.headers.map((regle) => regle.glob)).toEqual([
      '**',
      '!/api/**',
      '/cartes/**/*.@(avif|webp)',
      '/*-+([0-9A-Z]).@(css|js)',
    ]);
    expect(configuration.headers[0]?.headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('publie le build de production d’Angular, sans CSS critique en ligne que la CSP bloquerait', () => {
    expect(hosting.public).toBe('apps/web/dist/web/browser');
    const angular = JSON.parse(readFileSync(join(RACINE, 'apps/web/angular.json'), 'utf8')) as {
      projects: { web: { architect: { build: { configurations: { production: unknown } } } } };
    };
    expect(angular.projects.web.architect.build.configurations.production).toMatchObject({
      optimization: { styles: { inlineCritical: false } },
    });
  });

  it('demande aux robots de ne rien indexer', () => {
    expect(readFileSync(join(RACINE, 'apps/web/public/robots.txt'), 'utf8')).toMatch(
      /^User-agent: \*\nDisallow: \/$/m,
    );
    expect(readFileSync(join(RACINE, 'apps/web/src/index.html'), 'utf8')).toContain(
      '<meta name="robots" content="noindex" />',
    );
  });
});

describe('traduction pour l’API REST', () => {
  it('donne la région par défaut de Hosting à une réécriture Cloud Run qui n’en a pas', () => {
    expect(
      configurationRest({
        public: 'x',
        rewrites: [{ source: '/api/**', run: { serviceId: 'api' } }],
      }).rewrites,
    ).toEqual([{ glob: '/api/**', run: { serviceId: 'api', region: 'us-central1' } }]);
  });

  it('refuse ce qu’elle ne sait pas traduire plutôt que de l’oublier', () => {
    expect(() => configurationRest({ public: 'x', rewrites: [{ source: '**' }] })).toThrow(
      'destination',
    );
    expect(() => configurationRest({ public: 'x', headers: [{ headers: [] }] })).toThrow('source');
  });
});

describe('fichiers à publier', () => {
  const dossier = mkdtempSync(join(tmpdir(), 'hipmaster-hebergement-'));
  afterAll(() => rmSync(dossier, { recursive: true, force: true }));

  it('liste le dossier publié en chemins servis, sans les fichiers ignorés', () => {
    mkdirSync(join(dossier, 'publie', 'cartes', 'set-1'), { recursive: true });
    for (const fichier of [
      'index.html',
      'main-AB12CD34.js',
      '.cache',
      'cartes/set-1/1-320.avif',
      'cartes/.DS_Store',
    ]) {
      writeFileSync(join(dossier, 'publie', fichier), 'contenu');
    }
    const fichiers = fichiersAPublier(dossier, { public: 'publie', ignore: ['**/.*'] });
    expect([...fichiers.keys()]).toEqual([
      '/cartes/set-1/1-320.avif',
      '/index.html',
      '/main-AB12CD34.js',
    ]);
    expect(fichiers.get('/index.html')).toBe(join(dossier, 'publie', 'index.html'));
  });

  it('lit .firebaserc et refuse une clé de firebase.json qu’il ne sait pas traduire', () => {
    writeFileSync(join(dossier, '.firebaserc'), JSON.stringify({ projects: { default: 'essai' } }));
    writeFileSync(
      join(dossier, 'firebase.json'),
      JSON.stringify({ hosting: { public: 'publie' } }),
    );
    expect(lireConfiguration(dossier).projet).toBe('essai');
    writeFileSync(
      join(dossier, 'firebase.json'),
      JSON.stringify({ hosting: { public: 'publie', redirects: [] } }),
    );
    expect(() => lireConfiguration(dossier)).toThrow('redirects');
  });
});
