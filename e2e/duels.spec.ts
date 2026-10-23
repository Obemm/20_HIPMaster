import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { creerCompteParApi } from './duel-api';
import { REGLES_WCAG } from './axe';

// Seul Bob crée son compte par l'interface : c'est le parcours testé. Les autres comptes viennent de l'API (US-042).

/** Ada lance un défi et renvoie son lien. */
async function lancerDefi(page: Page): Promise<string> {
  await creerCompteParApi(page, 'Ada e2e');
  await page.goto('/jouer');
  await page.getByRole('link', { name: 'Défier un collègue' }).click();
  await page.getByRole('button', { name: 'Défier avec Moderne' }).click();
  await expect(page.getByRole('heading', { name: 'Votre défi est lancé' })).toBeVisible();
  return page.getByLabel('Lien du défi').inputValue();
}

test('défier un collègue par lien : il crée son compte, revient au défi et le relève', async ({
  page,
  browser,
}) => {
  const lien = await lancerDefi(page);

  // Le collègue, sur un autre navigateur, sans compte.
  const autre = await browser.newContext();
  const collegue = await autre.newPage();
  await collegue.goto(new URL(lien).pathname);
  await expect(
    collegue.getByRole('heading', { name: 'Un collègue vous défie en duel' }),
  ).toBeVisible();
  await collegue.getByRole('main').getByRole('link', { name: 'créer un compte' }).click();
  await collegue.getByLabel('Pseudo').fill('Bob e2e');
  await collegue.getByRole('button', { name: 'Créer mon compte' }).click();
  await collegue.getByRole('link', { name: 'Code noté : revenir au défi' }).click();

  await expect(
    collegue.getByRole('heading', { name: 'Ada e2e vous défie en duel !' }),
  ).toBeVisible();
  await collegue.getByRole('button', { name: 'Relever le défi avec Héritage' }).click();
  await expect(collegue.getByRole('heading', { name: 'Duel contre Ada e2e' })).toBeVisible();

  // Le créateur voit le défi relevé sans recharger la page.
  await expect(page.getByRole('heading', { name: 'Duel contre Bob e2e' })).toBeVisible({
    timeout: 10_000,
  });

  // Le lien ne sert qu'une fois.
  const troisieme = await browser.newContext();
  const intrus = await troisieme.newPage();
  await creerCompteParApi(intrus, 'Eve e2e');
  await intrus.goto(new URL(lien).pathname);
  await expect(intrus.getByRole('heading', { name: 'Défi introuvable' })).toBeVisible();
  await autre.close();
  await troisieme.close();
});

test('le créateur peut annuler son défi', async ({ page }) => {
  await lancerDefi(page);
  await page.getByRole('button', { name: 'Annuler le défi' }).click();
  await expect(page).toHaveURL(/\/duels\/nouveau$/);
});

for (const theme of ['light', 'dark'] as const) {
  test(`le défi et l’invitation ne présentent aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
    browser,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    const lien = await lancerDefi(page);
    const createur = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(createur.violations).toEqual([]);

    const autre = await browser.newContext({ colorScheme: theme });
    const collegue = await autre.newPage();
    await creerCompteParApi(collegue, `Invité ${theme}`);
    await collegue.goto(new URL(lien).pathname);
    await expect(collegue.getByRole('heading', { name: /vous défie en duel/ })).toBeVisible();
    const invitation = await new AxeBuilder({ page: collegue }).withTags(REGLES_WCAG).analyze();
    expect(invitation.violations).toEqual([]);
    await autre.close();
  });
}
