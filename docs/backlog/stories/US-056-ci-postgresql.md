# US-056 — The CI tests the API on a real PostgreSQL

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: S
- **Branch**: `us-056-ci-postgresql`

## Story

As the **project owner**, I want **the CI to also run the API tests on PostgreSQL** so that I can **discover before
production what PGlite cannot show**.

## Context

All the API tests and the e2e journeys run on PGlite (ADR 0018), which executes queries **one by one** (single lock).
The "simultaneous" duel tests would therefore pass even without `FOR UPDATE` or `SKIP LOCKED`, and neither postgres.js
(pool, JSONB) nor the migrations on a real server are ever exercised. Production will use PostgreSQL at Neon (ADR
0021).

## Acceptance criteria

- [x] **Given** a pull request, **when** the CI runs, **then** a job runs the API suite with a `postgres` service of the
      same major version as the production database and `DATABASE_URL` set, in addition to the current PGlite suite.
- [x] **Given** this job, **then** the migrations are applied on an empty database, then a second time with no effect.
- [x] **Given** the concurrent operations (booster opening, victory reward, duel matchmaking, duel action), **then**
      tests really launch them in parallel on PostgreSQL and verify that no gain is doubled and that no duel is joined
      twice.
- [x] The CI time stays reasonable (the job runs in parallel with the others).

## Notes

- The code already knows how to use PostgreSQL through `DATABASE_URL` (ADR 0018); a clean database must be given to
  each test file (schema or database per file).
- **PostgreSQL 18**, not 17 as envisaged at the batch launch: the production Neon project, created when the project
  owner signed up, is on PostgreSQL 18, and Neon never changes a project's major version (finding and ADR 0024 of
  US-049). It is also the version of PGlite (18.6) and of `docker-compose.yml`.
- A database per file rather than a schema: the migrations name the `public` schema (`CREATE TYPE "public"…`).

## Implementation

- `db/base-de-test.ts`: with `DATABASE_URL`, `baseDeTest()` creates an empty PostgreSQL database per file
  (`creerBaseVide`), migrates it on opening, empties it before each test and drops it at the end; without it, in-memory
  PGlite as before.
- `concurrence.test.ts`: booster openings, rewards (same game, and daily ceiling), random matchmaking and duel actions
  (with and without `If-Match`), ten at a time. The pool first opens its connections: without this, it opened them
  one by one and the first operation finished before the second began.
- `db/migrations.test.ts` (PostgreSQL only): migrations on an empty database, then a second opening with no effect
  (same number of migrations, data kept).
- `.github/workflows/ci.yml`: job "Tests de l'API sur PostgreSQL 18" (`postgres:18-alpine` service), in parallel with
  the others.

## Verifications

On 2026-10-22, against the PostgreSQL 18 of `docker-compose.yml`: the whole API suite passes (35 s, against 90 s on
PGlite) and leaves no database behind. Each lock was removed in turn to make sure the tests notice it:

| Lock removed                                | PostgreSQL               | PGlite       |
| ------------------------------------------- | ------------------------ | ------------ |
| `FOR UPDATE` of booster opening             | fails 3 times out of 3   | passes       |
| `FOR UPDATE` of the reward (same game)      | fails 5 times out of 5   | passes       |
| `FOR UPDATE` of the reward (daily ceiling)  | fails 3 times out of 3   | passes       |
| `FOR UPDATE SKIP LOCKED` of the matchmaking | fails 3 times out of 3   | passes       |
| `FOR UPDATE` of the duel action             | both tests, 3 out of 3   | passes       |
| none                                        | 6 tests pass, 3 out of 3 | 6 tests pass |

In CI (PR #43, 2026-10-22): the job "Tests de l'API sur PostgreSQL 18" took 46 s, image and `npm ci` included, in
parallel with the two other jobs, for 9 files and 73 tests, including the migrations and the concurrent tests.

## Log

- 2026-10-22 — created, from the API review before going live.
- 2026-10-22 — taken on (batch 1, API session); PostgreSQL 18 chosen, like the production Neon database.
- 2026-10-22 — delivered: CI job "Tests de l'API sur PostgreSQL 18" (version of the production Neon database), one database per test file, real concurrent tests (boosters, rewards, matchmaking, duel actions) that fail on PostgreSQL as soon as a lock is missing, migrations verified on an empty database then rerun with no effect
