# EPIC-06 — Duels between players

- **Status**: Done
- **Priority**: Should

## Goal

Challenge a colleague or a random player. Duels are **asynchronous and turn-based** (ADR
[0020](../../decisions/0020-duels-asynchrones.md), accepted on 2026-10-19): everyone plays when they like, and the game
moves along live if both players are present.

## Success indicator

- A duel between two players ends without any desynchronisation or possible cheating (the server is authoritative,
  each player only sees their own view).
- A player knows at a glance, from any page, that a duel is waiting for their turn.

## Stories

- [x] US-032 — Server-side duels: create, join, play on your turn
- [x] US-033 — Challenge a colleague by link
- [x] US-034 — Duel screen
- [x] US-035 — My duels and "your turn"
- [x] US-036 — Concede and forfeit
- [x] US-037 — Random opponent
- [x] US-038 — A booster for a duel victory
- [x] US-042 — Reliable duel e2e journeys under load

Suggested order: US-032, US-033 and US-034 make up the first duel playable end to end; US-035 and US-036 make it
liveable day to day; US-037 and US-038 come next.

## Out of scope

- Tournaments, ranking (EPIC-07).
- Chat between players.
- Building decks from the collection: to be handled in its own story (duels start with loaned decks).
