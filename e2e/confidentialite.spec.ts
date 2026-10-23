import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { creerCompteParApi, duelParApi } from './duel-api';

// Page « À propos et confidentialité » et suppression de son compte (US-053).

test('le pied de page mène à « À propos et confidentialité », qui dit ce que le jeu garde', async ({
  page,
}) => {
  await page.goto('/cartes');
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'À propos et confidentialité' })
    .click();
  await expect(page).toHaveURL(/\/confidentialite$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'À propos et confidentialité' }),
  ).toBeVisible();
  await expect(page.getByText('aucun bandeau de consentement')).toBeVisible();
  await expect(page.getByText('90 jours sans utilisation')).toBeVisible();
});

test('supprimer son compte, après confirmation : le joueur est déconnecté, le jeton ne vaut plus rien', async ({
  page,
}) => {
  const jeton = await creerCompteParApi(page, 'Partant e2e');
  await page.goto('/compte');
  await expect(
    page.getByRole('heading', { name: 'Connecté en tant que Partant e2e' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Supprimer mon compte…' }).click();
  await page.getByRole('button', { name: 'Non, le garder' }).click();
  await page.getByRole('button', { name: 'Supprimer mon compte…' }).click();
  await page.getByRole('button', { name: 'Oui, supprimer mon compte' }).click();

  await expect(page.getByText('Votre compte a été supprimé')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Créer mon compte' })).toBeVisible();
  const moi = await page.request.get('/api/v1/moi', {
    headers: { authorization: `Bearer ${jeton}` },
  });
  expect(moi.status()).toBe(401);
});

test('un adversaire qui supprime son compte perd le duel par forfait, sans erreur chez l’autre', async ({
  page,
  browser,
}) => {
  const { ada, bob, contexte } = await duelParApi(page, browser, 'suppression');
  await bob.goto('/compte');
  await bob.getByRole('button', { name: 'Supprimer mon compte…' }).click();
  await bob.getByRole('button', { name: 'Oui, supprimer mon compte' }).click();
  await expect(bob.getByText('Votre compte a été supprimé')).toBeVisible();

  // Ada, restée sur le duel, voit sa victoire sans recharger.
  await expect(ada.getByRole('heading', { name: 'Victoire !' })).toBeVisible({ timeout: 10_000 });
  await ada.goto('/duels');
  await expect(ada.getByText('Compte supprimé')).toBeVisible();
  await contexte.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`la page de confidentialité et la suppression du compte ne présentent aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/confidentialite');
    await expect(
      page.getByRole('heading', { level: 1, name: 'À propos et confidentialité' }),
    ).toBeVisible();
    const page1 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(page1.violations).toEqual([]);

    await creerCompteParApi(page, `Axe ${theme} e2e`);
    await page.goto('/compte');
    await page.getByRole('button', { name: 'Supprimer mon compte…' }).click();
    await expect(page.getByRole('button', { name: 'Oui, supprimer mon compte' })).toBeVisible();
    const compte = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(compte.violations).toEqual([]);
  });
}
