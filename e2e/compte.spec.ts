import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('créer un compte invité, le retrouver avec son code sur un autre appareil', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Créer un compte' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mon compte' })).toBeVisible();
  await page.getByLabel('Pseudo').fill('Joueuse e2e');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  const code = page
    .getByRole('heading', { name: 'Votre code de récupération' })
    .locator('xpath=..');
  await expect(code).toContainText(/[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}/);
  const codeRecuperation = (await code.locator('p').first().textContent())?.trim() ?? '';
  await expect(page.getByRole('link', { name: 'Mon compte : Joueuse e2e' })).toBeVisible();

  // Le compte survit au rechargement de la page.
  await page.reload();
  await expect(page.getByRole('link', { name: 'Mon compte : Joueuse e2e' })).toBeVisible();

  // Un « autre appareil » : un contexte de navigateur vierge.
  const autre = await browser.newContext();
  const autrePage = await autre.newPage();
  await autrePage.goto('/compte');
  await autrePage.getByLabel('Code de récupération').fill(codeRecuperation.toLowerCase());
  await autrePage.getByRole('button', { name: 'Retrouver mon compte' }).click();
  await expect(
    autrePage.getByRole('heading', { name: 'Connecté en tant que Joueuse e2e' }),
  ).toBeVisible();
  await autre.close();

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('link', { name: 'Créer un compte' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`la page du compte ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/compte');
    await expect(page.getByRole('heading', { name: 'Créer mon compte' })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations).toEqual([]);
  });
}
