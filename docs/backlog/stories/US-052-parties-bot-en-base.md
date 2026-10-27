# US-052 — Games against the bot kept in the database

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-052-parties-bot-en-base`

## Story

As a **player**, I want **my game against the bot to survive a game update or a pause** so that **I do not lose a game
in progress for no reason**.

## Context

ADR 0014 keeps games against the bot in the API's memory (one `Map` per process) and requires a single instance. On
Cloud Run (ADR 0021):

- each deployment replaces the instance: with continuous deployment (US-050) and the current pace of several merges a
  day, games in progress would be lost several times a day;
- scaling to zero (after about fifteen minutes without a request) and instance recycling also wipe everything;
- keeping an instance on permanently (`min-instances=1`) would limit the losses, but would pay for an instance at all
  hours, without settling the deployments;
- the game screen announces that a game "expires after 30 minutes without activity": this would be false.

Duels are already in the database (ADR 0020), with the same engine and a serialisable state (ADR 0013): 11 to 18 KB
per game, 1.5 ms of computation per bot action on average.

Decision: ADR [0030](../../decisions/0030-parties-bot-en-base.md), which replaces ADR 0014.

## Acceptance criteria

- [x] **Given** a game against the bot in progress, **when** the API restarts (new instance on the same database),
      **then** the game resumes where it was (API test).
- [x] **Given** two actions sent at the same time on the same game, **then** only one is applied, the other receives 409
      (version, like duels).
- [x] **Given** a game with no activity for a configurable duration, **then** it is considered expired when read and
      purged afterwards; the text of the game screen states the real rule.
- [x] **Given** anonymous games (without an account), **then** they remain possible (ADR 0017) and their number is
      bounded by rate limiting (US-047) and the purge.
- [x] The Cloud Run service can move to several instances (ADR 0021); ADR 0014 is replaced by a new ADR.

## Design

- `parties` table: identifier, optional owner (player and session fingerprint, both absent for an anonymous game),
  decks, level, full engine state (JSON), `version`, creation and last-move dates. Deleting the account or closing
  the session deletes its games (cascading foreign keys).
- **One action = one single write**, conditional on the version read: the player's action, then the whole bot turn,
  are computed in memory and written together (`UPDATE … WHERE version = $read`). Two simultaneous actions: the first
  writes, the other no longer finds its version and receives **409**. `If-Match` (optional, like duels) rejects
  outright an action based on a stale version; the response carries `version` and the `ETag` header.
- **Expiry: 24 hours without a move played** (creation or action; a simple read does not count), configurable. An
  expired game answers 404 as soon as it is read; it is deleted at the next game creation, with all the other expired
  games. No background task.
- **Ceiling: 1,000 games**, configurable: at creation, beyond it, the least recently played anonymous game is deleted,
  and only failing that a signed-in player's (rule of ADR 0025, unchanged).
- The migration only adds a table: the live version does not depend on it (rule of compatible migrations in
  `docs/exploitation/README.md`). The in-memory games of the old revision are lost one last time at deployment.

## Notes

- The victory reward remains guaranteed only once per game (`recompenses.partie_id`).
- Moving Cloud Run to several instances remains an operations decision: the rate-limiting counters are specific to each
  instance (ADR 0025), and each instance opens its own connection pool (ADR 0023).

## Log

- 2026-10-22 — created, from the review before going live (ADR 0014 and 0021).
- 2026-10-23 — refined: design, ADR [0030](../../decisions/0030-parties-bot-en-base.md), OpenAPI contract first.
- 2026-10-23 — delivered: games against the bot in the database (parties table, migration 0010 add-only): an action and the bot's turn written at once under a version condition (409 to the loser, optional If-Match, ETag); expiry after 24 h without a move evaluated on read, purge and ceiling of 1,000 games (anonymous first) at creation; resumption after restart tested; concurrency proven on PostgreSQL 18; ADR 0030 replaces 0014
- 2026-10-23 — decision of the project owner: games against the bot are data of a game in progress, not scores; their
  expiry remains possible, but a reward won stays acquired (test added, ADR 0030).
