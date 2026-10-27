# US-013 — Game screen against the bot

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-013-ecran-partie-pve`

## Story

As a **player**, I want **to face the bot on my phone in under 5 minutes** so that **I discover the game by playing
it**.

## Acceptance criteria

- [x] From the home page, "Play against the bot" leads to the choice of a loaned deck, then to the game.
- [x] A **short rule** explains how to win and how a turn unfolds: the objective stays visible during the game, and
      the "How to play?" help is open at the start and can be consulted at any time (feedback from the project owner
      after their first game, 2026-10-18).
- [x] The **abilities** are explained in play: definition of each ability of the visible cards ("Abilities in play"),
      and contextual help when an opposing Guard blocks the attack ("we don't know what a card with Guard is",
      feedback from the project owner, 2026-10-18).
- [x] The board shows both Systems and their SLA, the Throughput, the number of cards in the opponent's draw pile and
      hand, the components deployed on each side and my hand, with the cards of US-009.
- [x] I play by touch, with the mouse and **with the keyboard**: deploy a card, choose an attacker then its target,
      decommission, end my turn. Only the possible actions are offered (they come from the API).
- [x] The bot's actions are displayed step by step and announced to screen readers (`aria-live` log).
- [x] The end of the game shows victory, defeat or draw, and offers to play again.
- [x] Usable at 375 px without horizontal scrolling, in light and dark, with no axe-core violation; an e2e journey
      plays at least one complete turn; `npm run check`, `npm run build` and `npm run test:e2e` pass.

## Notes

- No game rule on the front-end side (ADR 0004 and 0006): the screen displays the view and sends actions.
- The log scrolls line by line (250 ms) for the turn that has just been played; with `prefers-reduced-motion`,
  everything is displayed at once. What remained to be displayed is caught up on every new response: the log stays in
  order and never lags behind the board.
- On the board, components are compact **tokens** (rarity frame, name, current attack and HP); the hand reuses the
  cards of US-009.
- Screenshots: `docs/produit/captures/us-013-*.png`.

## Log

- 2026-10-18 — created (split of EPIC-04).
- 2026-10-18 — screens `/jouer` (deck choice) and `/jouer/:id` (game); board tokens; actions by touch and keyboard,
  derived from `vue.actions`; `role="log"` log; end of game with the focus on the result; 12 unit tests and 5 e2e
  journeys (including a complete game through to the result, axe-core audit in light and dark). A defect found by
  the e2e (log mixed up when two responses overlapped) is fixed and covered. In review.
- 2026-10-18 — feedback from the project owner after a game: "I don't understand how to win". Short rule added
  (criterion added).
- 2026-10-18 — `hip-regle-courte` component (how to win, the 4 steps of a turn, Guard and decommission) on the deck
  choice screen and in "How to play?", open at the start of the game; objective always visible; SLA displayed "out
  of 20". In review.
- 2026-10-18 — second feedback ("we don't know what a card with Guard is"): Guard explained with an example in the
  short rule, "Abilities in play" box (definitions of the visible abilities), help that names the opposing Guard at
  the moment of attacking. In review.
- 2026-10-18 — delivered: game screen against the bot playable end to end, with a short rule and explained abilities
