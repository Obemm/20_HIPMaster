import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

test('la page d’accueil présente le jeu et les chances calculées par l’API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'HIPMaster' })).toBeVisible();
  const raretes = page.getByRole('region', { name: 'Chances par booster' });
  await expect(raretes.getByRole('listitem')).toHaveCount(4);
  await expect(raretes).toContainText('Légendaire');
  await expect(raretes).toContainText('1 %');
});

for (const theme of ['light', 'dark'] as const) {
  test(`la page d’accueil ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await expect(page.getByRole('listitem').first()).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(violations).toEqual([]);
  });
}
