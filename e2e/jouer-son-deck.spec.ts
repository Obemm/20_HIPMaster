import { expect, test } from '@playwright/test';
import { deckCompletParApi } from './decks-api';
import { creerCompteParApi } from './duel-api';

// US-084 : jouer avec son deck contre le bot et en duel.

test('contre le bot, mon deck complet est proposé avant les decks prêtés, et la partie se lance avec', async ({
  page,
}) => {
  const jeton = await creerCompteParApi(page, 'Stratège e2e');
  await deckCompletParApi(page, jeton, 'Mon deck e2e');
  // Un brouillon incomplet n'est pas proposé, et l'écran le dit.
  await page.request.post('/api/v1/moi/decks', {
    headers: { authorization: `Bearer ${jeton}` },
    data: { nom: 'Brouillon e2e', cartes: [] },
  });

  await page.goto('/jouer');
  const boutons = page.getByRole('button', { name: /^Jouer avec / });
  await expect(boutons.first()).toHaveText('Jouer avec Mon deck e2e');
  await expect(page.getByRole('button', { name: 'Jouer avec Brouillon e2e' })).toHaveCount(0);
  await expect(
    page.getByText('Un de vos decks est incomplet : il n’est pas proposé.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Jouer avec Héritage/ })).toBeVisible();

  await boutons.first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Partie contre le bot' })).toBeVisible();
});

test('un défi lancé avec mon deck annonce son nom à l’adversaire', async ({ page, browser }) => {
  const jeton = await creerCompteParApi(page, 'Défieuse e2e');
  await deckCompletParApi(page, jeton, 'Deck de défi');
  await page.goto('/duels/nouveau');
  await page.getByRole('button', { name: 'Défier avec Deck de défi' }).click();
  await expect(page.getByText('Votre deck : Deck de défi.')).toBeVisible();
  const lien = page.url();

  const contexte = await browser.newContext();
  const collegue = await contexte.newPage();
  await creerCompteParApi(collegue, 'Collègue e2e');
  await collegue.goto(lien.replace(/^https?:\/\/[^/]+/, ''));
  await expect(collegue.getByText(/joue le deck Deck de défi\./)).toBeVisible();
  await collegue.getByRole('button', { name: /^Relever le défi avec Héritage/ }).click();
  await expect(
    collegue.getByRole('heading', { level: 1, name: 'Duel contre Défieuse e2e' }),
  ).toBeVisible();
  await contexte.close();
});
