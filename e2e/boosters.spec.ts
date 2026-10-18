import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

async function creerCompte(page: Page, pseudo: string) {
  await page.goto('/compte');
  await page.getByLabel('Pseudo').fill(pseudo);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: `Connecté en tant que ${pseudo}` })).toBeVisible();
}

test('sans compte, la page des boosters invite à en créer un', async ({ page }) => {
  await page.goto('/boosters');
  await expect(page.getByText('il faut un compte pour la garder')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Créer un compte' })).toBeVisible();
});

test('un nouveau compte reçoit 5 boosters et en ouvre un : 5 cartes révélées', async ({ page }) => {
  await creerCompte(page, 'Ouvreuse e2e');
  await page.getByRole('link', { name: 'Boosters' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mes boosters' })).toBeVisible();
  await expect(page.getByText('5 boosters en stock')).toBeVisible();
  await expect(page.getByText(/Prochain booster gratuit dans/)).toBeVisible();

  await page.getByRole('button', { name: 'Ouvrir un booster' }).click();
  await expect(page.getByRole('heading', { name: /Votre booster : 5 cartes/ })).toBeVisible();
  await expect(page.locator('hip-vignette-carte')).toHaveCount(5);
  // Premier booster : au moins la première carte est forcément nouvelle.
  await expect(page.getByText('Nouvelle !').first()).toBeVisible();
  await expect(page.getByText('4 boosters en stock')).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`un booster ouvert ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await creerCompte(page, `Axe ${theme}`);
    await page.goto('/boosters');
    await page.getByRole('button', { name: 'Ouvrir un booster' }).click();
    await expect(page.locator('hip-vignette-carte')).toHaveCount(5);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations).toEqual([]);
  });
}
