# US-037 — Random opponent

- **Epic**: EPIC-06
- **Status**: Done
- **Priority**: Could
- **Size**: M
- **Branch**: `us-037-adversaire-hasard`

## Story

As a **signed-in player**, I want to **find an opponent without knowing anyone** so that **I can play a duel whenever
I feel like it**.

## Acceptance criteria

- [x] "Random opponent" places me in the open duels: I join the oldest duel waiting for another player, or open one
      if there is none.
- [x] I never end up against myself, and not twice in a row against the same player if another is waiting.
- [x] I can leave the queue as long as nobody has joined me.
- [x] API tests (pairing, two players joining the same duel concurrently) and screen tests.

## Notes

- No ranking or level-based pairing for now (EPIC-07).

## Log

- 2026-10-19 — created (split of EPIC-06, ADR 0020 proposed).
- 2026-10-19 — `duels.ouvert` column (migration `0006_duels_ouverts`): an open duel forms the queue, a private
  challenge (link) is never offered at random. `POST /duels/hasard`: joins the oldest open duel of another player,
  avoiding the last opponent where possible (`SKIP LOCKED` against simultaneous joins), otherwise opens a duel (201);
  already in the queue, you keep your place. Front end: "Take on a random opponent" from "Play" (`/duels/hasard`,
  same screen as the challenge), "Looking for an opponent…" screen with "Leave the queue". Tests: API (5, including
  concurrency), screens (3), e2e (3, desktop profile only and in series: shared queue).
- 2026-10-19 — delivered: Random opponent: queue of open duels, private challenges kept apart
