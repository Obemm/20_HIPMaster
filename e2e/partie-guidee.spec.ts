import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

// La partie guidée (US-067, ADR 0041) : decks et graine fixes, chaque étape attend l'action prévue.

const bulle = (page: Page) => page.locator('#bulle-guide');

async function etape(page: Page, titre: string) {
  await expect(bulle(page).getByRole('heading')).toContainText(titre);
}

async function poser(page: Page, carte: string) {
  await page.locator(`#main-${carte}`).click();
  await page
    .locator('#detail-main')
    .getByRole('button', { name: /^Poser/ })
    .click();
}

async function decommissionner(page: Page, carte: string) {
  await page.locator(`#main-${carte}`).click();
  await page
    .locator('#detail-main')
    .getByRole('button', { name: /^Décommissionner/ })
    .click();
}

async function attaquer(page: Page, attaquant: string, cible: string) {
  await page.locator(`#plateau-${attaquant}`).click();
  await page.locator(`#plateau-${cible}`).click();
  await page.getByRole('button', { name: /^Attaquer avec / }).click();
}

const finir = (page: Page) => page.getByRole('button', { name: 'Finir mon tour' }).click();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hipmaster.coups-de-pouce', 'non'));
});

test('la partie guidée mène pas à pas jusqu’à la victoire, sur téléphone, sans booster (US-067)', async ({
  page,
}) => {
  test.slow();
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Apprendre à jouer (5 min)' }).click();
  await page.getByRole('button', { name: 'Apprendre à jouer (5 min)' }).click();
  await expect(page).toHaveURL(/\/jouer\/[0-9a-f-]{36}$/);
  // Pas d'aide par-dessus : la bulle explique.
  await expect(page.getByRole('dialog', { name: 'Comment jouer ?' })).toBeHidden();

  await etape(page, 'Le Débit paie vos cartes');
  await expect(page.locator('#main-j1-02')).toHaveClass(/conseille/);
  const audit = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
  expect(audit.violations).toEqual([]);
  // Un autre geste est refusé poliment.
  await finir(page);
  await expect(bulle(page)).toContainText('Pas tout de suite');
  await poser(page, 'j1-02');

  await etape(page, 'Finir son tour');
  await finir(page);
  await etape(page, 'Attaquer le SI');
  await attaquer(page, 'j1-02', 'si');
  await etape(page, 'Décommissionner pour du Débit');
  await decommissionner(page, 'j1-09');
  await etape(page, 'Deux cartes ce tour-ci');
  await poser(page, 'j1-06');
  await expect(bulle(page)).toContainText('Adaptateur JDBC');
  await poser(page, 'j1-12');
  await etape(page, 'Finir son tour');
  await finir(page);
  await etape(page, 'La Garde');
  await attaquer(page, 'j1-06', 'j2-08');
  await etape(page, 'La riposte');
  await attaquer(page, 'j1-12', 'j2-08');
  await etape(page, 'Le SI est à découvert');
  await attaquer(page, 'j1-02', 'si');
  await etape(page, 'Renforcer son plateau');
  await poser(page, 'j1-07');
  await etape(page, 'Finir son tour');
  await finir(page);
  await etape(page, 'À vous de jouer');
  await bulle(page).getByRole('button', { name: 'Compris' }).click();
  await expect(bulle(page)).toBeHidden();

  // La suite au conseil, par l'API, pour aller vite jusqu'à la victoire.
  const id = /\/jouer\/([0-9a-f-]{36})$/.exec(page.url())?.[1];
  for (let i = 0; i < 40; i++) {
    const conseil = await page.request.get(`/api/v1/parties/${id}/conseil`);
    if (conseil.status() !== 200) break;
    const { action } = (await conseil.json()) as { action: object };
    await page.request.post(`/api/v1/parties/${id}/actions`, { data: action });
  }
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Victoire !' })).toBeVisible();
  await expect(page.getByText('Bravo, vous savez jouer !')).toBeVisible();
  await expect(page.getByText('La partie guidée ne rapporte pas de booster.')).toBeVisible();
  await page.getByRole('button', { name: 'Jouer contre Stagiaire avec le conseil' }).click();
  await expect(page).toHaveURL(/\/jouer$/);
  // Finie, elle n'est plus proposée en premier.
  await expect(page.getByRole('heading', { name: 'Revoir les règles en jouant' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('hipmaster.conseil-chaque-coup'))).toBe(
    'oui',
  );
});

test('la partie guidée se passe à tout moment', async ({ page }) => {
  await page.goto('/jouer');
  await page.getByRole('button', { name: 'Apprendre à jouer (5 min)' }).click();
  await etape(page, 'Le Débit paie vos cartes');
  await bulle(page).getByRole('button', { name: 'Passer le guide' }).click();
  await expect(bulle(page)).toBeHidden();
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Apprendre à jouer (5 min)' })).toHaveCount(0);
});
