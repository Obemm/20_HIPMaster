# 0011 — The card catalogue is versioned domain data

- **Date**: 2026-10-18
- **Status**: Accepted

## Context

US-008 publishes the 71 cards of set 1 ([cartes-set-1.md](../produit/cartes-set-1.md)). The database holds a provisional
`cartes` table (US-004, ADR 0003), created before the card model was defined. Cards are game rules: their statistics and
abilities are read by the combat engine (ADR 0004), reviewed in code review and balanced by replayable simulations. A
master data management tool is only worth it when reference data must be shared between systems; that is not the case
here, the catalogue exists only for the game.

## Decision

- The catalogue (cards and abilities) is written as **typed TypeScript in `packages/domain`**, versioned with the code.
  It is validated by invariant tests (numbers, rarities, evolutions, statistics).
- The API **reads it from the domain** and exposes it read-only (`GET /api/v1/cartes`); no writes.
- The database keeps only **what belongs to players** (accounts, collection, decks, games), which will reference
  cards by their **number**. The provisional `cartes` table will be removed by a migration in the first story that
  touches the collection (EPIC-03), so that this story is not mixed with a schema change.

## Alternatives considered

- **Catalogue in the database** (a `cartes` table fed by a script): editable without a deployment, but the game rules
  would end up outside code review and outside the domain tests, and the engine would depend on the database, which
  ADR 0004 forbids.
- **JSON or YAML file** loaded at start-up: readable, but less safe than TypeScript types checked at compile time
  (unknown abilities, missing fields).
- **A master data management tool**: disproportionate for data that is shared with no other system.

## Consequences

- Changing a card takes a PR and a deployment: this is intended, cards are rules.
- The combat engine and the bot read the catalogue without network or database access, which keeps simulations fast.
- Card numbers become a **stable identifier**: a published card is never renumbered.
