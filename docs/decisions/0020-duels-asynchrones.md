# 0020 — Duels between players: asynchronous, turn by turn, state in the database

- **Date**: 2026-10-19
- **Status**: Accepted

## Context

EPIC-06 lets two players face each other. The target players are IT colleagues: they play between meetings, rarely at
the same time. The engine is authoritative on the server (ADR 0004, 0013) and can already produce the view of each of
the two players (`vueDe`). Games against the bot live in memory (ADR 0014), which suits 5-minute games but not a duel
that can last several days. Accounts exist (ADR 0017) and so does the database (PostgreSQL in production, PGlite in
development, ADR 0018). The API runs as a single instance, and will be hosted on Azure (ADR 0008).

## Decision

- **Asynchronous, turn-by-turn duels**: each player plays their turn when they want. If both are present at the same
  time, the game moves as fast as live play, with nothing more to build.
- **State in the database**: a `duels` table holds the two players, their decks, the full engine state (JSON), the
  active player, the outcome, the deadline of the current turn and a **version number**. Each action is applied in a
  transaction and rejected if the version changed in the meantime (optimistic concurrency); only the active player
  can act.
- **Refresh by polling**: the duel screen asks for the game again every few seconds when it is the opponent's turn
  (conditional `GET` on the version, empty response if nothing moved); the "My duels" list updates on opening and at
  a longer interval. No permanent connection.
- **Deadline**: with no action for 72 hours, the active player loses by forfeit (configurable value). The deadline is
  evaluated on read, like the booster refill (ADR 0019): no background job.
- **Lent decks** at the start, as against the bot; decks built from the collection will come with their own story.
- The API never returns the full state, only the view of the requesting player (ADR 0014, unchanged).

## Alternatives considered

- **Real time over WebSocket**: the reaction is immediate, but open connections must be maintained (and, with several
  instances, a relay between them) for players who are rarely connected together; one more service to operate for
  little gain.
- **Server-Sent Events** to push "your turn": simpler than WebSocket and compatible with this choice; kept as a
  possible improvement if polling proves too slow or too costly.
- **Keep the duels in memory** (ADR 0014): a restart would wipe games lasting several days.
- **Events on a message broker**: meant for exchanges between applications, disproportionate for the internal events of
  a game.

## Consequences

- Duels survive restarts and a future move to several instances.
- The engine is unchanged: it already serves two symmetrical sides.
- Polling costs a few light requests per minute and per open screen; to be monitored once live (go-live EPIC to
  come).
- A "My duels" page and a "your turn" signal are needed, since there is no push notification.
- This choice does not replace ADR 0014: games against the bot stay in memory.
