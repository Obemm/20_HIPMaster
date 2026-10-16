# US-001 — Socle de développement

- **Epic** : EPIC-00
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : S

## Récit

En tant que **développeur**, je veux **un projet outillé (Git, TypeScript, ESLint, Prettier, Vitest, Playwright, Husky, CI)**
afin de **produire un code propre et vérifié automatiquement**.

## Critères d'acceptation

- [x] `npm run check` lance lint, format, typecheck et tests unitaires.
- [x] `npm run test:e2e` lance les parcours Playwright (mobile et bureau) avec un audit d'accessibilité axe-core.
- [x] Hooks Git : lint-staged avant commit, commitlint sur le message.
- [x] CI GitHub Actions et Dependabot configurés.

## Journal

- 2026-10-16 — réalisée.
