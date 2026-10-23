import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { duelParApi } from './duel-api';
import { REGLES_WCAG } from './axe';

// Le duel est préparé par l'API (US-042) : ces parcours vérifient « Mes duels » et le bandeau, rien d'autre.

const lienDuels = (page: Page) =>
  page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: /^Duels/ });

test('le joueur dont c’est le tour le voit dans le bandeau, le titre de l’onglet et « Mes duels »', async ({
  page,
  browser,
}) => {
  const { ada, bob, contexte } = await duelParApi(page, browser, 'liste');
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
    const { ada, contexte } = await duelParApi(page, browser, `axe ${theme}`);
    await ada.goto('/duels');
    await expect(ada.getByRole('heading', { name: /^Au tour|^À vous/ }).first()).toBeVisible();
    const { violations } = await new AxeBuilder({ page: ada }).withTags(REGLES_WCAG).analyze();
    expect(violations).toEqual([]);
    await contexte.close();
  });
}
