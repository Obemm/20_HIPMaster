import { type APIRequestContext, expect, test } from '@playwright/test';

// US-078 (ADR 0046) : les illustrations portent l'empreinte de leur contenu dans leur nom, sous leur propre préfixe,
// gardées un an en cache ; une illustration absente répond 404, pas la page du jeu. Les en-têtes sont ceux de
// firebase.json : seul le build de production les pose (`npm run test:e2e:production`, la CI), avec les deux langues.

const IMMUABLE = 'public, max-age=31536000, immutable';
const NOM_A_EMPREINTE = /^\/illustrations\/set-1\/\d+-(320|640)\.[0-9a-f]{8}\.(avif|webp)$/;

async function enProduction(request: APIRequestContext): Promise<boolean> {
  const script = await request.get('/langue.js');
  return (script.headers()['content-type'] ?? '').includes('javascript');
}

test('le catalogue affiche des illustrations à empreinte, gardées un an en cache', async ({
  page,
  request,
}) => {
  const production = await enProduction(request);
  // Le serveur de développement ne sert que le français, sans préfixe de langue.
  for (const catalogue of production ? ['/fr/cartes', '/en/cartes'] : ['/cartes']) {
    await page.goto(catalogue);
    const image = page.locator('picture img').first();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.currentSrc)).not.toBe('');

    const adresse = new URL(await image.evaluate((img: HTMLImageElement) => img.currentSrc));
    expect(adresse.pathname).toMatch(NOM_A_EMPREINTE);
    const reponse = await request.get(adresse.pathname);
    expect(reponse.status()).toBe(200);
    expect(reponse.headers()['content-type']).toMatch(/^image\/(avif|webp)$/);
    if (production) expect(reponse.headers()['cache-control']).toBe(IMMUABLE);
  }
});

test.describe('règles de Firebase Hosting et du service worker', () => {
  test.beforeEach(async ({ request }) => {
    // Ignorés hors production : le serveur de développement n'applique pas firebase.json et n'a pas de service worker.
    test.skip(
      !(await enProduction(request)),
      'serveur de développement : sans Hosting ni service worker',
    );
  });

  test('une illustration absente répond 404, pas la page du jeu', async ({ request }) => {
    const reponse = await request.get('/illustrations/set-1/1-320.00000000.avif');
    expect(reponse.status()).toBe(404);
  });

  test('le service worker de chaque langue garde les illustrations par leur nouveau préfixe', async ({
    request,
  }) => {
    for (const langue of ['fr', 'en']) {
      const configuration = (await (await request.get(`/${langue}/ngsw.json`)).json()) as {
        assetGroups: { name: string; patterns: string[] }[];
      };
      const images = configuration.assetGroups.find((groupe) => groupe.name === 'images');
      expect(images?.patterns.some((motif) => motif.includes('illustrations'))).toBe(true);
      expect(images?.patterns.some((motif) => motif.includes('cartes'))).toBe(false);
    }
  });
});
