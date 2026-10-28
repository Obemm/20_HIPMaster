import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

// Crediting contributors (US-031). The journeys set the author of every card in the API responses, so that they do not
// depend on the community cards of the real catalogue (US-093).

const AUTEURS: Record<number, string> = { 1: 'Camille D.', 26: 'Camille D.', 40: 'Alex P.' };

/** Gives each card its author in `auteurs`, or none: `undefined` is dropped when the response is serialised. */
const avecAuteur = (auteurs: Record<number, string>) => (carte: { numero: number }) => ({
  ...carte,
  auteur: auteurs[carte.numero],
});

/** Sets the authors of the cards (by default 1, 26 and 40, the others having none), in the list and in the detail. */
async function cartesDeLaCommunaute(page: Page, auteurs: Record<number, string> = AUTEURS) {
  await page.route('**/api/v1/cartes', async (route) => {
    const reponse = await route.fetch();
    const cartes = (await reponse.json()) as { numero: number }[];
    await route.fulfill({ response: reponse, json: cartes.map(avecAuteur(auteurs)) });
  });
  await page.route('**/api/v1/cartes/*', async (route) => {
    const reponse = await route.fetch();
    if (!reponse.ok()) return route.fulfill({ response: reponse });
    return route.fulfill({
      response: reponse,
      json: avecAuteur(auteurs)((await reponse.json()) as { numero: number }),
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
  await cartesDeLaCommunaute(page, {});
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

  // With the keyboard: the card opens over the page, Escape closes it and gives the focus back to the card.
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
    await cartesDeLaCommunaute(page, {});
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
