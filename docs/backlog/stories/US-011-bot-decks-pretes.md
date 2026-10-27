# US-011 — "Nightly Batch" bot and loaned decks

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-011-bot-decks-pretes`

## Story

As a **beginner player**, I want **a simple opponent and a ready-made deck** so that **I can play my first game
without collecting anything first**.

## Acceptance criteria

- [x] `validerDeck(deck)` applies the deck rules: 20 cards, at most 2 copies of a card, only 1 per legendary.
- [x] Two or three themed **loaned decks** (for example "Legacy" files and ESB, "Modern" API and EDA) are valid and
      contain only cards supported by the engine (US-010).
- [x] The **Nightly Batch** bot chooses its actions from **its own view only** of the game (it does not cheat): it
      deploys the most expensive card it can pay for, attacks first what it can destroy, otherwise the System, and
      decommissions when it cannot play anything. Any chance goes through the seeded generator.
- [x] A "bot against bot" simulation replays N games from a seed and gives the win rate per deck and the average
      duration (in turns); it is run with `npm run simuler`.
- [x] Every bot-against-bot game ends (20 turns at most); the results of a first simulation are noted in
      [cartes-set-1.md](../../produit/cartes-set-1.md) for balancing.

## Notes

- Other bot levels (ESB Architect, EDA Architect, Autonomous Agent) will come in a later story.

## Log

- 2026-10-18 — created (split of EPIC-04).
- 2026-10-18 — `validerDeck` and 3 loaned decks (Legacy, Modern, Hybrid); `choisirActionBatchDeNuit` bot (decides on
  its own view only, without chance); `jouerPartie` and `simuler`; `npm run simuler` script; 11 tests; simulation
  results (200 games per duel) noted in cartes-set-1.md: Modern dominates, Hybrid is the weakest. In review.
- 2026-10-18 — rebalancing requested by the project owner: Modern lightened (Apigee and Event broker 2 → 1), Hybrid
  rid of its dead cards (Context window, an LLM) in favour of SAP Adapter, MQSeries and Webhook; all duels between 42
  and 57% over 400 games and two seeds.
- 2026-10-18 — delivered: Nightly Batch bot, 3 loaned decks balanced by simulation (duels between 42 and 57%), npm run simuler
