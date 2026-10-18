import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

async function creerCompte(page: Page, pseudo: string) {
  await page.goto('/compte');
  await page.getByLabel('Pseudo').fill(pseudo);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: `Connecté en tant que ${pseudo}` })).toBeVisible();
}

test('la collection montre la progression, les cartes possédées et leur détail', async ({
  page,
}) => {
  await creerCompte(page, 'Collectionneuse e2e');
  await page.getByRole('link', { name: 'Collection', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Set 1 : 0 / 71 cartes' })).toBeVisible();

  await page.getByRole('link', { name: 'ouvrez un booster' }).click();
  await page.getByRole('button', { name: 'Ouvrir un booster' }).click();
  await expect(page.locator('hip-vignette-carte')).toHaveCount(5);

  await page.getByRole('link', { name: 'Collection', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Set 1 : [1-5] \/ 71 cartes/ })).toBeVisible();
  await page.getByLabel('Possession').selectOption('possedees');
  await expect(page.getByRole('status')).toHaveText(/[1-5] cartes? affichées?/);

  await page.locator('hip-vignette-carte a').first().click();
  const detail = page.getByRole('dialog');
  await expect(detail.getByText(/Dans votre collection : \d+ exemplaires?\./)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/collection$/);
  await expect(page.getByLabel('Possession')).toHaveValue('possedees');
});

for (const theme of ['light', 'dark'] as const) {
  test(`la collection ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await creerCompte(page, `Collection ${theme}`);
    await page.goto('/boosters');
    await page.getByRole('button', { name: 'Ouvrir un booster' }).click();
    await expect(page.locator('hip-vignette-carte')).toHaveCount(5);
    await page.goto('/collection');
    await expect(page.getByRole('heading', { name: /Set 1 : / })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations).toEqual([]);
  });
}
