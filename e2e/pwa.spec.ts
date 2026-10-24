import { expect, test } from '@playwright/test';

// US-063 : le jeu s'installe sur l'écran d'accueil d'un téléphone. Le service worker n'existe que dans le build de
// production (`npm run test:e2e:production`, la CI) : ailleurs, seuls le manifeste et les icônes sont vérifiés.
test.use({ serviceWorkers: 'allow' });

interface Manifeste {
  short_name: string;
  icons: { src: string; sizes: string; type: string; purpose: string }[];
}

test('le manifeste rend le jeu installable : nom, couleurs, icônes, affichage autonome', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    'manifest.webmanifest',
  );
  const manifeste = (await (await request.get('/manifest.webmanifest')).json()) as Manifeste;
  expect(manifeste).toMatchObject({
    short_name: 'HIPMaster',
    lang: 'fr',
    start_url: '/',
    display: 'standalone',
    theme_color: '#0b1029',
    background_color: '#0b1029',
  });
  expect(manifeste.icons.map((i) => `${i.sizes} ${i.purpose}`)).toEqual([
    '192x192 any',
    '512x512 any',
    '512x512 maskable',
  ]);
  for (const icone of manifeste.icons) {
    const reponse = await request.get(`/${icone.src}`);
    expect(reponse.ok(), icone.src).toBe(true);
    expect(reponse.headers()['content-type']).toContain('image/png');
  }
  // Chrome lui-même : aucune raison de refuser l'installation.
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  // Seule réserve admise : la navigation privée des contextes Playwright, où Chrome n'installe jamais rien.
  expect(installabilityErrors.filter((e) => e.errorId !== 'in-incognito')).toEqual([]);
});

test('en production, l’interface s’ouvre hors ligne et dit que le jeu se joue en ligne ; l’API n’est jamais en cache', async ({
  page,
  request,
}) => {
  const ngsw = await request.get('/ngsw.json');
  if (!(ngsw.headers()['content-type'] ?? '').includes('json')) {
    // Serveur de développement : pas de service worker, rien à vérifier ici (la CI passe par la production).
    test.info().annotations.push({ type: 'hors production', description: 'sans service worker' });
    return;
  }
  test.setTimeout(90_000);
  const configuration = (await ngsw.json()) as {
    assetGroups: { urls: string[]; patterns: string[] }[];
    dataGroups?: unknown[];
  };
  expect(configuration.dataGroups ?? []).toEqual([]);
  const ressources = configuration.assetGroups.flatMap((g) => [...g.urls, ...g.patterns]);
  expect(ressources.filter((r) => r.includes('/api'))).toEqual([]);

  await page.goto('/');
  // Enregistré une fois l'application stable (au plus 30 s), puis installé avec l'interface en cache.
  const script = await page.evaluate(async () => {
    const enregistrement = await navigator.serviceWorker.ready;
    return enregistrement.active?.scriptURL ?? '';
  });
  expect(script).toMatch(/\/ngsw-worker\.js$/);
  // La page suivante est servie par le service worker, une fois l'interface entière dans son cache.
  await page.reload();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          if (!navigator.serviceWorker.controller) return false;
          for (const nom of await caches.keys()) {
            if (await (await caches.open(nom)).match('/index.html')) return true;
          }
          return false;
        }),
      { timeout: 30_000 },
    )
    .toBe(true);

  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'HIPMaster' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Pas de réseau' })).toContainText(
    'HIPMaster se joue en ligne',
  );
  await page.context().setOffline(false);
  await expect(page.getByRole('status').filter({ hasText: 'Pas de réseau' })).toHaveCount(0);
});
