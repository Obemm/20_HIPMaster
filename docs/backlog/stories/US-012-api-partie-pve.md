# US-012 — Game API against the bot

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-012-api-partie-pve`

## Story

As a **player**, I want **the game to run on the server** so that **nobody can cheat and the bot plays by the same
rules as I do**.

## Acceptance criteria

- [x] An ADR records the choice: the state of ongoing games is **kept in memory** by the API, with expiry (abandoned
      games) and a maximum number of games; a game is lost if the API restarts. To be reviewed with player accounts
      and the move to several instances.
- [x] The OpenAPI contract of the `decks` and `parties` resources is written before the code.
- [x] `GET /api/v1/decks` lists the loaned decks.
- [x] `POST /api/v1/parties` (chosen deck) creates a game against the Nightly Batch bot and returns its identifier
      (UUID, not guessable) and the **player's view**; if the bot starts, its first turn has already been played.
- [x] `GET /api/v1/parties/{id}` returns the player's view, with their possible actions.
- [x] `POST /api/v1/parties/{id}/actions` applies the player's action; after "end turn", the server has the bot play
      and returns the new view with the events of the bot's turn.
- [x] Errors in Problem Details format: unknown or expired game (404), illegal action (422) with the reason.
- [x] Tests by request injection, including a game played through to the end.

## Notes

- Without accounts (EPIC-02), a game belongs to whoever knows its identifier: a limit that is accepted and noted in
  [ADR 0014](../../decisions/0014-parties-en-memoire.md).
- The bot plays with a randomly drawn loaned deck; the returned view gives the effective attack of each component (Hub
  bonus included), so that the screen has no rule to compute.

## Log

- 2026-10-18 — created (split of EPIC-04).
- 2026-10-18 — ADR 0014; contract `apps/api/openapi/parties.yaml`; in-memory `DepotParties` (UUID, 30 min expiry,
  cap of 1,000, injectable clock and seed); routes `GET /decks`, `POST /parties`, `GET /parties/{id}`,
  `POST /parties/{id}/actions` (the bot plays within the request); domain view enriched with the effective attack;
  9 tests including a game played to the end; verified on the local API. In review.
- 2026-10-18 — delivered: server-side games against the bot: in-memory store (ADR 0014), OpenAPI contract, 4 routes, the bot plays within the request
