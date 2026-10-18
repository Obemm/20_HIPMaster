import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const FIN = /Victoire !|Défaite|Partie nulle/;

async function commencer(page: Page, deck = 'Hybride') {
  await page.goto('/');
  await page.getByRole('link', { name: 'Jouer contre le bot' }).click();
  await expect(page).toHaveURL(/\/jouer$/);
  await page.getByRole('button', { name: `Jouer avec ${deck}` }).click();
  await expect(page).toHaveURL(/\/jouer\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Partie contre le bot' })).toBeVisible();
}

/** Joue un tour simple : pose la première carte posable de la main, attaque si possible, puis finit le tour. */
async function jouerUnTour(page: Page) {
  const main = page
    .getByRole('region', { name: /Votre main/ })
    .getByRole('listitem')
    .getByRole('button');
  for (const carte of await main.all()) {
    if (!(await carte.isEnabled())) continue;
    await carte.click();
    const poser = page.getByRole('button', { name: /^Poser/ });
    if (await poser.isVisible()) {
      await poser.click();
      break;
    }
    await carte.click();
  }
  const attaquant = page.getByRole('button', { name: /peut attaquer$/ }).first();
  if (await attaquant.isVisible()) {
    await attaquant.click();
    const cible = page.getByRole('button', { name: /: attaquer$/ }).first();
    if (await cible.isEnabled()) await cible.click();
  }
  const finir = page.getByRole('button', { name: 'Finir mon tour' });
  if (await finir.isVisible()) await finir.click();
}

test('une partie complète contre le bot, jusqu’au résultat', async ({ page }) => {
  test.setTimeout(120_000);
  await commencer(page);
  const resultat = page.getByRole('heading', { level: 2, name: FIN });
  for (let tour = 0; tour < 12 && !(await resultat.isVisible()); tour++) {
    await expect(page.getByRole('button', { name: 'Finir mon tour' }).or(resultat)).toBeEnabled();
    await jouerUnTour(page);
    await expect(page.getByRole('log')).toContainText('Tour');
  }
  await expect(resultat).toBeVisible();
  await expect(resultat).toBeFocused();
  // Le journal affiche les événements un par un : la fin arrive après le dernier tour du bot.
  await expect(page.getByRole('log')).toContainText('Fin de la partie', { timeout: 15_000 });
  // Le journal reste dans l'ordre chronologique, même quand le bot joue pendant l'affichage.
  const tours = [
    ...((await page.getByRole('log').textContent()) ?? '').matchAll(/Tour (\d+)/g),
  ].map((m) => Number(m[1]));
  expect(tours).toEqual([...tours].sort((a, b) => a - b));
  await page.getByRole('link', { name: 'Rejouer' }).click();
  await expect(page).toHaveURL(/\/jouer$/);
});

test('le bot joue son tour, annoncé dans le journal', async ({ page }) => {
  await commencer(page, 'Moderne');
  await page.getByRole('button', { name: 'Finir mon tour' }).click();
  await expect(page.getByRole('log')).toContainText('le bot joue');
  await expect(page.getByRole('button', { name: 'Finir mon tour' })).toBeEnabled();
  const debord = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debord).toBeLessThanOrEqual(0);
});

test('une partie inconnue est annoncée comme introuvable', async ({ page }) => {
  await page.goto('/jouer/00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('heading', { name: 'Partie introuvable' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`le choix du deck et la partie ne présentent aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/jouer');
    await expect(page.getByRole('button', { name: 'Jouer avec Héritage' })).toBeVisible();
    const choix = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(choix.violations).toEqual([]);

    await page.getByRole('button', { name: 'Jouer avec Héritage' }).click();
    await expect(page.getByRole('button', { name: 'Finir mon tour' })).toBeVisible();
    const partie = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(partie.violations).toEqual([]);
  });
}
