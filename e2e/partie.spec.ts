import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const FIN = /Victoire !|Défaite|Partie nulle/;

async function commencer(page: Page, deck = 'Hybride') {
  await page.goto('/');
  await page.getByRole('link', { name: 'Jouer contre le bot' }).click();
  await expect(page).toHaveURL(/\/jouer$/);
  await page.getByRole('button', { name: `Jouer avec ${deck}` }).click();
  await expect(page).toHaveURL(/\/jouer\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Partie contre le bot' })).toBeVisible();
  await expect(page.getByText('Objectif :')).toBeVisible();
  await expect(page.getByText('Comment gagner ?')).toBeVisible();
}

/** Joue un tour simple : pose ou joue la première carte jouable de la main, attaque si possible, puis finit le tour. */
async function jouerUnTour(page: Page) {
  const main = page
    .getByRole('region', { name: /Votre main/ })
    .getByRole('listitem')
    .getByRole('button');
  for (const carte of await main.all()) {
    if (!(await carte.isEnabled())) continue;
    await carte.click();
    // Poser un composant, ou jouer un sort ou un incident sur sa première cible possible.
    const poser = page.getByRole('button', { name: /^(Poser|Jouer)/ }).first();
    if (await poser.isVisible()) {
      await poser.click();
      break;
    }
    await carte.click();
  }
  // Attaquer : l'attaquant, puis sa cible (qui s'affiche en grand), puis la confirmation (US-041).
  const attaquant = page.getByRole('button', { name: /peut attaquer$/ }).first();
  if (await attaquant.isVisible()) {
    await attaquant.click();
    const cible = page.getByRole('button', { name: /: cible possible$/ }).first();
    if (await cible.isVisible()) {
      await cible.click();
      await page.getByRole('button', { name: /^Attaquer avec / }).click();
    }
  }
  const finir = page.getByRole('button', { name: 'Finir mon tour' });
  if (await finir.isVisible()) await finir.click();
}

test('une partie complète contre le bot, jusqu’au résultat', async ({ page }) => {
  test.setTimeout(120_000);
  await commencer(page);
  const resultat = page.getByRole('heading', { level: 2, name: FIN });
  for (let tour = 0; tour < 12 && !(await resultat.isVisible()); tour++) {
    await expect(page.getByRole('button', { name: 'Finir mon tour' }).or(resultat)).toBeEnabled();
    await jouerUnTour(page);
    await expect(page.getByRole('log')).toContainText('Tour');
  }
  await expect(resultat).toBeVisible();
  await expect(resultat).toBeFocused();
  // Le journal affiche les événements un par un : la fin arrive après le dernier tour du bot.
  await expect(page.getByRole('log')).toContainText('Fin de la partie', { timeout: 15_000 });
  // Le journal reste dans l'ordre chronologique, même quand le bot joue pendant l'affichage.
  const tours = [
    ...((await page.getByRole('log').textContent()) ?? '').matchAll(/Tour (\d+)/g),
  ].map((m) => Number(m[1]));
  expect(tours).toEqual([...tours].sort((a, b) => a - b));
  await page.getByRole('link', { name: 'Rejouer' }).click();
  await expect(page).toHaveURL(/\/jouer$/);
});

test('le bot joue son tour, annoncé dans le journal', async ({ page }) => {
  await commencer(page, 'Moderne');
  await page.getByRole('button', { name: 'Finir mon tour' }).click();
  await expect(page.getByRole('log')).toContainText('le bot joue');
  await expect(page.getByRole('button', { name: 'Finir mon tour' })).toBeEnabled();
  const debord = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debord).toBeLessThanOrEqual(0);
});

test('on choisit la difficulté du bot avant son deck, et elle est rappelée pendant la partie', async ({
  page,
}) => {
  await page.goto('/jouer');
  const niveaux = page.getByRole('group', { name: '1. Difficulté du bot' });
  await expect(niveaux.getByRole('radio')).toHaveCount(4);
  await expect(niveaux.getByRole('radio', { name: /Stagiaire/ })).toBeChecked();
  await niveaux.getByRole('radio', { name: /Agent autonome/ }).check();
  await page.getByRole('button', { name: 'Jouer avec Moderne' }).click();
  await expect(page.getByText('Niveau : Agent autonome')).toBeVisible();
  await page.getByRole('button', { name: 'Finir mon tour' }).click();
  await expect(page.getByRole('button', { name: 'Finir mon tour' })).toBeEnabled();
});

test('une partie inconnue est annoncée comme introuvable', async ({ page }) => {
  await page.goto('/jouer/00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('heading', { name: 'Partie introuvable' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`le choix du deck et la partie ne présentent aucune violation d’accessibilité (thème ${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/jouer');
    await expect(page.getByRole('button', { name: 'Jouer avec Héritage' })).toBeVisible();
    const choix = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(choix.violations).toEqual([]);

    await page.getByRole('button', { name: 'Jouer avec Héritage' }).click();
    await expect(page.getByRole('button', { name: 'Finir mon tour' })).toBeVisible();
    const partie = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(partie.violations).toEqual([]);
  });
}

test('une évolution sans sa carte d’origine dit pourquoi elle ne se joue pas (US-071)', async ({
  page,
}) => {
  // Le tirage est au hasard : on crée des parties (deck Moderne) jusqu'à tenir Apigee AI Gateway (n° 40) en main,
  // sans Apigee API Gateway (n° 18) en jeu. Une partie sans compte appartient à qui connaît son identifiant.
  let id: string | undefined;
  for (let essai = 0; essai < 40 && !id; essai++) {
    const reponse = await page.request.post('/api/v1/parties', {
      data: { deck: 'moderne', niveau: 'stagiaire' },
    });
    expect(reponse.ok()).toBe(true);
    const partie = (await reponse.json()) as {
      id: string;
      vue: { moi: { main: { numero: number }[]; plateau: { numero: number }[] } };
    };
    const { main, plateau } = partie.vue.moi;
    if (main.some((c) => c.numero === 40) && !plateau.some((c) => c.numero === 18)) id = partie.id;
  }
  expect(id).toBeDefined();

  await page.goto(`/jouer/${id}`);
  const main = page.getByRole('region', { name: /Votre main/ });
  const carte = main.getByRole('button', { name: 'Apigee AI Gateway' });
  const raison =
    'Évolution d’Apigee API Gateway : posez d’abord Apigee API Gateway, puis faites-la évoluer.';
  // La vignette reste lisible, avec une mention visible ; la raison est annoncée aux lecteurs d'écran.
  await expect(carte).toBeEnabled();
  await expect(carte).toHaveAccessibleDescription(`Pas jouable : ${raison}`);
  await expect(main.getByText('Pas jouable').first()).toBeVisible();
  // Le texte réservé aux lecteurs d'écran n'élargit pas la page sur téléphone.
  const debord = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debord).toBeLessThanOrEqual(0);

  await carte.click();
  const detail = page.getByRole('region', { name: 'Apigee AI Gateway' });
  await expect(detail.getByText(raison)).toBeVisible();
  await expect(detail.getByRole('button', { name: /^Décommissionner/ })).toBeVisible();
  await expect(page.getByText('Débit, plateau plein')).toHaveCount(0);

  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(audit.violations).toEqual([]);
});
