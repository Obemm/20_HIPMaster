import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const auditer = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations).toEqual([]);
};

const sansDefilementHorizontal = async (page: Page) => {
  const debord = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debord).toBeLessThanOrEqual(0);
};

test('depuis l’accueil, le catalogue liste les 71 cartes et se filtre', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Voir le catalogue des cartes' }).click();
  await expect(page).toHaveURL(/\/cartes$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Catalogue du set 1' })).toBeVisible();

  const compteur = page.getByRole('status');
  await expect(compteur).toHaveText('71 cartes affichées');
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(71);

  await page.getByLabel('Famille').selectOption({ label: 'API' });
  await expect(compteur).toHaveText('8 cartes affichées');

  await page.getByLabel('Famille').selectOption({ label: 'Toutes les familles' });
  await page.getByLabel('Rareté').selectOption('legendaire');
  await expect(compteur).toHaveText('4 cartes affichées');
  await expect(page.getByRole('link', { name: 'FTP', exact: true })).toBeVisible();

  await sansDefilementHorizontal(page);
});

test('le détail s’ouvre en fenêtre modale et se referme sur le catalogue filtré', async ({
  page,
}) => {
  await page.goto('/cartes');
  await page.getByLabel('Famille').selectOption({ label: 'iPaaS' });
  const lien = page.getByRole('link', { name: 'webMethods.io', exact: true });
  await lien.click();

  const fenetre = page.getByRole('dialog', { name: 'webMethods.io' });
  await expect(fenetre).toBeVisible();
  await expect(page).toHaveURL(/\/cartes\/26$/);
  await expect(fenetre.getByText('Connecteur (2)', { exact: true })).toBeVisible();
  await expect(fenetre.getByRole('heading', { name: 'En vrai' })).toBeVisible();
  await sansDefilementHorizontal(page);

  await page.keyboard.press('Escape');
  await expect(fenetre).toBeHidden();
  await expect(page).toHaveURL(/\/cartes$/);
  await expect(page.getByRole('status')).toHaveText('5 cartes affichées');
  await expect(lien).toBeFocused();
});

test('une évolution mène à sa carte d’origine, et le bouton Fermer referme la fenêtre', async ({
  page,
}) => {
  await page.goto('/cartes/26');
  const fenetre = page.getByRole('dialog');
  await fenetre.getByRole('link', { name: 'webMethods Integration Server 10.15' }).click();
  await expect(page).toHaveURL(/\/cartes\/9$/);
  await expect(
    page.getByRole('dialog', { name: 'webMethods Integration Server 10.15' }),
  ).toBeVisible();

  await fenetre.getByRole('button', { name: 'Fermer' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL(/\/cartes$/);
});

test('une carte inconnue est annoncée comme introuvable', async ({ page }) => {
  await page.goto('/cartes/999');
  await expect(page.getByRole('dialog', { name: 'Carte introuvable' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`le catalogue et le détail ne présentent aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/cartes');
    await expect(page.getByRole('status')).toHaveText('71 cartes affichées');
    await auditer(page);

    await page.goto('/cartes/40');
    await expect(page.getByRole('dialog', { name: 'Apigee AI Gateway' })).toBeVisible();
    await auditer(page);
  });
}
