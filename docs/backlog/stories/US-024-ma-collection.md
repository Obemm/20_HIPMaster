# US-024 — My collection

- **Epic**: EPIC-03
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-024-ma-collection`

## Story

As a **signed-in player**, I want to **see the cards I own and those I am missing** so that **I can track my progress in
the set**.

## Acceptance criteria

- [x] The collection page displays the **set progress** (e.g. "37 / 71") and, per rarity, the number of cards obtained.
- [x] Each owned card shows its number of copies (duplicates); missing cards stay visible, greyed out, with their name,
      to make you want them.
- [x] The catalogue filters (family, rarity) apply, plus an "owned / missing" filter.
- [x] A card's detail view (US-009) shows the number of copies owned.
- [x] API and screen tests; e2e journeys and axe-core audit green.

## Log

- 2026-10-18 — created.
- 2026-10-18 — contract `openapi/collection.yaml` and route `GET /moi/collection` (owned cards and copies). Front end:
  `CollectionService` (loaded at sign-in, reloaded after each booster), "My collection" page (progress for the set and
  per rarity, progress bar, duplicates "× n", missing cards greyed out, ownership, family and rarity filters), detail
  view in a modal above the collection (`/collection/:numero`, route data `retour`) showing the copies owned;
  "Collection" link in the banner. Tests: API (collection), screen (3), detail (2 more), e2e (3, axe in light and dark
  included).
- 2026-10-18 — delivered: My collection: set progress, duplicates, missing cards greyed out, copies in the detail view
