# US-004 — Local database

- **Epic**: EPIC-00
- **Status**: Done
- **Priority**: Must
- **Size**: XS
- **Branch**: `us-004-base-de-donnees`

## Story

As a **developer**, I want **a local PostgreSQL database started with one command, with migrations**
so that **I can store players, cards and collections**.

> **Revised on 2026-10-19.** Docker is not installed on the development machine: the need was met differently by
> US-022 (ADR [0018](../../decisions/0018-pglite-developpement.md)). The original criteria, written for Docker, are
> replaced by the ones below; the Docker route remains available but has not been verified.

## Acceptance criteria

- [x] **When** I type `npm run dev`, **then** the API opens an embedded PostgreSQL database (PGlite, in `.donnees/`)
      without Docker or any other command, and applies all the migrations to it (`0000_init` to `0004_recompenses`).
- [x] The API tests and the e2e journeys use an in-memory PGlite database, empty on every run.
- [x] With `DATABASE_URL`, the API uses a real PostgreSQL and the same Drizzle schema; `npm run db:up` (Docker,
      port 5433), `db:migrate` and `db:studio` are used in that case — **not verified**, for lack of Docker on the
      machine.
- [x] ~~`npm run db:studio` lets me browse the `cartes` table~~: no longer applicable, the provisional `cartes` table
      was removed by US-023 (ADR 0011).

## Notes

ADR [0003](../../decisions/0003-postgresql-drizzle.md) (PostgreSQL and Drizzle) and
[0018](../../decisions/0018-pglite-developpement.md) (PGlite in development and tests). `db:migrate` and
`db:studio` go through drizzle-kit, which reads `DATABASE_URL`: they do not apply to the PGlite database, whose
migrations are applied when the API starts.

## Log

- 2026-10-16 — created, configuration written.
- 2026-10-19 — revised and closed: the local database is delivered by US-022 (PGlite, ADR 0018), the README states
  that `db:up`, `db:migrate` and `db:studio` concern PostgreSQL (`DATABASE_URL`).
- 2026-10-19 — delivered: Local database without Docker thanks to PGlite (US-022, ADR 0018); PostgreSQL route documented
