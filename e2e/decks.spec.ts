import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';
import { creerCompteParApi } from './duel-api';

// US-083 : construire, nommer et garder ses decks à partir de sa collection.

/** Un compte qui a ouvert ses 5 boosters de bienvenue : 25 cartes en collection. */
async function collectionneur(page: Page, pseudo: string): Promise<string> {
  const jeton = await creerCompteParApi(page, pseudo);
  for (let i = 0; i < 5; i++) {
    const ouverture = await page.request.post('/api/v1/moi/boosters/ouvertures', {
      headers: { authorization: `Bearer ${jeton}` },
    });
    expect(ouverture.status()).toBe(201);
  }
  return jeton;
}

/** Ajoute des cartes jusqu'à `nombre`, ou tant qu'un bouton « + » le permet. */
async function ajouterCartes(page: Page, nombre: number) {
  const ajouts = page.getByRole('button', { name: /^Ajouter un exemplaire de / });
  await expect(ajouts.first()).toBeVisible();
  for (let i = 0; i < nombre; i++) {
    const possible = ajouts.and(page.locator(':enabled')).first();
    if ((await possible.count()) === 0) return;
    await possible.click();
  }
}

test('construire un deck, le retrouver, le dupliquer puis le supprimer', async ({ page }) => {
  await collectionneur(page, 'Bâtisseuse e2e');
  await page.goto('/decks');
  await expect(page.getByRole('heading', { level: 1, name: 'Mes decks' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vos decks (0 / 5)' })).toBeVisible();

  await page.getByRole('link', { name: 'Nouveau deck' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Nouveau deck' })).toBeVisible();
  await expect(page.getByText('Il manque 20 cartes pour jouer.')).toBeVisible();
  await page.getByLabel('Nom du deck').fill('Mon premier deck');
  await ajouterCartes(page, 3);
  await expect(page.getByRole('progressbar', { name: 'Cartes du deck' })).toHaveAttribute(
    'aria-valuenow',
    '3',
  );
  await expect(page.getByText('Il manque 17 cartes pour jouer.')).toBeVisible();

  // Les filtres : chaque carte proposée a le coût choisi (le dernier regroupe les cartes plus chères).
  await page.getByLabel('Coût', { exact: true }).selectOption('1');
  const proposees = page.locator('#titre-mes-cartes ~ ul > li');
  for (const ligne of await proposees.all()) await expect(ligne.locator('.puce')).toHaveText('1');
  await page.getByLabel('Coût', { exact: true }).selectOption('0');

  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(
    page.getByText('Deck « Mon premier deck » enregistré, encore incomplet.'),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/decks\/[0-9a-f-]{36}$/);

  // Retrouvé après un rechargement : il est gardé par le serveur.
  await page.reload();
  await expect(page.getByLabel('Nom du deck')).toHaveValue('Mon premier deck');
  await expect(page.getByRole('progressbar', { name: 'Cartes du deck' })).toHaveAttribute(
    'aria-valuenow',
    '3',
  );

  await page.getByRole('link', { name: '← Mes decks' }).click();
  await expect(page.getByRole('heading', { name: 'Vos decks (1 / 5)' })).toBeVisible();
  await expect(page.getByText('3 / 20 cartes.')).toBeVisible();
  await page.getByRole('button', { name: 'Dupliquer Mon premier deck' }).click();
  await expect(page.getByRole('heading', { name: 'Mon premier deck (copie)' })).toBeVisible();

  await page.getByRole('button', { name: 'Supprimer Mon premier deck (copie)' }).click();
  await page
    .getByRole('button', { name: 'Confirmer la suppression de Mon premier deck (copie)' })
    .click();
  await expect(page.getByRole('heading', { name: 'Vos decks (1 / 5)' })).toBeVisible();
});

test('copier un deck prêté ne garde que les cartes possédées', async ({ page }) => {
  await collectionneur(page, 'Copiste e2e');
  await page.goto('/decks');
  const heritage = page.locator('hip-boite-deck').filter({ hasText: 'Héritage' });
  const possedees = Number(
    (await heritage.getByText(/Vous possédez \d+ de ses 20 cartes/).textContent())?.match(
      /\d+/,
    )?.[0],
  );
  await heritage.getByRole('button', { name: 'Copier Héritage' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Modifier le deck' })).toBeVisible();
  await expect(page.getByLabel('Nom du deck')).toHaveValue('Héritage');
  await expect(page.getByRole('progressbar', { name: 'Cartes du deck' })).toHaveAttribute(
    'aria-valuenow',
    String(possedees),
  );
});

for (const theme of ['light', 'dark'] as const) {
  test(`la construction d’un deck ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await collectionneur(page, `Decks ${theme}`);
    await page.goto('/decks/nouveau');
    await ajouterCartes(page, 4);
    await expect(page.getByRole('progressbar', { name: 'Cartes du deck' })).toHaveAttribute(
      'aria-valuenow',
      '4',
    );
    const construction = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(construction.violations).toEqual([]);

    await page.getByLabel('Nom du deck').fill(`Deck ${theme}`);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page).toHaveURL(/\/decks\/[0-9a-f-]{36}$/);
    await page.goto('/decks');
    await expect(page.getByRole('heading', { name: 'Vos decks (1 / 5)' })).toBeVisible();
    const liste = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(liste.violations).toEqual([]);
  });
}
