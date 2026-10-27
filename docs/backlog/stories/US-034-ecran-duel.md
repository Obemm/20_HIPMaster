# US-034 — Duel screen

- **Epic**: EPIC-06
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-034-ecran-duel`

## Story

As a **player in a duel**, I want to **play my turn and see my opponent's** so that **I can take the duel through to
the end**.

## Acceptance criteria

- [x] The screen reuses the one for the game against the bot (board, hand, log, help) with the opponent's username.
- [x] During the opponent's turn, the screen announces it ("Ada's turn") and updates by itself once they have played
      (polling every 3 seconds, suspended if the tab is hidden); the opponent's actions go into the log like the
      bot's.
- [x] The end of the duel announces victory, defeat or draw, and offers a rematch: "Rematch" opens a new challenge,
      whose link is to be sent back to the opponent (sending directly to the same opponent waits for "My duels",
      US-035).
- [x] Screen tests; e2e journey of a full duel with two browsers; axe-core audit green.

## Notes

- Update announcements go through a polite `aria-live` region.

## Log

- 2026-10-19 — created (split of EPIC-06, ADR 0020 proposed).
- 2026-10-19 — the game screen gains a "duel" mode (`mode`) instead of being duplicated: the opponent is named
  everywhere (title, side, help, short rule, log with the French elision "d'Ada"), actions go to
  `/duels/{id}/actions` with `If-Match`, and during the opponent's turn the screen requests the duel again every
  3 s (`If-None-Match`, `?depuis=`), unless the tab is hidden; a 409 reloads the duel. The `/duels/:id` page shows
  this board as soon as the challenge is taken up. The hand of cards becomes focusable (keyboard scrolling even when
  its cards are disabled). Mode falls back to "bot" when the router binds `undefined`. Tests: screen (4), log (1),
  e2e (3: duel with two browsers, ending driven by the API to go fast, axe in light and dark).
- 2026-10-19 — delivered: Duel screen: board shared with the bot, named opponent, update during the opponent's turn
