# US-088 — Translate the product docs, READMEs, operations guide and review

- **Epic**: EPIC-16
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-088-translate-product-docs`

## Story

As an **English-speaking contributor**, I want **the game's rules, universe, catalogue and guides in English** so
that **I understand the game before proposing a card or a feature**.

## Acceptance criteria

- [x] In English, paths unchanged: `README.md`, `docs/README.md`, every file of `docs/produit/`,
      `docs/exploitation/README.md`, `docs/revues/`, the READMEs of `packages/` and `apps/`.
- [x] Card names, abilities and game terms follow the `/en/` version of the game (`packages/domain/src/langues/en/`,
      `apps/web/src/locale/messages.en.json`); quotations of French game texts stay in French where the text is about
      them.
- [x] Links and anchors still resolve (anchors change with the headings: update the links that point to them).
- [x] `npm run check` passes.

## Log

- 2026-10-27 — created (EPIC-16).
- 2026-10-28 — delivered: README, docs index, product docs, operations guide, review and package READMEs in British English, paths kept (PR #112).
