import AxeBuilder from '@axe-core/playwright';
import { type Browser, expect, type Page, test } from '@playwright/test';

async function creerCompte(page: Page, pseudo: string) {
  await page.goto('/compte');
  await page.getByLabel('Pseudo').fill(pseudo);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: `Connecté en tant que ${pseudo}` })).toBeVisible();
}

async function duelEntre(page: Page, browser: Browser, suffixe: string) {
  await creerCompte(page, `Ada ${suffixe}`);
  await page.goto('/duels/nouveau');
  await page.getByRole('button', { name: 'Défier avec Moderne' }).click();
  const lien = await page.getByLabel('Lien du défi').inputValue();
  const contexte = await browser.newContext();
  const bob = await contexte.newPage();
  await creerCompte(bob, `Bob ${suffixe}`);
  await bob.goto(new URL(lien).pathname);
  await bob.getByRole('button', { name: 'Relever le défi avec Héritage' }).click();
  await expect(
    bob.getByRole('heading', { level: 1, name: `Duel contre Ada ${suffixe}` }),
  ).toBeVisible();
  return { ada: page, bob, contexte };
}

const lienDuels = (page: Page) =>
  page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: /^Duels/ });

test('le joueur dont c’est le tour le voit dans le bandeau, le titre de l’onglet et « Mes duels »', async ({
  page,
  browser,
}) => {
  const { ada, bob, contexte } = await duelEntre(page, browser, 'liste');
  await ada.goto('/');
  await bob.goto('/');
  // On attend que l'un des deux bandeaux affiche son compteur avant de savoir qui commence.
  const textes = async () =>
    `${await lienDuels(ada).textContent()}|${await lienDuels(bob).textContent()}`;
  await expect.poll(textes).toContain('à vous de jouer');
  const adaCommence = (await textes()).split('|')[0]?.includes('à vous de jouer');
  const [actif, passif] = adaCommence ? [ada, bob] : [bob, ada];

  await expect(lienDuels(actif)).toHaveAccessibleName('Duels 1 à vous de jouer');
  await expect(actif).toHaveTitle(/^\(1\) /);
  await expect(lienDuels(passif)).toHaveAccessibleName('Duels');

  await lienDuels(passif).click();
  await expect(passif.getByRole('heading', { name: 'Au tour de l’adversaire (1)' })).toBeVisible();
  await lienDuels(actif).click();
  await expect(actif.getByRole('heading', { name: 'À vous de jouer (1)' })).toBeVisible();
  await actif.getByRole('link', { name: /^Contre / }).click();
  await expect(actif.getByRole('button', { name: 'Finir mon tour' })).toBeEnabled();
  await contexte.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`« Mes duels » ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
    browser,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    const { ada, contexte } = await duelEntre(page, browser, `axe ${theme}`);
    await ada.goto('/duels');
    await expect(ada.getByRole('heading', { name: /^Au tour|^À vous/ }).first()).toBeVisible();
    const { violations } = await new AxeBuilder({ page: ada })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(violations).toEqual([]);
    await contexte.close();
  });
}
