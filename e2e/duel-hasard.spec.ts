import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

// La file d'appariement est commune à tous : ces tests passent l'un après l'autre, et sur le seul profil bureau
// (voir playwright.config.ts), pour ne pas s'apparier entre eux. Les règles d'appariement sont couvertes par les
// tests de l'API.
test.describe.configure({ mode: 'serial' });

async function creerCompte(page: Page, pseudo: string) {
  await page.goto('/compte');
  await page.getByLabel('Pseudo').fill(pseudo);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: `Connecté en tant que ${pseudo}` })).toBeVisible();
}

/** Cherche un adversaire ; renvoie le titre de la page obtenue (file d'attente ou duel). */
async function chercher(page: Page): Promise<string> {
  await page.goto('/jouer');
  await page.getByRole('link', { name: 'un adversaire au hasard' }).click();
  await page.getByRole('button', { name: 'Jouer avec Hybride' }).click();
  await page.waitForURL(/\/duels\/[0-9a-f-]{36}$/);
  const titre = page.getByRole('heading', { level: 1 });
  // « Duel contre … » le temps du chargement : on attend le nom de l'adversaire (US-042).
  await expect(titre).toHaveText(/Recherche d’un adversaire|Duel contre [^…]/);
  return (await titre.textContent()) ?? '';
}

/** Entre dans la file ; un duel laissé ouvert par un essai précédent est rejoint au passage, puis on recommence. */
async function entrerDansLaFile(page: Page) {
  for (let essai = 0; essai < 5; essai++) {
    if ((await chercher(page)).includes('Recherche')) return;
  }
  throw new Error('Impossible d’entrer dans la file.');
}

test('deux joueurs qui cherchent un adversaire au hasard se retrouvent en duel', async ({
  page,
  browser,
}) => {
  await creerCompte(page, 'Ada hasard');
  await entrerDansLaFile(page);

  const contexte = await browser.newContext();
  const bob = await contexte.newPage();
  await creerCompte(bob, 'Bob hasard');
  expect(await chercher(bob)).toContain('Duel contre Ada hasard');
  await expect(page.getByRole('heading', { level: 1, name: 'Duel contre Bob hasard' })).toBeVisible(
    {
      timeout: 10_000,
    },
  );
  await contexte.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`la file d’attente ne présente aucune violation d’accessibilité, et se quitte (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await creerCompte(page, `File ${theme}`);
    await entrerDansLaFile(page);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations).toEqual([]);
    await page.getByRole('button', { name: 'Quitter la file' }).click();
    await expect(page).toHaveURL(/\/jouer$/);
  });
}
