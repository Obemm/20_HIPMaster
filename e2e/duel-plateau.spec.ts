import AxeBuilder from '@axe-core/playwright';
import { type Browser, expect, type Page, test } from '@playwright/test';

async function creerCompte(page: Page, pseudo: string) {
  await page.goto('/compte');
  await page.getByLabel('Pseudo').fill(pseudo);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: `Connecté en tant que ${pseudo}` })).toBeVisible();
}

/** Ada lance un défi, Bob le relève dans un autre navigateur : les deux plateaux s'affichent. */
async function duelEntre(page: Page, browser: Browser, suffixe: string) {
  await creerCompte(page, `Ada ${suffixe}`);
  await page.goto('/duels/nouveau');
  await page.getByRole('button', { name: 'Défier avec Moderne' }).click();
  const lien = await page.getByLabel('Lien du défi').inputValue();

  const contexte = await browser.newContext();
  const bob = await contexte.newPage();
  await creerCompte(bob, `Bob ${suffixe}`);
  await bob.goto(new URL(lien).pathname);
  await bob.getByRole('button', { name: 'Relever le défi avec Héritage' }).click();

  await expect(
    bob.getByRole('heading', { level: 1, name: `Duel contre Ada ${suffixe}` }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: `Duel contre Bob ${suffixe}` }),
  ).toBeVisible({
    timeout: 10_000,
  });
  return { ada: page, bob, contexte, id: new URL(lien).pathname.split('/').at(-1) ?? '' };
}

const finir = (page: Page) => page.getByRole('button', { name: 'Finir mon tour' });

test('un duel se joue à deux navigateurs, chacun voyant le tour de l’autre arriver', async ({
  page,
  browser,
}) => {
  const { ada, bob, contexte, id } = await duelEntre(page, browser, 'e2e');

  // Celui qui commence finit son tour ; l'autre voit son tour arriver sans recharger, et ainsi de suite.
  let actif = (await finir(ada).isEnabled()) ? ada : bob;
  for (let tour = 0; tour < 3; tour++) {
    const autre = actif === ada ? bob : ada;
    await finir(actif).click();
    await expect(finir(autre)).toBeEnabled({ timeout: 10_000 });
    await expect(autre.getByRole('log')).toContainText('à vous de jouer');
    actif = autre;
  }
  await expect(ada.getByRole('log')).toContainText('Bob e2e joue');
  await expect(bob.getByRole('log')).toContainText('Ada e2e joue');

  // La suite du duel par l'API, pour aller vite jusqu'à la fin des 20 tours.
  const jeton = (p: Page) => p.evaluate(() => localStorage.getItem('hipmaster.jeton'));
  const jetons = { j1: await jeton(ada), j2: await jeton(bob) };
  for (let i = 0; i < 40; i++) {
    const vue = await page.request.get(`/api/v1/duels/${id}`, {
      headers: { authorization: `Bearer ${jetons.j1}` },
    });
    const duel = (await vue.json()) as { statut: string; vue: { actif: 'j1' | 'j2' } };
    if (duel.statut === 'termine') break;
    await page.request.post(`/api/v1/duels/${id}/actions`, {
      headers: { authorization: `Bearer ${jetons[duel.vue.actif]}` },
      data: { type: 'finirTour' },
    });
  }

  for (const joueur of [ada, bob]) {
    await joueur.reload();
    await expect(
      joueur.getByRole('heading', { name: /Victoire|Défaite|Partie nulle/ }),
    ).toBeVisible();
    await expect(joueur.getByRole('link', { name: 'Lancer une revanche' })).toBeVisible();
  }
  await contexte.close();
});

test('abandonner un duel, après confirmation : l’adversaire voit sa victoire sans recharger', async ({
  page,
  browser,
}) => {
  const { ada, bob, contexte } = await duelEntre(page, browser, 'abandon');
  await expect(ada.getByText(/dans les .*, sinon forfait\./)).toBeVisible();
  await ada.getByRole('button', { name: 'Abandonner', exact: true }).click();
  await ada.getByRole('button', { name: 'Oui, abandonner' }).click();
  await expect(ada.getByRole('heading', { name: 'Défaite' })).toBeVisible();
  await expect(ada.getByText('Vous avez abandonné.')).toBeVisible();

  await expect(bob.getByRole('heading', { name: 'Victoire !' })).toBeVisible({ timeout: 10_000 });
  await expect(bob.getByText('Ada abandon a abandonné.')).toBeVisible();
  // Première victoire du jour contre Ada : elle rapporte un booster (US-038).
  await expect(bob.getByText('Un booster gagné !')).toBeVisible();
  await expect(bob.getByRole('link', { name: 'Ouvrir mon booster' })).toBeVisible();
  await contexte.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`le plateau du duel ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
    browser,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const { ada, contexte } = await duelEntre(page, browser, theme);
    const { violations } = await new AxeBuilder({ page: ada })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(violations).toEqual([]);
    await contexte.close();
  });
}
