# 0014 — State of games in progress kept in memory by the API

- **Date**: 2026-10-18
- **Status**: Superseded by 0030

## Context

US-012 has games played against the bot on the server, which is authoritative (ADR 0004, 0013). The state of each
game must be kept between two requests. Games last less than 5 minutes, there are no player accounts yet (EPIC-02),
and the API runs as a single instance. On 2026-10-18 the project owner chose to keep this state in memory for the
first playable milestone.

## Decision

- Games in progress live in an **in-memory store** of the API (`Map` identifier → game), specific to each instance of
  the application.
- Each game has a **UUID v4** identifier (not guessable), the full engine state (`EtatPartie`), the player's deck and
  the bot's, and its last activity date.
- **Expiry**: a game with no activity for 30 minutes is deleted. **Cap**: 1,000 games; beyond that, the least
  recently played game is deleted to make room. Both values are configurable, and the clock can be injected for
  tests.
- The bot plays **within the player's request**, right after their end of turn: the response contains the new view and
  the events of the bot's turn. A bot turn takes a few milliseconds, far below the 3 s response target of a front-end
  API.
- The API **never returns the full state**, only the player's view (`vueDe`).
- The human player is always `j1`, the bot `j2`. The draw always decides who starts.

## Alternatives considered

- **PostgreSQL**: games would survive a restart and could be served by several instances, but it would need a
  migration and Docker from the first milestone. This will be reconsidered with player accounts.
- **Redis**: a very good shared ephemeral state store, but one more service to operate for a need that a `Map` covers
  today.
- **State on the client (signed token)**: no server storage, but the hidden view (opposing hand and deck) would still
  have to travel, encrypted, and the state grows with every action.

## Consequences

- An **API restart loses the games in progress**: this is acceptable for 5-minute games with nothing at stake.
- The API must stay **single-instance** as long as this choice holds: to be reconsidered (new ADR) before any
  horizontal scaling on Azure (ADR 0008), or when player accounts arrive.
- Without accounts, **a game belongs to whoever knows its identifier**. The risk is limited: the identifier is not
  guessable and the game has nothing at stake.
