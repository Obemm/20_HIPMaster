import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

test('créer un compte invité, le retrouver avec son code sur un autre appareil', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Créer un compte' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mon compte' })).toBeVisible();
  await page.getByLabel('Pseudo').fill('Joueuse e2e');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  const code = page
    .getByRole('heading', { name: 'Votre code de récupération' })
    .locator('xpath=..');
  await expect(code).toContainText(/[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}/);
  const codeRecuperation = (await code.locator('p').first().textContent())?.trim() ?? '';
  await expect(page.getByRole('link', { name: 'Mon compte : Joueuse e2e' })).toBeVisible();

  // Le compte survit au rechargement de la page.
  await page.reload();
  await expect(page.getByRole('link', { name: 'Mon compte : Joueuse e2e' })).toBeVisible();

  // Un « autre appareil » : un contexte de navigateur vierge.
  const autre = await browser.newContext();
  const autrePage = await autre.newPage();
  await autrePage.goto('/compte');
  await autrePage.getByLabel('Code de récupération').fill(codeRecuperation.toLowerCase());
  await autrePage.getByRole('button', { name: 'Retrouver mon compte' }).click();
  await expect(
    autrePage.getByRole('heading', { name: 'Connecté en tant que Joueuse e2e' }),
  ).toBeVisible();

  // Depuis le premier appareil, on déconnecte l'autre (US-047) : celui-ci reste connecté.
  await page.getByRole('button', { name: 'Déconnecter mes autres appareils' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Votre autre appareil' })).toHaveText(
    'Votre autre appareil a été déconnecté.',
  );
  await expect(
    page.getByRole('heading', { name: 'Connecté en tant que Joueuse e2e' }),
  ).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
  expect(violations).toEqual([]);
  await autrePage.reload();
  await expect(autrePage.getByRole('alert').filter({ hasText: 'Session expirée' })).toBeVisible();
  await autre.close();

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('link', { name: 'Créer un compte' })).toBeVisible();
});

test('un lien d’invitation remplit le code ; un code inconnu est refusé, sans dire pourquoi', async ({
  page,
}) => {
  await page.goto('/compte?invitation=ABCD-EFGH-JKLM-NPQR');
  const invitation = page.getByLabel('Code d’invitation');
  await expect(invitation).toHaveValue('ABCD-EFGH-JKLM-NPQR');
  await page.getByLabel('Pseudo').fill('Invitée e2e');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('alert')).toContainText('Ce code d’invitation n’est pas accepté');

  // Sans code, l'inscription reste libre en développement et dans les e2e (ADR 0027).
  await invitation.fill('');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: 'Votre code de récupération' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`la page du compte ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/compte');
    await expect(page.getByRole('heading', { name: 'Créer mon compte' })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(violations).toEqual([]);
  });
}
