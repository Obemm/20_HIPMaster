import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { REGLES_WCAG } from './axe';

// La navigation pensée pour le téléphone (US-060) : barre d'onglets en bas sous 768 px, dans le bandeau au-delà.

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Navigation principale' });

test.describe('sur un petit téléphone (375 × 667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('une barre d’onglets en bas, au pouce, qui signale la page courante et donne le focus à son titre', async ({
    page,
  }) => {
    await page.goto('/');
    const barre = navigation(page);
    const onglets = barre.getByRole('link');
    await expect(onglets).toHaveCount(5);
    // Fixée au bas de l'écran, chaque onglet d'au moins 44 × 44 px.
    const boiteBarre = await barre.boundingBox();
    expect(boiteBarre!.y + boiteBarre!.height).toBeCloseTo(667, 0);
    for (const onglet of await onglets.all()) {
      const boite = await onglet.boundingBox();
      expect(boite!.width).toBeGreaterThanOrEqual(44);
      expect(boite!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(barre.getByRole('link', { name: 'Créer un compte' })).toBeVisible();

    await barre.getByRole('link', { name: 'Duels' }).click();
    await expect(page).toHaveURL(/\/duels$/);
    await expect(barre.getByRole('link', { name: 'Duels' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(barre.getByRole('link', { name: 'Jouer' })).not.toHaveAttribute('aria-current');
    // Le lecteur d'écran annonce la nouvelle page : son titre a le focus.
    await expect(page.getByRole('heading', { level: 1, name: 'Mes duels' })).toBeFocused();
    // Sans compte, la page dit pourquoi il en faut un.
    await expect(page.getByText('Les duels se jouent entre comptes')).toBeVisible();

    await barre.getByRole('link', { name: 'Collection' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ma collection' })).toBeFocused();
    await expect(page.getByText('il faut un compte pour la garder')).toBeVisible();

    // La barre ne masque pas le bas de la page.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const dernier = page.getByRole('main').getByRole('link', { name: 'Créer un compte' });
    const boiteDernier = await dernier.boundingBox();
    expect(boiteDernier!.y + boiteDernier!.height).toBeLessThanOrEqual(boiteBarre!.y);

    const { violations } = await new AxeBuilder({ page }).withTags(REGLES_WCAG).analyze();
    expect(violations).toEqual([]);
  });

  test('avec un compte : le stock de boosters dans l’onglet, et la barre s’efface en partie', async ({
    page,
  }) => {
    await page.goto('/compte');
    await page.getByLabel('Pseudo').fill('Pouce e2e');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();
    await expect(
      page.getByRole('heading', { name: 'Connecté en tant que Pouce e2e' }),
    ).toBeVisible();
    const barre = navigation(page);
    await expect(barre.getByRole('link', { name: 'Mon compte : Pouce e2e' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(barre.getByRole('link', { name: 'Boosters 5 en stock' })).toBeVisible();

    await barre.getByRole('link', { name: 'Jouer' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: /Jouer contre le bot/ }),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Jouer avec Moderne' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Partie contre le bot' }),
    ).toBeVisible();
    // En partie, le plateau garde tout l'écran (US-059) ; « Quitter » ramène à la navigation.
    await expect(barre).toBeHidden();
    await page.getByRole('dialog').getByRole('button', { name: 'C’est parti' }).click();
    await page.getByRole('link', { name: 'Quitter' }).click();
    await expect(barre).toBeVisible();
  });
});

test.describe('au bureau', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('la même navigation, dans le bandeau, y compris pendant une partie', async ({ page }) => {
    await page.goto('/jouer');
    const barre = navigation(page);
    const boite = await barre.boundingBox();
    expect(boite!.y).toBeLessThan(60);
    await expect(barre.getByRole('link', { name: 'Jouer' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.getByRole('button', { name: 'Jouer avec Hybride' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Partie contre le bot' }),
    ).toBeVisible();
    await expect(barre).toBeVisible();
  });
});
