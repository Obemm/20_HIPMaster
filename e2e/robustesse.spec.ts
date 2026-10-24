import AxeBuilder from '@axe-core/playwright';
import { expect, type Route, test } from '@playwright/test';
import { creerCompteParApi } from './duel-api';
import { REGLES_WCAG } from './axe';

// US-055 : le front face au démarrage à froid, aux pannes passagères, aux sessions expirées et aux 429. Les pannes
// sont simulées par Playwright (`page.route`) : l'API réelle répond dès que la simulation la laisse passer.

const indisponible = (route: Route) =>
  route.fulfill({
    status: 503,
    contentType: 'application/problem+json',
    body: JSON.stringify({ type: 'about:blank', title: 'Service indisponible', status: 503 }),
  });

/** Trois essais (le premier, puis deux nouvelles tentatives après 1 s et 3 s) avant que l'écran ne parle de panne. */
const APRES_NOUVELLES_TENTATIVES = { timeout: 15_000 };

test('une lecture qui échoue une fois (503 puis 200) est retentée seule : le joueur ne voit rien', async ({
  page,
}) => {
  let appels = 0;
  await page.route('**/api/v1/raretes', (route) => {
    appels++;
    return appels === 1 ? indisponible(route) : route.continue();
  });
  await page.goto('/boosters');
  const raretes = page.getByRole('region', { name: 'Chances par booster' });
  await expect(raretes.getByRole('listitem')).toHaveCount(4);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(appels).toBe(2);
});

test('serveur injoignable (503 puis 200) : le compte reste gardé, rien ne propose d’en créer un autre', async ({
  page,
}) => {
  const jeton = await creerCompteParApi(page, 'Patiente e2e');
  let panne = true;
  await page.route('**/api/v1/moi', (route) => (panne ? indisponible(route) : route.continue()));
  await page.goto('/compte');

  const alerte = page.getByRole('alert');
  await expect(alerte).toContainText('Serveur injoignable', APRES_NOUVELLES_TENTATIVES);
  await expect(alerte).toContainText('votre compte reste gardé par ce navigateur');
  await expect(page.getByRole('button', { name: 'Créer mon compte' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Créer un compte' })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('hipmaster.jeton'))).toBe(jeton);

  panne = false;
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(
    page.getByRole('heading', { name: 'Connecté en tant que Patiente e2e' }),
  ).toBeVisible();
});

test('session expirée : « Mon compte » le dit, puis ramène le joueur à sa page une fois reconnecté', async ({
  page,
}) => {
  const reponse = await page.request.post('/api/v1/joueurs', {
    data: { pseudo: 'Revenante e2e' },
  });
  expect(reponse.status()).toBe(201);
  const { codeRecuperation } = (await reponse.json()) as { codeRecuperation: string };
  // Un jeton que l'API ne reconnaît plus : session expirée, ou fermée depuis un autre appareil.
  await page.addInitScript(() => localStorage.setItem('hipmaster.jeton', 'jeton-expire'));

  await page.goto('/collection');
  await expect(page).toHaveURL(/\/compte\?retour=%2Fcollection$/);
  await expect(page.getByRole('alert')).toContainText('Session expirée');
  await page.getByLabel('Code de récupération').fill(codeRecuperation);
  await page.getByRole('button', { name: 'Retrouver mon compte' }).click();
  await expect(page).toHaveURL(/\/collection$/);
  await expect(page.getByRole('heading', { name: 'Set 1 : 0 / 71 cartes' })).toBeVisible();
});

test('trop de demandes (429) : le message dit combien de temps patienter, puis on réessaie', async ({
  page,
}) => {
  let limite = true;
  await page.route('**/api/v1/cartes', (route) =>
    limite
      ? route.fulfill({
          status: 429,
          headers: { 'Retry-After': '30' },
          contentType: 'application/problem+json',
          body: JSON.stringify({ type: 'about:blank', title: 'Trop de requêtes', status: 429 }),
        })
      : route.continue(),
  );
  await page.goto('/cartes');
  await expect(page.getByRole('alert')).toContainText(
    'Trop de demandes en peu de temps : patientez 30 s, puis réessayez.',
  );
  limite = false;
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page.getByRole('status')).toContainText('71 cartes affichées');
});

test('un lien de partie ou de duel piégé n’appelle aucune autre route de l’API', async ({
  page,
}) => {
  await creerCompteParApi(page, 'Prudente e2e');
  const appels: string[] = [];
  page.on('request', (requete) => {
    const chemin = new URL(requete.url()).pathname;
    if (chemin.startsWith('/api/')) appels.push(chemin);
  });

  await page.goto('/jouer/..%2F..%2Fv1%2Fraretes');
  await expect(page.getByRole('heading', { name: 'Partie introuvable' })).toBeVisible();
  await page.goto('/duels/..%2F..%2Fv1%2Fraretes');
  await expect(page.getByRole('heading', { name: 'Défi introuvable' })).toBeVisible();
  const detournes = appels.filter(
    (chemin) =>
      chemin.endsWith('/raretes') ||
      chemin.startsWith('/api/v1/parties') ||
      chemin.startsWith('/api/v1/duels'),
  );
  expect(detournes).toEqual([]);
});

test('avant le démarrage du jeu, la page dit qu’elle charge ; sans JavaScript, elle dit pourquoi', async ({
  page,
  browser,
}) => {
  const html = await (await page.request.get('/')).text();
  expect(html).toContain('<meta name="color-scheme" content="light dark"');
  expect(html).toContain('Chargement de HIPMaster…');

  const sansScript = await browser.newContext({ javaScriptEnabled: false });
  const pageSansScript = await sansScript.newPage();
  await pageSansScript.goto('/');
  // Le texte d'un <noscript> échappe à getByText : on le cherche par son rôle.
  await expect(pageSansScript.getByRole('paragraph')).toHaveText(
    'HIPMaster a besoin de JavaScript : activez-le dans votre navigateur pour jouer.',
  );
  await expect(pageSansScript.getByText('Chargement de HIPMaster…')).toBeHidden();
  await sansScript.close();
});

test('une déconnexion dans un autre onglet est vue par celui-ci', async ({ page }) => {
  await creerCompteParApi(page, 'Deux onglets e2e');
  await page.goto('/compte');
  await expect(
    page.getByRole('heading', { name: 'Connecté en tant que Deux onglets e2e' }),
  ).toBeVisible();
  const autreOnglet = await page.context().newPage();
  await autreOnglet.goto('/');
  await expect(
    autreOnglet.getByRole('link', { name: 'Mon compte : Deux onglets e2e' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(autreOnglet.getByRole('link', { name: 'Créer un compte' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`un écran en panne, avec « Réessayer », ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.route('**/api/v1/raretes', indisponible);
    // Les chances par booster, sur l'écran des boosters depuis US-061.
    await page.goto('/boosters');
    await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible(
      APRES_NOUVELLES_TENTATIVES,
    );
    const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(violations).toEqual([]);
  });
}
