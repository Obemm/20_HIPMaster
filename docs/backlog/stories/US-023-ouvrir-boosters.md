# US-023 — Receive and open boosters

- **Epic**: EPIC-03
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-023-ouvrir-boosters`

## Story

As a **signed-in player**, I want to **open card boosters** so that **I can grow my collection**.

## Acceptance criteria

- [x] A booster contains **5 cards** drawn **by the server** (rarity according to `CHANCES_BOOSTER`, then a random card
      within the rarity); the draw is a pure domain function, with injected randomness (ADR 0004).
- [x] **Welcome gift**: 5 boosters when the account is created.
- [x] **Refill**: one free booster every 10 minutes, stock capped at 10 (adjustable values, to be confirmed with the
      project owner).
- [x] The collection is **stored in the database** (player, card number, number of copies); the provisional `cartes`
      table from US-004 is removed by a migration (ADR 0011).
- [x] On screen, opening reveals the 5 cards in under a second, with an animation that respects
      `prefers-reduced-motion`; new cards are flagged.
- [x] OpenAPI contract before the code; draw tests (distribution of rarities over a large number of boosters), API
      tests and screen tests; e2e journeys and axe-core audit green.

## Log

- 2026-10-18 — created.
- 2026-10-18 — refill values kept as they are (5 given, 1 every 10 minutes, cap 10), adjustable in `REGLES_BOOSTERS`.
  ADR 0019: pure draw in the domain (cryptographic randomness on the API side), refill computed on read, opening in a
  transaction with a player lock. Migrations `0002_retrait_cartes` and `0003_boosters_collection`. Contract
  `openapi/boosters.yaml`, routes `GET /moi/boosters` and `POST /moi/boosters/ouvertures` (409 without stock). "My
  boosters" screen (refill countdown, reveal in 0.8 s disabled if `prefers-reduced-motion`, "New!" badge), "Boosters"
  link in the banner. Tests: domain (distribution of rarities over 20,000 boosters, refill), API (6), screen (3), e2e
  (4, axe included).
- 2026-10-18 — delivered: Boosters: 5 given, refill every 10 minutes, server-side draw and collection in the database
