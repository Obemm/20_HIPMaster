import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { duelParApi } from './duel-api';

// Le duel est préparé par l'API (US-042) : ces parcours vérifient le plateau, pas le défi par lien (duels.spec.ts).

const finir = (page: Page) => page.getByRole('button', { name: 'Finir mon tour' });

test('un duel se joue à deux navigateurs, chacun voyant le tour de l’autre arriver', async ({
  page,
  browser,
}) => {
  // Trois tours à attendre l'interrogation du duel (3 s, ADR 0020), puis une fin de partie par l'API.
  test.slow();
  const { ada, bob, contexte, id, jetons } = await duelParApi(page, browser, 'e2e');

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
  const { ada, bob, contexte } = await duelParApi(page, browser, 'abandon');
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

test('sur un petit téléphone, le plateau du duel tient dans l’écran (US-059)', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const { ada, contexte } = await duelParApi(page, browser, 'mobile');
  await expect(ada.getByText(/sinon forfait\./)).toBeVisible();
  const zones = [
    ada.locator('#plateau-si'),
    ada.getByRole('list', { name: /^Plateau de / }),
    ada.getByRole('list', { name: 'Votre plateau' }),
    ada.getByRole('region', { name: /Votre main/ }),
    finir(ada),
  ];
  for (const zone of zones) {
    const boite = await zone.boundingBox();
    expect(boite).not.toBeNull();
    expect(boite!.y + boite!.height).toBeLessThanOrEqual(667);
  }
  const debord = await ada.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
  );
  expect(debord).toBeLessThanOrEqual(0);
  await contexte.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`le plateau du duel ne présente aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
    browser,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    const { ada, contexte } = await duelParApi(page, browser, theme);
    const { violations } = await new AxeBuilder({ page: ada })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(violations).toEqual([]);
    await contexte.close();
  });
}
