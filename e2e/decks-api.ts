import { expect, type Page } from '@playwright/test';

// Préparation des parcours d'US-084 par l'API : un compte riche de 125 cartes et un deck complet à lui, sans passer
// par l'écran de construction (testé dans decks.spec.ts). L'API des e2e fait de chaque compte un administrateur
// (`ADMINISTRATEURS=tous`) : il s'offre 20 boosters par un code (US-070).

const auth = (jeton: string) => ({ authorization: `Bearer ${jeton}` });

/** Ouvre tous les boosters du stock : les 5 de bienvenue et les 20 du code. */
async function remplirCollection(page: Page, jeton: string) {
  const demain = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const code = await page.request.post('/api/v1/admin/codes-boosters', {
    headers: auth(jeton),
    data: {
      libelle: `Decks e2e ${crypto.randomUUID()}`,
      boosters: 20,
      utilisations: 1,
      expire: demain,
    },
  });
  expect(code.status(), 'code de boosters').toBe(201);
  const recu = await page.request.post('/api/v1/moi/boosters/codes', {
    headers: auth(jeton),
    data: { code: ((await code.json()) as { code: string }).code },
  });
  expect(recu.status(), 'boosters reçus').toBe(201);
  for (let i = 0; i < 25; i++) {
    const ouverture = await page.request.post('/api/v1/moi/boosters/ouvertures', {
      headers: auth(jeton),
    });
    expect(ouverture.status()).toBe(201);
  }
}

/** Un deck complet de 20 cartes possédées, enregistré au nom de `nom` ; renvoie son identifiant. */
export async function deckCompletParApi(page: Page, jeton: string, nom: string): Promise<string> {
  await remplirCollection(page, jeton);
  const { cartes: possedees } = (await (
    await page.request.get('/api/v1/moi/collection', { headers: auth(jeton) })
  ).json()) as { cartes: { numero: number; exemplaires: number }[] };
  const catalogue = (await (await page.request.get('/api/v1/cartes')).json()) as {
    numero: number;
    rarete: string;
  }[];
  const legendaires = new Set(
    catalogue.filter((c) => c.rarete === 'legendaire').map((c) => c.numero),
  );
  const cartes = possedees
    .flatMap(({ numero, exemplaires }) =>
      Array.from({ length: Math.min(exemplaires, legendaires.has(numero) ? 1 : 2) }, () => numero),
    )
    .slice(0, 20);
  expect(cartes, 'assez de cartes pour un deck').toHaveLength(20);
  const deck = await page.request.post('/api/v1/moi/decks', {
    headers: auth(jeton),
    data: { nom, cartes },
  });
  expect(deck.status(), 'deck enregistré').toBe(201);
  const { id, complet } = (await deck.json()) as { id: string; complet: boolean };
  expect(complet).toBe(true);
  return id;
}
