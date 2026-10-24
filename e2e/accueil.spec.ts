import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

test('l’accueil montre un jeu de cartes : trois cartes en éventail, la promesse et l’appel à jouer', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'HIPMaster' })).toBeVisible();
  const eventail = page.getByRole('list', { name: 'Quelques cartes du jeu' });
  await expect(eventail.getByRole('listitem')).toHaveCount(3);
  await expect(eventail).toContainText('Solace Agent Mesh');
  // Le pied de page signe aussi « le jeu de cartes de l’intégration » (US-068) : la promesse est dans la page.
  await expect(page.getByRole('main').getByText('Le jeu de cartes de l’intégration')).toBeVisible();
  // Sur téléphone, l'appel à jouer tient dans le premier écran, au-dessus de la barre d'onglets.
  const jouer = page.getByRole('main').getByRole('link', { name: 'Jouer contre le bot' });
  await expect(jouer).toBeInViewport();
  await jouer.click();
  await expect(page).toHaveURL(/\/jouer$/);
});

test('un lien d’invitation vers l’accueil fait de « Créer mon compte » l’action principale', async ({
  page,
}) => {
  await page.goto('/?invitation=ABCD-EFGH-JKLM-NPQR');
  await page.getByRole('link', { name: 'Créer mon compte' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Bienvenue dans HIPMaster !' }),
  ).toBeVisible();
  await expect(page.getByLabel('Code d’invitation')).toHaveValue('ABCD-EFGH-JKLM-NPQR');
});

for (const theme of ['light', 'dark'] as const) {
  test(`la page d’accueil ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await expect(
      page.getByRole('list', { name: 'Quelques cartes du jeu' }).getByRole('listitem'),
    ).toHaveCount(3);
    const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(violations).toEqual([]);
  });
}
