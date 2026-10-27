# US-001 — Development foundation

- **Epic**: EPIC-00
- **Status**: Done
- **Priority**: Must
- **Size**: S

## Story

As a **developer**, I want **a fully tooled project (Git, TypeScript, ESLint, Prettier, Vitest, Playwright, Husky, CI)**
so that **I produce clean code that is verified automatically**.

## Acceptance criteria

- [x] `npm run check` runs lint, format, typecheck and unit tests.
- [x] `npm run test:e2e` runs the Playwright journeys (mobile and desktop) with an axe-core accessibility audit.
- [x] Git hooks: lint-staged before commit, commitlint on the message.
- [x] GitHub Actions CI and Dependabot configured.

## Log

- 2026-10-16 — delivered.
