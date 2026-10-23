# 0030 — Games against the bot kept in the database, version and single write per action

- **Date**: 2026-10-23
- **Status**: Accepted

## Context

ADR 0014 kept the games against the bot in the API's memory, with a single instance. On Cloud Run (ADR 0021), every
deployment (several a day since continuous deployment, ADR 0028), every scale-down to zero and every instance recycling
erases the games in progress; yet the screen announced "30 minutes without activity". ADR 0014 planned to come back to
it when accounts arrived and before any scaling. Duels already live in the database (ADR 0020) with the same engine
and the same serialisable state (ADR 0013): 11 to 18 KB per game, 1.5 ms of computation per bot action. PostgreSQL is
there in production (Neon, ADR 0023) and PGlite in development (ADR 0018). Games without an account must remain
possible (ADR 0017), and ADR 0025 settled who owns a game and what is evicted at the cap.

## Decision

- **A `parties` table**: UUID v4 identifier, optional owner (player and fingerprint of the token of the session that
  created it, both absent for an anonymous game), player's deck, bot's deck, level, **full engine state as JSON**,
  **version number**, creation and last-move dates. The two owner columns are cascading foreign keys: deleting the
  account or closing the session deletes its games, which no other session can read.
- **One action, a single write, conditional on the version read** (optimistic concurrency, like duels): the API reads
  the game, applies the player's action then plays **the bot's whole turn** in memory, and writes the result with a
  single `UPDATE … WHERE version = $read`. If another action went through in the meantime, the write no longer finds
  its version: **409**, nothing is applied. No lock is held during the bot's computation. An optional `If-Match`
  header (the version of the previous response, also given as an `ETag`) refuses outright an action based on a
  stale version, for example a double click on "End turn".
- **Expiry on read: 24 hours without a move played** (creation or an action; a simple read does not extend the game),
  adjustable. An expired game answers 404 like an unknown game. **Purge on creation**: each new game first deletes all
  expired games. No background task, as for boosters (ADR 0019) and duels (ADR 0020).
- **A game is in-progress game data, not a score**: it can expire and be purged, but the reward for a victory, kept
  separately (`recompenses`, one row per game), remains earned.
- **Cap: 1,000 games**, adjustable. Beyond it, creation deletes the anonymous game played least recently, and only
  failing that the game of a signed-in player: the rule of ADR 0025 is taken over as is. With rate limiting (20
  creations per minute and per address, ADR 0025), the volume stays bounded: 1,000 games of 18 KB at most come to
  under 20 MB, far from Neon Free's 1 GB (ADR 0021).
- Unchanged since ADR 0014: the API **never returns the full state**, only the player's view; the player is always `j1`,
  the bot `j2`; the bot plays **within the player's request**, far below the 3 s response target of a front-end API. A
  game started by an account is visible only to its session (ADR 0025), an anonymous game to whoever knows its
  identifier.

## Alternatives considered

- **Keep memory, with `min-instances=1`**: fewer losses on scale-down to zero, but an instance paid at all hours, and
  still a loss on every deployment. Rejected.
- **Row lock (`SELECT … FOR UPDATE`) during the action, like duels**: two simultaneous actions would apply one after
  the other, and two "End turn" would pass two turns (the bot hands back control between them). The write conditional
  on the version refuses the second, without holding a lock during the bot's turn.
- **One table per event (journal in rows)** rather than a JSON state: the engine produces a full, serialisable state
  (ADR 0013); splitting it up would bring nothing for games lasting a few minutes.
- **Redis or Memorystore**: shared and fast, but one more paid service (ADR 0021), for a need that the database already
  there covers.
- **State on the client (signed token)**: the bot's hand and draw pile would have to travel encrypted, and the state
  would grow with each action (already rejected by ADR 0014).
- **Reserve games for signed-in players**: simpler to bound, but contrary to ADR 0017 (one plays without an account).
  Rejected.

## Consequences

- A game survives deployments, scale-downs to zero and restarts; the screen states the real rule (24 hours without a
  move played). When this change is deployed, the games kept in memory by the old revision are lost one last time.
- The migration only adds a table: the live version does not depend on it.
- Each action costs a read and a write of 11 to 18 KB, and a game, even an anonymous one, wakes the Neon database: to
  be watched with the rest of the consumption (US-051).
- Nothing in the games requires a single instance any more: the constraint ADR 0014 placed on ADR 0021 is lifted.
  Moving to several instances remains an operations decision: the rate-limit counters are specific to each instance
  (ADR 0025, they would be multiplied accordingly) and each instance opens its own connection pool (ADR 0023).
- The front end can send `If-Match` to prevent a double click from playing twice; without it, nothing changes for the
  old front end.
- ADR [0014](0014-parties-en-memoire.md) is superseded by this one.
