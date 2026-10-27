# US-084 — Play with your deck against the bot and in duels

- **Epic**: EPIC-15
- **Status**: Done
- **ADR**: [0049](../../decisions/0049-jouer-avec-son-deck.md)
- **Priority**: Should
- **Size**: M
- **Branch**: `us-084-jouer-avec-son-deck`

## Story

As a **player**, I want to **choose one of my decks when playing** so that I can **put my strategy to the test
against the bot and against my colleagues**.

## Acceptance criteria

- [x] **Given** the "Play against the bot" screen, **then** my valid decks appear next to the loaner decks, with their
      name and preview, and the game starts with the chosen deck (ADR 0030: the deck is kept in the game).
      → My complete decks at the top of the list, as deck boxes (flagship cards), then the loaner decks; incomplete
      decks are not offered, and the screen says how many are waiting to be completed.
- [x] **Given** a challenge or a random opponent (EPIC-06), **then** each player chooses their deck; the server checks
      the deck again at launch.
      → `deck` accepts the identifier of one of the player's decks in `POST /parties`, `POST /duels`,
      `POST /duels/hasard` and `POST /duels/{id}/rejoindre`; 422 `deck-incomplet` for a deck that became incomplete,
      `deck-inconnu` for another player's deck (ADR 0049). The challenge announces the name of the creator's deck.
- [x] **Given** a deck modified during a game in progress, **then** the game keeps the deck it was launched with.
      → The composition is copied into the engine state at launch; the creator of a duel freezes it at creation
      (`cartes_createur`, `nom_deck_createur`), even if the deck changes or disappears before an opponent joins.
- [x] The score and the leaderboard (US-069) do not depend on the chosen deck; the guided game (US-067) keeps its
      fixed deck.
      → Unchanged: the score does not read the deck, the guided game ignores `deck` (existing tests).

## Log

- 2026-10-26 — created, at the project owner's request (EPIC-15).
- 2026-10-26 — refined (ADR 0049: checked again at launch, frozen in the game), then coded: API, deck-choice screens
  (bot, challenge, random opponent, accepting a challenge), English texts, unit, API (PGlite and PostgreSQL 18) and
  e2e tests.
- 2026-10-26 — delivered: Complete own decks offered against the bot and in duels, checked again at launch and frozen
  in the game
