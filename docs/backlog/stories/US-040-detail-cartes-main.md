# US-040 — View the details of the cards in your hand

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-040-detail-cartes-main`

## Story

As a **player**, I want to **view the details of a card in my hand during the game** so that **I can read its effect
and abilities in full before deciding to play it**.

## Acceptance criteria

- [x] **Given** a game in progress (against the bot or in a duel), **when** I tap a card in my hand, **then** it is
      selected and shown enlarged, with its name, type, family, rarity, cost, attack and HP (component), its effect
      (spell, incident), each of its abilities with its definition, the card it evolves from where applicable, and
      its "In real life".
- [x] **Given** that it is my turn, **then** the card's possible actions (deploy, decommission…) are offered below
      its details. Selecting plays nothing: looking and acting remain two distinct gestures.
- [x] **Given** that it is not my turn, **when** I tap a card in my hand, **then** its details are shown anyway,
      without actions, with a message saying I will be able to play it on my turn.
- [x] Tapping the card again, the "Close" button or the Esc key closes the details; focus returns to the card in the
      hand. The details are readable on a phone, without horizontal scrolling, and do not leave the game.
- [x] No rule is computed in the front end (ADR 0004): the details show the catalogue data (`/api/v1/cartes`),
      already loaded by the screen; the actions remain those of `vue.actions`.
- [x] Screen tests; `npm run check` passes; `npm run test:e2e` passes, axe-core audit included.

## Notes

- Finding: in the hand, thumbnails (`hip-vignette-carte` without a title, 7 to 8 rem wide) make the effect and
  abilities hard to read, and the hand's buttons are disabled during the opponent's turn: one cannot even select a
  card then.
- Project owner's decision (2026-10-19), based on the practice of digital card games (Marvel Snap, Hearthstone, MTG
  Arena, Legends of Runeterra): looking at a card is always possible, including during the opponent's turn; looking
  and acting are separate; abilities are defined where they are read. Tapping a card selects it and shows it
  enlarged, with its actions below, rather than an extra "Details" button. Long press and hover may come later as
  shortcuts, never as the only means (neither discoverable nor keyboard-accessible).
- The details are shown in the page, below the hand, and not in a modal window: the actions stay within reach and the
  game stays visible.
- The board (my components and the opponent's, with their current HP) is the subject of US-041.

## Log

- 2026-10-19 — created, at the project owner's request.
- 2026-10-19 — refined: selection = details + actions, viewable during the opponent's turn (project owner's
  decision, based on digital card games). Branch started from `us-039-expliquer-attaques`, not yet merged, to avoid
  conflicts on the game screen.
- 2026-10-19 — delivered: Tapping a card in the hand shows it enlarged below the hand (effect, abilities defined in place, evolution, "In real life"), with its actions below on your turn; viewable during the opponent's turn; closed by the card, Close or Esc with focus returning.
