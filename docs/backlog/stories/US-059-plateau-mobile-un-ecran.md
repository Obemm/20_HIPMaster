# US-059 — A game board that fits on a phone screen

- **Epic**: EPIC-10
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-059-plateau-mobile-un-ecran`

## Story

As a **player on a phone**, I want **to see the opposing side, my side and my hand without scrolling the page** so that
**I can play a game like in a real card game, one-handed, between two meetings**.

## Context

Finding from the 2026-10-22 review, at 375 × 812: when a game opens, the "How to play" box is expanded and takes up
the first screen and a half; the bot's side starts at about 1,100 px, the player's hand at about 1,500 px (page of
2,000 px). To play, you have to scroll between the opposing side, your side, your hand and the "End my turn" button.
Same layout on the duel screen.

## Acceptance criteria

- [x] **Given** a game open on a 375 × 667 px screen (small phone), **then** the opposing System and side, my side, my
      hand and the main action ("End my turn") are visible **without scrolling the page**; only the hand and the sides
      scroll horizontally if needed.
- [x] **Given** a first game, **then** the "How to play" help opens once (or from an always-visible "?" button), then
      stays collapsed: we remember it has been seen.
- [x] **Given** the game log, **then** it is available on demand (panel or tab) instead of pushing the board down.
- [x] **Given** a desktop screen, **then** the layout takes advantage of the width (board in the centre, log and help
      on the side).
- [x] **Given** a player who has enlarged the text size on their phone, **then** the text of cards and tokens follows
      that setting (sizes in `rem`, no more fixed 10 px floor in `vignette-carte.html` and `jeton-composant.ts`)
      without breaking the layout.
- [x] Same rules for the duel screen. Keyboard navigation, screen reader and e2e journeys unchanged or adapted; axe
      audit with no new violation.

## Notes

- The "play" loop is the heart of the game: it is the most worthwhile ergonomic gain before inviting players.
- Leads: opposing area at the top, player's area at the bottom, hand anchored at the bottom of the screen (like
  Hearthstone or WikiMasters), card details in a modal sheet.
- Choices made:
  - **Help**: a "How to play" modal window (objective, short rule, abilities in play), opened by itself on the first
    game played in this browser, then from the "?" button in the header. The fact that it has been seen is kept by the
    browser ([ADR 0032](../../decisions/0032-preferences-interface-navigateur.md)).
  - **Log**: a two-line strip between the two sides (the latest moves stay readable and announced to screen readers),
    which unfolds on demand over the board.
  - **Detail of a card or component** (US-040, US-041): a sheet fixed to the bottom of the screen, non-modal, which
    covers the hand without pushing the board; focus moves to it on opening and returns to the card on closing.
  - **Sides and hand**: a row that scrolls horizontally; the action bar stays stuck to the bottom of the screen.
  - **Desktop** (≥ 1,024 px): the board in the centre, and on the side the objective, abilities in play and the full
    log.

## Log

- 2026-10-22 — created, from the design review before going live.
- 2026-10-23 — refined and started (batch 2, front-end session): layout choices noted above.
- 2026-10-23 — delivered: board on one phone screen (375 × 667 with no scrolling), help window opened once then through "?", log as an expandable strip, detail in a sheet at the bottom of the screen, side column on desktop, card texts in rem (ADR 0032)
- 2026-10-23 — merge with main: the "About and privacy" footer (US-053) disappears during a game or a duel, otherwise
  it made the board overflow on a small phone.
