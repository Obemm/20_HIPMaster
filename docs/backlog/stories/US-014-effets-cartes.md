# US-014 — Spells and incidents

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Should
- **Size**: L
- **Branch**: `us-014-effets-cartes`

## Story

As a **player**, I want **to play spells (Patterns, prompting) and incidents (Bestiary)** so that **I can turn a game
around with a well-placed Circuit Breaker, Splitter or Poison message**.

## Acceptance criteria

### Engine (`packages/domain`)

- [x] A new `jouer` action plays a spell or an incident from the hand, paying its cost, with its possible **targets**
      (allied or opposing component, card in the discard pile, System); the card then goes to the discard pile.
- [x] The **12 spells** are applied: Rate limiting, Data mapping, Chain of thought, Human-in-the-loop, System prompt,
      Few-shot, Dead Letter Queue, Circuit Breaker, Content-Based Router, Splitter, Idempotent Consumer, Retry.
- [x] The **13 incidents** are applied: Prompt injection, Plain-text password, Expired certificate, Tight coupling,
      Hallucination, Poison message, Timeout, Duplicate, Empty file at 3 a.m., Broken encoding, Context overflow,
      Agent loop, Token bill.
- [x] The **counters** are applied: Human-in-the-loop, OAuth2 (against Expired certificate), `.ok` flag file (against
      Empty file at 3 a.m.), Veteran (FTP is never targeted nor hit at random by an AI card).
- [x] `actionsPossibles` offers each playable spell or incident with each of its legal target combinations;
      `CARTES_PRISES_EN_CHARGE` includes these 27 cards (25 spells and incidents, OAuth2 and `.ok` flag file).
- [x] Each effect and each counter has its test; chance (Hallucination) goes through the seeded generator.

### Bot, decks and simulation

- [x] The Nightly Batch bot can play spells and incidents (on its own view only).
- [x] The loaned decks include spells and incidents from their universe; a new simulation keeps every duel between 40
      and 60% of wins (obtained: 43 to 55%), and its results are noted in
      [cartes-set-1.md](../../produit/cartes-set-1.md).

### API and screen

- [x] The OpenAPI contract and the action schema accept `jouer` with its targets.
- [x] On screen, a spell or incident card offers one action per possible target ("Play on …"); the log tells the
      effect obtained. E2E journey and axe-core audit green.

## Notes

- **Split** (2026-10-18): the original US-014 ("effects of spells, incidents and AI cards") covered about forty
  effects; it is split into three. The own effects of components move into
  [US-019](US-019-effets-composants.md), the AI abilities and Migration into [US-020](US-020-capacites-ia.md).
- Actions remain explicit (ADR 0013): `jouer` is added to `poser`, `evoluer`, `decommissionner`, `attaquer` and
  `finirTour`.
- Three card texts are clarified to be playable without ambiguity (carried over into the catalogue and
  [cartes-set-1.md](../../produit/cartes-set-1.md)): **Agent loop** targets one or two agents; **Prompt injection**
  makes an opposing agent attack at once a target on its own side (component or System); **Plain-text password**
  targets an opposing Files component, destroyed if it is FTP, otherwise wounded by 2.

## Log

- 2026-10-18 — created (split of EPIC-04).
- 2026-10-18 — story split: keeps only spells, incidents and their counters; US-019 and US-020 created.
- 2026-10-18 — engine: `jouer` action, `EFFETS` registry (targets by zone and filter, legal combinations), expiring
  statuses, counters; bot: `choisirJeu` (simple scores); loaned decks with spells and incidents (duels between 43
  and 55% over 400 games); API: contract and schemas (`jouer`, component statuses); screen: "Play on …", statuses on
  the tokens, log sentences; 26 effect tests, 1 API test, 2 screen tests, e2e journey that also plays spells. In
  review.
- 2026-10-18 — delivered: spells and incidents playable from the engine to the screen, bot and loaned decks balanced (43 to 55%)
