import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('la page d’accueil présente le jeu', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'HIPMaster' })).toBeVisible();
});

test('la page d’accueil ne présente aucune violation d’accessibilité', async ({ page }) => {
  await page.goto('/');
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations).toEqual([]);
});
