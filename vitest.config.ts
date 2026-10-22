import { defineConfig } from 'vitest/config';

// Tests unitaires du domaine et de l'API ; le front Angular a son propre lanceur (`ng test`, Vitest aussi).
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'domain', include: ['packages/domain/src/**/*.test.ts'] } },
      {
        test: {
          name: 'api',
          include: ['apps/api/src/**/*.test.ts'],
          // Chaque fichier ouvre une base PGlite en mémoire dans un `beforeAll` (US-043) : le chargement du WASM
          // prend ≈ 1,6 s au repos et bien plus quand tous les projets tournent en parallèle sur un poste chargé.
          hookTimeout: 30_000,
          // Un PGlite occupe ≈ 550 Mo : cinq fichiers de front saturaient la mémoire du poste et Node tuait un
          // processus de travail. Les fichiers de l'API s'enchaînent donc (une base à la fois) ; le domaine et les
          // illustrations continuent de tourner en parallèle.
          fileParallelism: false,
        },
      },
      {
        test: {
          name: 'illustrations',
          include: ['packages/illustrations/src/**/*.test.ts'],
          // L'encodage AVIF est lent sur les machines de CI partagées, surtout en parallèle des autres projets.
          testTimeout: 30_000,
        },
      },
      // Outillage d'exploitation : lecture de firebase.json pour le déploiement et les parcours e2e (US-050).
      { test: { name: 'scripts', include: ['scripts/**/*.test.ts'] } },
    ],
    coverage: { provider: 'v8', include: ['packages/*/src/**', 'apps/api/src/**'] },
  },
});
