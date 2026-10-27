# US-032 — Server-side duels: create, join, play on your turn

- **Epic**: EPIC-06
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-032-duels-serveur`

## Story

As a **signed-in player**, I want a **duel against another player to be held by the server** so that **I can play at
my own pace without anyone being able to cheat**.

## Acceptance criteria

- [x] ADR [0020](../../decisions/0020-duels-asynchrones.md) is accepted by the project owner.
- [x] A `duels` table (migration) keeps the two players, their decks, the engine state, the active player, the
      outcome, the turn deadline and a version; both players are accounts (ADR 0017).
- [x] `POST /duels` creates a duel waiting for an opponent with the chosen deck; `POST /duels/{id}/rejoindre` starts
      it with the opponent's deck (draw to see who starts, as against the bot).
- [x] `GET /duels/{id}` returns **the view of the requesting player** and its version; with the known version, the
      response is empty if nothing has changed (304).
- [x] `POST /duels/{id}/actions` is only accepted from the active player; two simultaneous actions cannot both be
      applied (409 on a stale version); a third party gets 404.
- [x] OpenAPI contract before the code; API tests (rights, turn, concurrency, opponent's hidden view).

## Notes

- Reuse the engine as is (`appliquer`, `vueDe`) and the public view schemas (US-026).

## Log

- 2026-10-19 — created (split of EPIC-06, ADR 0020 proposed).
- 2026-10-19 — ADR 0020 accepted. Contract `openapi/duels.yaml`; `duels` table (migration `0005_duels`, engine state
  as JSON, version); `duels/duels.ts` module (create, read, join, play, inside transactions that lock the row);
  `/duels` routes with `ETag`, `If-None-Match` (304) and `If-Match` (409 if stale); the creator plays j1, the
  opponent j2, the draw decides who starts. A third party sees a waiting duel (to join it, US-033) but never a
  started duel (404). API tests (8), including a duel played to the end.
- 2026-10-19 — delivered: Server-side duels: create, join, play on your turn, state in the database
