import AxeBuilder from '@axe-core/playwright';
import { type APIRequestContext, expect, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

// US-079 : une version du site par langue, sous /fr/ et /en/, et la page d'accueil du site (/) qui emmène le joueur
// dans la sienne. Seul le build de production a ces versions (`npm run test:e2e:production`, la CI) : le serveur de
// développement sert le français seul, sans préfixe.

async function versionsParLangue(request: APIRequestContext): Promise<boolean> {
  const script = await request.get('/langue.js');
  return (script.headers()['content-type'] ?? '').includes('javascript');
}

test.beforeEach(async ({ request }) => {
  // Ignorés hors production : le serveur de développement ne sert qu'une langue, sans préfixe ni page de la racine.
  test.skip(!(await versionsParLangue(request)), 'serveur de développement : une seule langue');
});

test('la page d’accueil du site emmène dans la langue du navigateur, l’anglais à défaut', async ({
  browser,
}) => {
  for (const [locale, langue] of [
    ['fr-FR', 'fr'],
    ['en-US', 'en'],
    ['de-DE', 'en'],
  ] as const) {
    const contexte = await browser.newContext({ locale });
    const page = await contexte.newPage();
    await page.goto('/');
    await expect(page, locale).toHaveURL(`/${langue}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', langue);
    await contexte.close();
  }
});

test('un lien d’avant les langues garde sa page, ses paramètres et son ancre', async ({ page }) => {
  await page.goto('/cartes/12?retour=1#haut');
  await expect(page).toHaveURL('/fr/cartes/12?retour=1#haut');
  await page.goto('/en');
  await expect(page).toHaveURL('/en/');
});

test('le sélecteur bascule sur la même page dans l’autre langue, et le choix est retenu', async ({
  page,
}) => {
  await page.goto('/fr/cartes');
  const francais = page.getByRole('navigation', { name: 'Langue' });
  await expect(francais.locator('[aria-current="true"]')).toHaveText('FRFrançais');
  await francais.getByRole('link', { name: 'English' }).click();

  await expect(page).toHaveURL('/en/cartes');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const anglais = page.getByRole('navigation', { name: 'Language' });
  await expect(anglais.getByRole('link', { name: 'Français' })).toHaveAttribute('lang', 'fr');
  const audit = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
  expect(audit.violations).toEqual([]);

  // La page d'accueil du site relit le choix, avant la langue du navigateur (fr-FR ici).
  await page.goto('/');
  await expect(page).toHaveURL('/en/');
  await page
    .getByRole('navigation', { name: 'Language' })
    .getByRole('link', { name: 'Français' })
    .click();
  await expect(page).toHaveURL('/fr/');
  await page.goto('/collection');
  await expect(page).toHaveURL('/fr/collection');
});

test('l’ancien service worker de la racine laisse place à celui qui se désinstalle', async ({
  request,
}) => {
  const ancien = await request.get('/ngsw-worker.js');
  expect(ancien.headers()['content-type']).toContain('javascript');
  expect(await ancien.text()).toContain('unregister');
  for (const langue of ['fr', 'en']) {
    const manifeste = (await (await request.get(`/${langue}/manifest.webmanifest`)).json()) as {
      lang: string;
      start_url: string;
    };
    expect(manifeste).toMatchObject({ lang: langue, start_url: `/${langue}/` });
  }
});
