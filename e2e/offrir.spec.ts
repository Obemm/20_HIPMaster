import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

// Boosters offerts par code (US-070, ADR 0045). Les parcours e2e lancent l'API avec ADMINISTRATEURS=tous : chaque
// compte créé y est administrateur. Le 404 des routes d'administration pour un joueur ordinaire, le refus neutre et la
// limite de débit sont vérifiés par les tests de l'API.

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/** Un libellé propre à ce parcours et à ce profil : tous les comptes voient les mêmes codes. */
const unique = (libelle: string) => `${libelle} ${test.info().project.name}`;

async function creerCompte(page: Page, pseudo: string): Promise<void> {
  await page.goto('/compte');
  await page.getByLabel('Pseudo').fill(pseudo);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await page.getByRole('button', { name: 'C’est noté' }).click();
}

/** Crée un code depuis « Offrir des boosters » ; renvoie son lien. */
async function creerCode(page: Page, libelle: string, boosters: string): Promise<string> {
  await page.getByLabel('Réussite récompensée').fill(libelle);
  await page.getByLabel('Boosters par joueur').fill(boosters);
  await page.getByLabel('Nombre de joueurs').fill('2');
  await page.getByRole('button', { name: 'Créer le code' }).click();
  await expect(page.getByRole('heading', { name: `Code « ${libelle} » créé` })).toBeFocused();
  return page.getByLabel('Lien des boosters').inputValue();
}

test('offrir des boosters : créer le code, un collègue le reçoit par le lien, une seule fois, puis le révoquer', async ({
  page,
  browser,
}) => {
  const libelle = unique('1re API publiée');
  await creerCompte(page, 'Porteur e2e');
  await page.getByRole('link', { name: 'Offrir des boosters' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Offrir des boosters' })).toBeVisible();

  const lien = await creerCode(page, libelle, '7');
  expect(lien).toMatch(/\/boosters\?code=[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
  const code = new URL(lien).searchParams.get('code') ?? '';
  await page.getByRole('button', { name: 'Copier le lien' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(lien);

  // Un collègue, connecté, ouvre le lien : le code est rempli, puis quitte l'adresse.
  const collegue = await browser.newContext();
  const autrePage = await collegue.newPage();
  await creerCompte(autrePage, 'Collègue e2e');
  const { pathname, search } = new URL(lien);
  await autrePage.goto(pathname + search);
  await expect(autrePage.getByRole('textbox', { name: 'Code cadeau' })).toHaveValue(code);
  await expect(autrePage).toHaveURL(/\/boosters$/);
  await expect(autrePage.getByText('5 boosters en stock')).toBeVisible();
  await autrePage.getByRole('button', { name: 'Recevoir les boosters' }).click();
  await expect(autrePage.getByRole('status').filter({ hasText: 'offerts' })).toHaveText(
    `« ${libelle} » : 7 boosters offerts ! Ils vous attendent dans votre stock.`,
  );
  // 5 de bienvenue + 7 : au-delà du plafond de 10.
  await expect(autrePage.getByText('12 boosters en stock')).toBeVisible();

  // Une seconde fois : refus neutre, rien de plus.
  await autrePage.getByRole('textbox', { name: 'Code cadeau' }).fill(code);
  await autrePage.getByRole('button', { name: 'Recevoir les boosters' }).click();
  await expect(autrePage.getByRole('alert')).toContainText('Ce code ne donne pas de booster');
  await expect(autrePage.getByText('12 boosters en stock')).toBeVisible();

  // Le lien ne s'affiche qu'une fois ; la liste dit qui a utilisé le code.
  await page.getByRole('button', { name: 'C’est envoyé' }).click();
  await page.reload();
  const element = page.getByRole('listitem').filter({ hasText: libelle }).first();
  await expect(element).toContainText('7 boosters par joueur · 1 joueur sur 2');
  await element.getByRole('button', { name: `Qui l’a utilisé ? « ${libelle} »` }).click();
  await expect(
    element.getByRole('list', { name: `Bénéficiaires de « ${libelle} »` }),
  ).toContainText('Collègue e2e');
  expect(await page.content()).not.toContain(code);

  // Révoqué, le code n'offre plus rien à personne.
  await element.getByRole('button', { name: `Révoquer « ${libelle} »` }).click();
  await element.getByRole('button', { name: 'Oui, révoquer' }).click();
  await expect(element).toContainText('Révoqué');
  const retardataire = await browser.newContext();
  const page3 = await retardataire.newPage();
  await creerCompte(page3, 'Retardataire');
  await page3.goto(pathname + search);
  await page3.getByRole('button', { name: 'Recevoir les boosters' }).click();
  await expect(page3.getByRole('alert')).toContainText('Ce code ne donne pas de booster');
  await collegue.close();
  await retardataire.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`« Offrir des boosters » et le code cadeau tiennent en 375 px, sans violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: theme });
    const libelle = unique(`Démo a11y ${theme}`);
    await creerCompte(page, `Thème ${theme}`);
    await page.goto('/offrir');
    const lien = await creerCode(page, libelle, '1');
    await page.getByRole('button', { name: `Révoquer « ${libelle} »` }).click();
    await expect(page.getByRole('button', { name: 'Oui, révoquer' })).toBeVisible();
    const verifier = async () => {
      const debordement = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debordement).toBeLessThanOrEqual(0);
      const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
      expect(violations).toEqual([]);
    };
    await verifier();

    const { pathname, search } = new URL(lien);
    await page.goto(pathname + search);
    await page.getByRole('button', { name: 'Recevoir les boosters' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'offert' })).toBeVisible();
    await verifier();
  });
}
