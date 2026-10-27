# US-025 — A booster for every victory

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-025-recompense-victoire`

## Story

As a **signed-in player**, I want to **win a booster when I beat the bot** so that **I have a reason to play again**.

## Acceptance criteria

- [x] A victory against the bot, in a game played while signed in, earns **one booster** (cap of 3 per day,
      adjustable); the reward is granted **by the server**, only once per game.
- [x] The end-of-game screen announces the booster won (or the cap reached) and leads to opening it.
- [x] API tests (single reward, cap) and screen tests.

## Notes

- Depends on US-022 (account) and US-023 (boosters).

## Log

- 2026-10-18 — created.
- 2026-10-18 — the game remembers the signed-in player who started it (optional token on `POST /parties`); a victory
  adds `recompense` to the game (`GET` and `POST …/actions`). `recompenses` table (one row per game won, migration
  `0004_recompenses`): a single reward per game, cap of 3 boosters per UTC day (`REGLES_BOOSTERS.victoiresParJour`),
  booster won added to the stock even beyond the refill cap. End screen: "A booster won!" and "Open my booster", cap
  reached, or invitation to create an account. Tests: API (5: uniqueness, cap and next day, exceeding the refill cap,
  won game while signed in, game without an account), screen (3).
- 2026-10-18 — delivered: One booster per victory against the bot, once per game, 3 per day at most
