# 0003 — PostgreSQL + Drizzle ORM, Docker in development

- **Date**: 2026-10-16
- **Status**: Accepted — the Docker development database is replaced by PGlite ([0018](0018-pglite-developpement.md))

## Context

Players, cards, collections, boosters and games must be stored, with reliable transactions (opening a booster = debiting
one booster and crediting 5 cards, in a single block).

## Decision

PostgreSQL 18; Drizzle ORM (schema in TypeScript in `src/db/schema.ts`, versioned SQL migrations in `drizzle/`);
local database started by `docker compose` (port 5433).

## Alternatives considered

- **Prisma**: very popular, but heavier (client generation) and further from SQL.
- **SQLite**: simple, but less suited to the concurrent writes of a multiplayer game.
- **Supabase / Firebase**: quick to start, but depends on a service and scatters the logic.

## Consequences

- Types shared between the database and the code, migrations reviewed in PRs.
- Docker Desktop must be running to develop with the database.
- Production hosting to be chosen later (Neon, Supabase Postgres, VPS…).
