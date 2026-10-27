# US-036 — Concede and forfeit

- **Epic**: EPIC-06
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-036-abandon-forfait`

## Story

As a **player in a duel**, I want to **be able to concede, and not be stuck by an absent opponent** so that **every
duel ends someday**.

## Acceptance criteria

- [x] I can concede an ongoing duel, after confirmation: the opponent wins.
- [x] With no action from the active player for 72 hours (configurable), they lose by forfeit; the deadline is
      evaluated on read (ADR 0020) and shown to both players, on the board and in "My duels" (time left).
- [x] The outcome states the reason (SLA, turns, concession, forfeit) on the end screen and in "My duels".
- [x] API tests (concession, forfeit with an injected clock) and screen tests.

## Notes

- The engine gains two outcome reasons (`abandon`, `forfait`), or the API carries them alongside the engine's
  outcome.

## Log

- 2026-10-19 — created (split of EPIC-06, ADR 0020 proposed).
- 2026-10-19 — engine: `conceder(etat, perdant, 'abandon' | 'forfait')`, a pure function, and two new outcome
  reasons. API: `POST /duels/{id}/abandon`; deadline = last move + 72 h (`delaiTourMs`, configurable), exposed in the
  duel and in `GET /moi/duels`; the forfeit is applied on read (duel, list, move too late), through an update
  conditional on the version. Front end: "Concede" on the board with confirmation on screen, deadline shown ("Your
  move: within 2 d 5 h, or you forfeit"), reason for the end (concession, forfeit) on the end screen and in "My
  duels" ("Victory by forfeit", "2 d 1 h left"). The duel screen now polls the server throughout the game, to see an
  opposing concession during one's own turn. Tests: engine (2), API (3), screens (2), e2e (1: concession seen by the
  opponent without reloading).
- 2026-10-19 — delivered: Duel concession and forfeit: 72 h deadline evaluated on read
