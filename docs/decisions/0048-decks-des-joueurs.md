# 0048 — Player decks: 5 per account, validated by the domain, slots freed at read time

- **Date**: 2026-10-26
- **Status**: Accepted

## Context

EPIC-15 (US-083) lets a player build their decks from the cards of their collection, keep them and find them again on
another device. The server is authoritative (ADR 0004): the deck rules (`validerDeck`: 20 cards, at most 2 copies, 1
for a legendary) live in the domain. Decisions of the project owner (2026-10-26): **at most 5 decks per player**; if a
card is removed (from the player's collection or from the catalogue), **its slot is freed** in every deck that
contained it, the deck becomes incomplete again, is flagged and can no longer be used to play until it is completed.
Today no route removes a card from a collection; the catalogue, versioned in the domain (ADR 0011), changes at each
deployment, with no event or background task (ADR 0019, 0020, 0030). A deleted account is deleted with all its data
(ADR 0031). Queries stay light (ADR 0039, Neon).

## Decision

- **A `decks` table**: UUID identifier, player (foreign key **cascading**: the deck disappears with the account,
  ADR 0031), name (1 to 30 characters), **cards** (array of numbers, one number per copy), creation and modification
  dates. An index on the player serves the list and the account deletion (ADR 0039).
- **At most 5 decks** (`DECKS_MAX`, domain constant): creation locks the player's row (`SELECT … FOR UPDATE`, like
  opening a booster, ADR 0019), counts their decks and refuses the sixth (409, `decks-plafond`); two simultaneous
  creations do not exceed the limit.
- **The domain describes a deck's problems by stable code** (`problemesDeck`): size, unknown card, too many copies,
  card not owned (more copies than the collection). `validerDeck` keeps its French sentences by relying on it. The API
  returns the code of the first problem (Problem Details, US-082) and the complete list in `problemes`, which the
  front end translates.
- **An incomplete deck can be saved** (fewer than 20 cards: a draft, built in several sittings on a phone); **any
  other problem is refused** (422): more than 20 cards, too many copies, unknown or unowned card. Only a **complete
  and valid** deck is used to play (US-084), checked again when the game starts.
- **Slots are freed at read time**, like booster refilling (ADR 0019): the database keeps the composition saved by the
  player; each read compares it with the collection and the catalogue (`libererPlaces`, pure domain function) and
  returns the **effective** deck (without the vanished copies), its state (`complet`) and the number of slots freed.
  Nothing is rewritten: the player's next save fixes the new composition.
- **The deck rules travel with the list** (`GET /moi/decks`: size, copies, cap): during building, the front end says
  what is missing or excessive without copying the constants, but it is always the server that decides.
- **No optimistic concurrency**: a deck is only modified by its owner; if two devices save the same deck, the last one
  wins. Duplicating and "copying a loaned deck" are creations like any other: the front end prepares the composition
  (limited to owned cards), the server checks it.

## Alternatives considered

- **Rewriting decks at the moment a card disappears** (trigger, or an update in the route that would remove the
  card): no such route exists, and the removal of a card from the catalogue arrives through a deployment, with no
  event. A catch-up task at start-up would be needed, which the version still live would not run (ADR 0028). The
  read-time computation gives the player the same result, with nothing running.
- **Freeing slots at read time and rewriting the row**: a read that writes wakes the database for nothing and collides
  with concurrent reads; the displayed result is the same.
- **Refusing any incomplete deck**: on a phone, building 20 cards in one go is tedious, and a deck becomes incomplete
  anyway when a card disappears: the "incomplete" state already exists, so we might as well allow it.
- **Composition as JSON or as a table of rows (deck, card, copies)**: JSON loses PostgreSQL typing; the table of rows
  costs a join and several writes per save, for 20 numbers. The integer array is read and written in one go, like the
  engine's deck (`creerPartie`).
- **Validating in the front end**: contrary to ADR 0004; the front end only announces the rules.

## Consequences

- A read of "My decks" makes two queries (decks, collection), bounded by the cap of 5 decks.
- A player who regains a card before saving the deck again finds it back in place: the deck completes itself. This is
  a benefit rather than a flaw, but the screen says so ("slots freed").
- The migration only adds a table: the live version does not depend on it (ADR 0028).
- US-084 reuses `problemesDeck` and `libererPlaces` to check the deck again when a game starts and to freeze it in its
  state.
