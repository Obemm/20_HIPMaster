# US-035 — My duels and "your turn"

- **Epic**: EPIC-06
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-035-mes-duels`

## Story

As a **signed-in player**, I want to **see my duels and know which ones are waiting for my turn** so that **I do not
keep my opponents waiting**.

## Acceptance criteria

- [x] A "My duels" page lists the duels where it is my turn (first), the opponent's turn, waiting for an opponent
      and finished, with the opponent, the turn and the time of the last move ("3 min ago"); the time left before the
      deadline will come with the forfeit (US-036).
- [x] The banner shows a "your turn" counter (updated on navigation and every minute).
- [x] The tab title picks it up ("(2) HIPMaster") so it can be seen from another tab.
- [x] `GET /moi/duels` (OpenAPI contract); API and screen tests; axe-core audit green.

## Notes

- A push notification (Server-Sent Events, email) remains a possible improvement (ADR 0020).

## Log

- 2026-10-19 — created (split of EPIC-06, ADR 0020 proposed).
- 2026-10-19 — `GET /moi/duels` (contract in `duels.yaml`): the player's duels sorted by group (my turn, opponent's
  turn, waiting, then the last 20 finished), most recent first; only the active player, the turn and the winner are
  read from the state (JSON extraction in the database). Front end: `MesDuelsService` (updated on sign-in, on each
  navigation and every minute), `/duels` page, "Duels" link with a counter in the banner ("1 your turn" for screen
  readers) and tab title "(n) …" through a `TitleStrategy`. Pitfall avoided: the service does not inject the router
  (circular dependency with the title strategy), the banner listens to navigations instead. Tests: API (3), screen
  and title (2), e2e (3, with two browsers, axe in light and dark).
- 2026-10-19 — delivered: My duels: list by priority, "your turn" counter in the banner and the title
