# EPIC-15 — Decks of your own

- **Status**: Done
- **Priority**: Should

## Goal

Today you can only play with three lent decks (Legacy, Modern, Hybrid, US-011). Yet the product vision plans for
players to **build their own deck** from their collection (`docs/produit/vision.md`). Request from the project owner
(2026-10-26): every player must be able to build custom decks and play with them, which at last gives meaning to the
collection and the boosters.

## Success indicator

- A player builds a deck from the cards they own, names it, saves it, and finds it again on another device (guest
  account, US-022).
- They play with this deck against the bot and in a duel; the server always checks the deck (size, copies, cards
  owned), never the front end (ADR 0004).
- The lent decks stay available, for beginners.

## Stories

- [x] US-083 — Build, name and keep your own decks from your collection
- [x] US-084 — Play with your deck against the bot and in duels

Order: US-083, then US-084.

## Out of scope

- Trading or selling cards between players.
- Different deck formats (size, restrictions by family): the current rules (20 cards, at most 2 copies, 1 for a
  legendary, the domain's `validerDeck`) apply.
