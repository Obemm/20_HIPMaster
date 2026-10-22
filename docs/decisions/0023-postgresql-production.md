# 0023 — PostgreSQL in production: migrations before deployment, short-lived connections

- **Date**: 2026-10-22
- **Status**: Accepted
- **Completes**: [0018](0018-pglite-developpement.md) (database chosen by configuration, migrations at startup)

## Context

ADR 0018 chooses the database by configuration (`DATABASE_URL` → PostgreSQL, otherwise PGlite) and applies migrations
when the API starts, whichever database is used. ADR 0021 places the API on Cloud Run (0 or 1 instance, CPU allocated
during requests) and the database on Neon Free, which is suspended after 5 minutes without a connection and counts its
quota in compute hours. The review of 2026-10-22 and US-046 noted:

- without `DATABASE_URL`, the API silently falls back to PGlite: in production, each instance would have its own
  ephemeral database;
- migrations run at startup, without a lock: two instances starting together apply them twice (checked on
  PostgreSQL 18: the second fails when creating the migrations table), and every cold start would touch the database;
- the default postgres.js pool opens up to 10 connections and never closes them: the database would never sleep;
- with a Neon URL (`?sslmode=require&channel_binding=require`), postgres.js accepts any certificate, and passes
  `channel_binding` to the server, which then refuses the connection ("unrecognized configuration parameter").

## Decision

- **Production uses PostgreSQL only**: with `NODE_ENV=production` and no `DATABASE_URL`, the API refuses to start, with
  a clear message. PGlite is loaded on demand only, in development and tests; the Docker image does not embed it.
- **Migrations go through a dedicated command**, `node apps/api/src/migrer.ts` (`npm run db:migrate`): the deployment
  runs it in a Cloud Run Job, with the API image, before sending traffic to the new revision (US-050). In production,
  the API no longer migrates at startup and does not touch the database to start. Development and tests keep migrating
  at startup (ADR 0018).
- **A lock prevents two simultaneous migrations**: the migration runs on a single connection, under a PostgreSQL
  advisory lock (`pg_advisory_lock`), which is released with the connection, even on failure. The command reports how
  many migrations it applied.
- **The pool is small and closes its connections quickly**: at most 5 connections, an idle connection closed after
  30 s, 10 s to connect (including Neon waking up), adjustable through `BASE_CONNEXIONS_MAX`,
  `BASE_INACTIVITE_SECONDES` and `BASE_DELAI_CONNEXION_SECONDES`. It connects only on the first request that needs it,
  and closes on API shutdown (SIGTERM). Each connection closure is logged.
- **The API connects to Neon's direct endpoint**, never to the pooled endpoint (`ep-…-pooler`, PgBouncer in
  transaction mode): our pool is enough for one instance, and PgBouncer would break the session lock and require
  precautions around postgres.js prepared statements. The API refuses a `-pooler` URL.
- **The database certificate is verified**: `sslmode=require` becomes `verify-full` (certificate and host name, with
  Node's authorities; checked against Neon in Frankfurt on 2026-10-22), and `channel_binding` is removed from the URL.

## Alternatives considered

- **Migrate at startup under a lock**: no more duplicates, but every cold start would wake the Neon database, even for
  a simple availability probe, and a failed migration would be discovered on live traffic.
- **`drizzle-kit migrate` in the job**: a development tool, absent from the production image; the chosen command uses
  the `drizzle-orm` migrator, already in production, and adds the lock to it.
- **Neon's pooled endpoint** (`prepare: false`): useful with many instances or connections; pointless for one instance
  with a pool of 5, and incompatible with the session lock.
- **Neon HTTP driver** (`@neondatabase/serverless`): no persistent connection, hence no forgotten connection; but no
  interactive transaction over HTTP (`FOR UPDATE` on boosters, duel concurrency), a second driver to maintain and
  Neon-specific code. Kept in reserve if measurement in production shows connections staying open.
- **Keep PGlite as a fallback in production**: rejected by the review (ephemeral and diverging databases).

## Consequences

- The deployment (US-050) runs the migration job **before** deploying the revision; a migration must stay compatible
  with the version still live (add, deploy, then remove). If the job fails, the deployment stops and the old revision
  keeps serving.
- Neon's suspension relies on the postgres.js idle timer, whereas Cloud Run only allocates CPU during requests: to be
  measured in production (procedure in US-046). Failing that, shutting down the idle instance closes the pool, but
  later.
- After a pause, the first request pays for opening a TLS connection (and Neon waking up); later ones reuse the
  connection as long as it is useful.
- Moving to Cloud SQL (ADR 0021) only requires changing `DATABASE_URL`: nothing in the code is specific to Neon, apart
  from the refusal of a `-pooler` URL.
