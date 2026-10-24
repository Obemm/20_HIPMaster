import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';
import { creerCompteParApi } from './duel-api';

const auth = (jeton: string) => ({ authorization: `Bearer ${jeton}` });

/** Ada et Bob, comptes créés par l'API ; Bob abandonne leur duel : Ada marque 5 points, et sa cote monte. */
async function adaBatBob(page: Page, bob: Page, suffixe: string) {
  const jetonAda = await creerCompteParApi(page, `Ada ${suffixe}`);
  const jetonBob = await creerCompteParApi(bob, `Bob ${suffixe}`);
  const cree = await page.request.post('/api/v1/duels', {
    headers: auth(jetonAda),
    data: { deck: 'moderne' },
  });
  const { id } = (await cree.json()) as { id: string };
  await bob.request.post(`/api/v1/duels/${id}/rejoindre`, {
    headers: auth(jetonBob),
    data: { deck: 'heritage' },
  });
  const abandon = await bob.request.post(`/api/v1/duels/${id}/abandon`, {
    headers: auth(jetonBob),
  });
  expect(abandon.status(), 'Bob abandonne').toBe(200);
}

/** La ligne d'un joueur dans le tableau du classement. */
const ligne = (page: Page, pseudo: string) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name: pseudo, exact: true }) });

test('un duel gagné compte au score ; un joueur peut se retirer du classement', async ({
  page,
  browser,
}) => {
  const contexte = await browser.newContext();
  const bob = await contexte.newPage();
  await adaBatBob(page, bob, 'classement');

  await page.goto('/');
  await page.getByRole('link', { name: /Classement/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Classement' })).toBeVisible();
  const score = page.getByRole('region', { name: 'Mon score' });
  await expect(score.getByRole('definition').first()).toHaveText('5');
  await expect(ligne(page, 'Ada classement (vous)')).toContainText('1016');

  // Bob a perdu : aucun point, mais une cote ; il se retire du classement.
  await bob.goto('/classement');
  await expect(bob.getByText('Vous entrez au classement avec votre premier point.')).toBeVisible();
  await bob.getByLabel(/Apparaître dans le classement/).uncheck();
  await expect(bob.getByText('Vous êtes retiré·e du classement')).toBeVisible();
  await contexte.close();

  await page.reload();
  await expect(ligne(page, 'Ada classement (vous)')).toBeVisible();
  await expect(ligne(page, 'Bob classement')).toHaveCount(0);
});

for (const theme of ['light', 'dark'] as const) {
  test(`le classement ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
    browser,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const contexte = await browser.newContext();
    await adaBatBob(page, await contexte.newPage(), `classement ${theme}`);
    await contexte.close();
    await page.goto('/classement');
    await expect(ligne(page, `Ada classement ${theme} (vous)`)).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(violations).toEqual([]);
  });
}
