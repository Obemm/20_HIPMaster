import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

// Page « Inviter » (US-072, ADR 0029). Les parcours e2e lancent l'API avec ADMINISTRATEURS=tous : chaque compte créé
// y est administrateur. Le 404 des routes d'administration pour un joueur ordinaire est vérifié par les tests de l'API.

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/** Un libellé propre à ce parcours et à ce profil : tous les comptes voient les mêmes invitations. */
const unique = (libelle: string) => `${libelle} ${test.info().project.name}`;

async function creerCompte(page: Page, pseudo: string): Promise<void> {
  await page.goto('/compte');
  await page.getByLabel('Pseudo').fill(pseudo);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await page.getByRole('button', { name: 'C’est noté' }).click();
}

test('inviter un collègue : créer l’invitation, copier son lien, suivre son usage, la révoquer', async ({
  page,
  browser,
}) => {
  const libelle = unique('Équipe e2e');
  await creerCompte(page, 'Porteur e2e');
  await page.getByRole('link', { name: 'Inviter des collègues' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Inviter' })).toBeVisible();

  await page.getByLabel('Pour qui').fill(libelle);
  await page.getByLabel('Nombre de comptes').fill('2');
  await page.getByRole('button', { name: 'Créer l’invitation' }).click();
  await expect(
    page.getByRole('heading', { name: `Invitation « ${libelle} » créée` }),
  ).toBeFocused();
  const lien = await page.getByLabel('Lien d’invitation').inputValue();
  expect(lien).toMatch(/\/compte\?invitation=[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);

  await page.getByRole('button', { name: 'Copier le lien' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Lien copié.' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(lien);

  // Un collègue ouvre le lien sur son appareil : le code est rempli, son compte se crée.
  const collegue = await browser.newContext();
  const autrePage = await collegue.newPage();
  const { pathname, search } = new URL(lien);
  await autrePage.goto(pathname + search);
  await expect(autrePage.getByLabel('Code d’invitation')).toHaveValue(
    new URL(lien).searchParams.get('invitation') ?? '',
  );
  await autrePage.getByLabel('Pseudo').fill('Collègue e2e');
  await autrePage.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(
    autrePage.getByRole('heading', { name: 'Votre code de récupération' }),
  ).toBeVisible();
  await collegue.close();

  // Le lien ne s'affiche qu'une fois ; la liste dit l'usage de l'invitation.
  await page.getByRole('button', { name: 'C’est envoyé' }).click();
  await expect(page.getByLabel('Lien d’invitation')).toHaveCount(0);
  await page.reload();
  const invitation = page.getByRole('listitem').filter({ hasText: libelle });
  await expect(invitation).toContainText('1 compte créé sur 2');
  await expect(invitation).toContainText('Active');
  expect(await page.content()).not.toContain(new URL(lien).searchParams.get('invitation'));

  // Révoquer demande confirmation ; « Non » garde l'invitation.
  await invitation.getByRole('button', { name: `Révoquer « ${libelle} »` }).click();
  await expect(invitation.getByRole('button', { name: 'Non, la garder' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(invitation.getByRole('button', { name: `Révoquer « ${libelle} »` })).toBeFocused();
  await invitation.getByRole('button', { name: `Révoquer « ${libelle} »` }).click();
  await invitation.getByRole('button', { name: 'Oui, révoquer' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'révoquée' })).toContainText(
    `Invitation « ${libelle} » révoquée`,
  );
  await expect(invitation).toContainText('Révoquée');
  await expect(invitation.getByRole('button', { name: /Révoquer/ })).toHaveCount(0);

  // Le lien révoqué ne crée plus de compte.
  const retardataire = await browser.newContext();
  const page3 = await retardataire.newPage();
  await page3.goto(pathname + search);
  await page3.getByLabel('Pseudo').fill('Retardataire');
  await page3.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page3.getByRole('alert')).toContainText('Ce code d’invitation n’est pas accepté');
  await retardataire.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`la page « Inviter » tient en 375 px et ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: theme });
    const libelle = unique(`Démo a11y ${theme}`);
    await creerCompte(page, `Thème ${theme}`);
    await page.goto('/inviter');
    await page.getByLabel('Pour qui').fill(libelle);
    await page.getByRole('button', { name: 'Créer l’invitation' }).click();
    await expect(
      page.getByRole('heading', { name: `Invitation « ${libelle} » créée` }),
    ).toBeVisible();
    await page.getByRole('button', { name: `Révoquer « ${libelle} »` }).click();
    await expect(page.getByRole('button', { name: 'Oui, révoquer' })).toBeVisible();

    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(debordement).toBeLessThanOrEqual(0);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations).toEqual([]);
  });
}
