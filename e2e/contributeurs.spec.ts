import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

// Créditer les contributeurs (US-031). Aucune carte du catalogue n'a encore d'auteur : les parcours qui en ont besoin
// en ajoutent dans les réponses de l'API, sans toucher au vrai catalogue.

const AUTEURS: Record<number, string> = { 1: 'Camille D.', 26: 'Camille D.', 40: 'Alex P.' };

const avecAuteur = (carte: { numero: number }) =>
  AUTEURS[carte.numero] === undefined ? carte : { ...carte, auteur: AUTEURS[carte.numero] };

/** Ajoute des auteurs aux cartes 1, 26 et 40, dans la liste comme dans le détail. */
async function cartesDeLaCommunaute(page: Page) {
  await page.route('**/api/v1/cartes', async (route) => {
    const reponse = await route.fetch();
    const cartes = (await reponse.json()) as { numero: number }[];
    await route.fulfill({ response: reponse, json: cartes.map(avecAuteur) });
  });
  await page.route('**/api/v1/cartes/*', async (route) => {
    const reponse = await route.fetch();
    if (!reponse.ok()) return route.fulfill({ response: reponse });
    return route.fulfill({
      response: reponse,
      json: avecAuteur((await reponse.json()) as { numero: number }),
    });
  });
}

const auditer = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
  expect(violations).toEqual([]);
};

test('le pied de page mène aux contributeurs, qui, faute de carte de la communauté, renvoient au guide', async ({
  page,
}) => {
  await page.goto('/cartes');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Contributeurs' }).click();
  await expect(page).toHaveURL(/\/contributeurs$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Contributeurs' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Aucune carte de la communauté pour l’instant' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'guide du contributeur' })).toHaveAttribute(
    'href',
    'https://github.com/Obemm/20_HIPMaster/blob/main/CONTRIBUTING.md',
  );
});

test('le catalogue filtre les cartes de la communauté, qui mènent aux contributeurs et à leurs cartes', async ({
  page,
}) => {
  await cartesDeLaCommunaute(page);
  await page.goto('/cartes');
  await expect(page.getByRole('status')).toHaveText('74 cartes affichées');
  await page.getByLabel('Origine').selectOption({ label: 'Cartes de la communauté' });
  await expect(page.getByRole('status')).toHaveText('3 cartes affichées');
  await page.getByRole('link', { name: 'découvrez les contributeurs' }).click();

  await expect(page).toHaveURL(/\/contributeurs$/);
  const auteurs = page.getByRole('heading', { level: 2 });
  await expect(auteurs).toHaveText(['Alex P.', 'Camille D.']);
  const camille = page.getByRole('region', { name: 'Camille D.' });
  await expect(camille.getByText('2 cartes publiées')).toBeVisible();
  await expect(camille.getByRole('heading', { level: 3 })).toHaveText(['FTP', 'webMethods.io']);

  // Au clavier : la carte s'ouvre par-dessus la page, Échap la referme et rend le focus à la carte.
  const lien = camille.getByRole('link', { name: 'webMethods.io', exact: true });
  await lien.focus();
  await page.keyboard.press('Enter');
  const fenetre = page.getByRole('dialog', { name: 'webMethods.io' });
  await expect(fenetre).toBeVisible();
  await expect(page).toHaveURL(/\/contributeurs\/26$/);
  await expect(fenetre.getByText('Proposée par Camille D.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/contributeurs$/);
  await expect(lien).toBeFocused();
});

test('le détail d’une carte de la communauté nomme son auteur et mène aux contributeurs', async ({
  page,
}) => {
  await cartesDeLaCommunaute(page);
  await page.goto('/cartes/40');
  const fenetre = page.getByRole('dialog', { name: 'Apigee AI Gateway' });
  await expect(fenetre.getByText('Proposée par Alex P.')).toBeVisible();
  await fenetre.getByRole('link', { name: 'Alex P.' }).click();
  await expect(page).toHaveURL(/\/contributeurs$/);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { level: 2, name: 'Alex P.' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`les contributeurs et le crédit d’une carte ne présentent aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/contributeurs');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(
      'Aucune carte de la communauté pour l’instant',
    );
    await auditer(page);

    await cartesDeLaCommunaute(page);
    await page.reload();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Alex P.', 'Camille D.']);
    await auditer(page);

    await page.goto('/contributeurs/1');
    await expect(
      page.getByRole('dialog', { name: 'FTP' }).getByText('Proposée par Camille D.'),
    ).toBeVisible();
    await auditer(page);

    await page.goto('/cartes');
    await page.getByLabel('Origine').selectOption('communaute');
    await expect(page.getByRole('status')).toHaveText('3 cartes affichées');
    await auditer(page);
  });
}
