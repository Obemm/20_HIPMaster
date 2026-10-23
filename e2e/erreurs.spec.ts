import { expect, test } from '@playwright/test';

// US-051 : une erreur JavaScript non gérée part vers l'API, qui la range dans Error Reporting ; seul le chemin de la
// page voyage, jamais ses paramètres (le lien d'invitation porte son code en paramètre).

test('une erreur non gérée est signalée à l’API, sans les paramètres de la page', async ({
  page,
}) => {
  await page.goto('/compte?invitation=ABCD-EFGH-JKLM');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const signalement = page.waitForResponse('**/api/v1/erreurs');
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error('Erreur d’essai du parcours e2e');
    });
  });
  const reponse = await signalement;
  expect(reponse.status()).toBe(204);
  const corps = reponse.request().postDataJSON() as Record<string, unknown>;
  expect(corps).toMatchObject({ message: 'Erreur d’essai du parcours e2e', page: '/compte' });
  expect(JSON.stringify(corps)).not.toContain('ABCD-EFGH-JKLM');
});
