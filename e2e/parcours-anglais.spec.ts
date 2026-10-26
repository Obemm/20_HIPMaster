import AxeBuilder from '@axe-core/playwright';
import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';
import { creerCompteParApi } from './duel-api';

// US-082 : les parcours principaux dans la version anglaise (`/en/`), audit d'accessibilité compris ; les parcours
// français sont ceux des autres fichiers. Seul le build de production a les deux versions (`npm run
// test:e2e:production`, la CI) : le serveur de développement sert le français seul.

async function versionsParLangue(request: APIRequestContext): Promise<boolean> {
  const script = await request.get('/langue.js');
  return (script.headers()['content-type'] ?? '').includes('javascript');
}

// Chaque parcours audite deux écrans ou plus : axe prend son temps sur les pages riches (catalogue, collection).
test.describe.configure({ timeout: 90_000 });

test.beforeEach(async ({ request }) => {
  // Ignorés hors production : le serveur de développement ne sert qu'une langue, sans préfixe.
  test.skip(!(await versionsParLangue(request)), 'serveur de développement : une seule langue');
});

async function auditer(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const audit = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
  expect(audit.violations).toEqual([]);
}

test('créer son compte en anglais, et lire son code de récupération', async ({ page }) => {
  await page.goto('/en/compte');
  await expect(page.getByRole('heading', { level: 1, name: 'My account' })).toBeVisible();
  await page.getByLabel('Username').fill('Player e2e');
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.getByRole('heading', { name: /Signed in as Player e2e/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your recovery code' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'My account: Player e2e' })).toBeVisible();
  await auditer(page);
});

test('ouvrir un booster en anglais, puis voir sa collection', async ({ page }) => {
  await creerCompteParApi(page, 'Opener e2e');
  await page.goto('/en/boosters');
  await expect(page.getByRole('heading', { level: 1, name: 'My boosters' })).toBeVisible();
  await expect(page.getByText('5 boosters in stock')).toBeVisible();
  await page.getByRole('button', { name: 'Open a booster' }).click();
  await expect(page.getByRole('heading', { name: /^Your booster: 5 cards/ })).toBeVisible();
  await page.getByRole('button', { name: 'Reveal all' }).click();
  await auditer(page);

  await page
    .getByRole('navigation', { name: /Main navigation/ })
    .getByRole('link', { name: 'Collection' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'My collection' })).toBeVisible();
  await auditer(page);
});

test('une carte et sa fiche « Learn more » en anglais, liens anglais compris', async ({ page }) => {
  await page.goto('/en/cartes/13');
  const fenetre = page.getByRole('dialog', { name: 'SAP Adapter' });
  await expect(fenetre).toBeVisible();
  await expect(
    fenetre
      .getByRole('region', { name: 'Abilities' })
      .getByRole('term')
      .filter({ hasText: 'Guard' }),
  ).toBeVisible();
  await fenetre.getByRole('button', { name: /Learn more/ }).click();
  const liens = fenetre.getByRole('link', { name: /new tab/ });
  await expect(liens.first()).toBeVisible();
  for (const href of await liens.evaluateAll((a) => a.map((l) => l.getAttribute('href')))) {
    expect(href).not.toContain('fr.wikipedia.org');
  }
  await auditer(page);
});

test('une partie contre le bot en anglais, sur un téléphone : finir son tour, lire le journal', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/en/jouer');
  await page.getByRole('button', { name: /^Play with Hybrid/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Game against the bot' })).toBeVisible();
  await page
    .getByRole('dialog', { name: 'How to play?' })
    .getByRole('button', { name: 'Let’s go' })
    .click();
  await expect(page.getByText(/^Level: Intern/)).toBeVisible();
  await auditer(page);

  await page.getByRole('button', { name: 'End my turn' }).click();
  await page.getByRole('button', { name: 'Log' }).click();
  await expect(page.getByRole('log')).toContainText('You draw');
  await page.keyboard.press('Escape');
  await auditer(page);
});

test('la partie guidée parle anglais, bulles du serveur comprises', async ({ page }) => {
  await page.goto('/en/jouer');
  await page
    .getByRole('button', { name: /Learn to play/ })
    .first()
    .click();
  await expect(page.getByText('Throughput pays for your cards')).toBeVisible();
  await auditer(page);
});

test('construire un deck en anglais, sur un téléphone (US-083)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const jeton = await creerCompteParApi(page, 'Builder e2e');
  await page.request.post('/api/v1/moi/boosters/ouvertures', {
    headers: { authorization: `Bearer ${jeton}` },
  });
  await page.goto('/en/decks');
  await expect(page.getByRole('heading', { level: 1, name: 'My decks' })).toBeVisible();
  await page.getByRole('link', { name: 'New deck' }).click();
  await expect(page.getByText('20 cards missing to play.')).toBeVisible();
  await page.getByLabel('Deck name').fill('My API deck');
  await page
    .getByRole('button', { name: /^Add a copy of / })
    .first()
    .click();
  await expect(page.getByText('19 cards missing to play.')).toBeVisible();
  await auditer(page);

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Deck “My API deck” saved, still incomplete.')).toBeVisible();
  await page.getByRole('link', { name: '← My decks' }).click();
  await expect(page.getByText('1 / 20 cards.')).toBeVisible();
  await auditer(page);
});
