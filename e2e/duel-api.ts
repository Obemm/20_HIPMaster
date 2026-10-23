import { type Browser, expect, type Page } from '@playwright/test';

/**
 * Préparation des parcours de duel par l'API (US-042) : créer un compte, lancer et relever un défi se font en
 * quelques requêtes, sans naviguer. Les parcours qui testent justement ces écrans (compte, défi par lien) gardent
 * l'interface ; les autres partent d'un duel déjà prêt et vérifient ce qui leur importe.
 */

const CLE_JETON = 'hipmaster.jeton';
/** L'aide « Comment jouer ? » déjà vue : elle ne s'ouvre pas par-dessus le plateau (US-059, ADR 0032). */
const CLE_AIDE_VUE = 'hipmaster.aide-vue';

const auth = (jeton: string) => ({ authorization: `Bearer ${jeton}` });

/** Crée un compte par l'API et connecte la page : le jeton est en place avant son premier chargement. */
export async function creerCompteParApi(page: Page, pseudo: string): Promise<string> {
  const reponse = await page.request.post('/api/v1/joueurs', { data: { pseudo } });
  expect(reponse.status(), `création du compte ${pseudo}`).toBe(201);
  const { jeton } = (await reponse.json()) as { jeton: string };
  await page.addInitScript(
    ([cleJeton, valeur, cleAide]) => {
      localStorage.setItem(cleJeton, valeur);
      localStorage.setItem(cleAide, 'oui');
    },
    [CLE_JETON, jeton, CLE_AIDE_VUE] as const,
  );
  return jeton;
}

/** Un duel prêt entre Ada (deck Moderne, `page`) et Bob (deck Héritage, autre contexte), les deux plateaux ouverts. */
export async function duelParApi(page: Page, browser: Browser, suffixe: string) {
  const jetonAda = await creerCompteParApi(page, `Ada ${suffixe}`);
  const contexte = await browser.newContext();
  const bob = await contexte.newPage();
  const jetonBob = await creerCompteParApi(bob, `Bob ${suffixe}`);

  const cree = await page.request.post('/api/v1/duels', {
    headers: auth(jetonAda),
    data: { deck: 'moderne' },
  });
  expect(cree.status(), 'création du duel').toBe(201);
  const { id } = (await cree.json()) as { id: string };
  const rejoint = await bob.request.post(`/api/v1/duels/${id}/rejoindre`, {
    headers: auth(jetonBob),
    data: { deck: 'heritage' },
  });
  expect(rejoint.status(), 'Bob rejoint le duel').toBe(200);

  await Promise.all([page.goto(`/duels/${id}`), bob.goto(`/duels/${id}`)]);
  await expect(
    page.getByRole('heading', { level: 1, name: `Duel contre Bob ${suffixe}` }),
  ).toBeVisible();
  await expect(bob.getByRole('heading', { level: 1, name: `Ada ${suffixe}` })).toBeVisible();
  return { ada: page, bob, contexte, id, jetons: { j1: jetonAda, j2: jetonBob } };
}
