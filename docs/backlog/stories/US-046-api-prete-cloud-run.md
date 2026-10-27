# US-046 — An API ready for Cloud Run

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-046-api-prete-cloud-run`

## Story

As the **project owner**, I want **a Docker image of the API that starts, connects to the Neon database, lets that
database go to sleep, shuts down cleanly and logs what it should** so that **I can deploy it on Cloud Run without
surprises and at no cost (ADR 0021)**.

## Context

Review of 2026-10-22 ([review](../../revues/2026-10-22-revue-mise-en-ligne.md)), findings verified in the code:

- the API listens on `127.0.0.1` by default and reads only `API_PORT`, whereas Cloud Run injects `PORT` (`config.ts`);
- no `Dockerfile` nor `.dockerignore`; `config.ts` loads `.env` if it exists, which a `COPY . .` would embed;
- without `DATABASE_URL`, the API falls back **silently** on PGlite: in production, each instance would have its own
  ephemeral database;
- the custom error handler (`app.ts`) replaces Fastify's, the only one that logs: **a 500 error leaves no trace**;
- no `SIGTERM` listener: Cloud Run cuts the requests in flight and the pool is never closed;
- default postgres.js pool: 10 connections, **never closed**. Yet the free Neon database (ADR 0021) does not go to
  sleep as long as a connection stays open, and its quota is counted in compute hours: forgotten connections would
  consume it even when nobody is playing;
- migrations applied at startup, without a lock: two instances starting together run them twice;
- pino logs (numeric `level`, `msg`) that Cloud Logging files all under the "DEFAULT" severity.

## Acceptance criteria

- [x] **Given** the `PORT` variable, **when** the API starts in a container, **then** it listens on `0.0.0.0:$PORT`
      (development keeps `127.0.0.1:3000`).
- [x] **Given** the multi-stage `Dockerfile` built from the monorepo root, **then** the image contains only the API,
      `packages/domain` (workspace link preserved, Node refusing TypeScript under `node_modules`), the migrations and
      the production dependencies; it runs `node apps/api/src/server.ts` without `npm`, under a non-root user;
      `.dockerignore` excludes `.env`, `.donnees`, the test reports and `.claude`.
- [x] **Given** the Neon database URL supplied by Secret Manager, **then** the API connects to it over TLS
      (`sslmode=require`), preferably on the direct endpoint: Neon's pooled endpoint (PgBouncer in transaction mode)
      requires precautions on postgres.js prepared statements, to be checked if it is chosen.
- [x] **Given** production, **when** the PostgreSQL connection is not configured, **then** the API refuses to start
      with a clear message; PGlite is loaded only in development and in tests.
- [x] **Given** a 500 error, **then** it is logged with its message and its stack trace (backed by a test), without
      token, code or request body.
- [x] **Given** a `SIGTERM`, **then** the API refuses new requests, finishes those in flight, closes the pool and
      stops before the Cloud Run deadline.
- [x] **Given** the postgres.js pool, **then** its size (small), its idle timeout (short) and its connection timeout
      are configurable; **when** no more requests arrive, **then** all connections close and the Neon database goes to
      sleep in under 10 minutes (measured in production, including with Cloud Run's CPU allocated only during
      requests). If connections stayed open, one lead is Neon's HTTP driver for reads, to be evaluated in the story.
      _Verified locally (connection closed at the end of the idle timeout); the measurement in production, impossible
      before the first deployment, is taken over by US-050 following the procedure below._
- [x] **Given** a dedicated migration command (run by a Cloud Run Job, US-050), **then** production no longer migrates
      at startup; development and tests keep migrating at startup (ADR 0018).
- [x] **Given** the logs in production, **then** they are JSON lines with `severity`, `message` and the request trace
      (`X-Cloud-Trace-Context`); the level is configurable (`LOG_LEVEL`).
- [x] The image starts locally against the PostgreSQL of `docker-compose.yml` and passes the `/api/v1/sante` probe.

## Notes

- Decision: [ADR 0023](../../decisions/0023-postgresql-production.md) (completes ADR 0018) — production on PostgreSQL
  only, migrations by a dedicated command under a lock, short pool, Neon direct endpoint, verified certificate.
- The `"@hipmaster/domain": "*"` dependency resolves only in the workspace: always build the image from the root of the
  repository.
- `node --watch` in development: see US-045.

## Implementation

- `config.ts`: `lireConfig()` reads and validates the environment (`PORT`, `NODE_ENV`, `LOG_LEVEL`, pool,
  `GOOGLE_CLOUD_PROJECT`) and raises an explicit error; `chargerEnv()` reads `.env` only outside production.
- `journaux.ts`: pino logger in Cloud Logging format (`severity`, `message`, ISO time), stack trace in `stack_trace`
  (Error Reporting, US-051), errors reduced to their type, message, code and cause (never the parameters of an SQL
  query), trace fields taken from `X-Cloud-Trace-Context`.
- `app.ts`: logger and trace per request; the error handler logs 500s (message and stack) and keeps only the code of a
  rejected request.
- `arret.ts`: clean shutdown on SIGTERM and SIGINT; during shutdown, each response closes its connection, without which
  a keep-alive connection (72 s in Fastify) held the shutdown until the guard timeout, without closing the pool (flaw
  found by the test).
- `db/index.ts`: PGlite imported on demand (and moved to a development dependency); configurable pool that logs each
  closed connection; `urlPostgres()` (verified TLS, `channel_binding` removed); `migrerPostgres()` under an advisory
  lock. `migrer.ts`: the migration command, also `npm run db:migrate`.
- Multi-stage `Dockerfile` and allow-list `.dockerignore`; Dependabot watches the base image.

## Verifications

Done on 2026-10-22, image built on the machine (Docker 29.1.3) against the PostgreSQL 18 of `docker-compose.yml`:

- 294 MB image, of which 43 MB of dependencies: the API, `packages/domain`, the migrations; neither PGlite (it needs
  `--omit=optional`, otherwise it comes in as an optional peer of drizzle-orm: 77 MB), nor `.env`, nor tests; `node`
  user;
- without `DATABASE_URL`: a `CRITICAL` line "Configuration invalide … obligatoire en production", exit code 1;
- `node apps/api/src/migrer.ts` on an empty database: "8 appliquée(s), 8 au total", then "0 appliquée(s)";
- the API listens on `0.0.0.0:8080`; no connection to the database at startup nor for `/api/v1/sante`; an account
  creation opens a connection, closed 5 s after the last request with `BASE_INACTIVITE_SECONDES=5` (log
  "Connexion PostgreSQL fermée");
- `docker stop` (SIGTERM) with a keep-alive connection open: shutdown in 0.8 s, pool closed, exit code 0;
- against Neon (Frankfurt), with a dummy endpoint: the certificate verification succeeds, only authentication fails;
- two simultaneous migrations on PostgreSQL: one applies everything, the other nothing; without the lock, the second
  fails (test `db/index.test.ts`, which runs when `DATABASE_URL` is set, see US-056).

## Checking Neon's sleep in production

Cloud Run allocates the CPU only during requests: the timer that closes an idle connection may run late. To be
measured at the first deployment (US-050):

1. Play a few actions, then note the time of the last request and send nothing more (no open tab, no availability
   check that would touch the database: `/api/v1/sante` does not touch it).
2. In Cloud Logging, search for `jsonPayload.message="Connexion PostgreSQL fermée"`: the last closing must follow the
   last request by about 30 s (`BASE_INACTIVITE_SECONDES`).
3. Ten minutes after the last request, `neonctl operations list --project-id <project> --output json` must show a
   `suspend_compute` operation later than the last closing (or the Neon console, Monitoring tab: compute suspended).
4. If a connection stays open for more than 5 minutes: close it when no request is in flight any more, or switch the
   reads to Neon's HTTP driver (ADR 0023, alternatives).

## Log

- 2026-10-22 — created, from the review before going live (ADR 0021).
- 2026-10-22 — taken on (batch 1, API session); ADR 0023 written; image verified against the local PostgreSQL and
  verified TLS against Neon; the measurement of Neon's sleep in production is taken over by US-050.
- 2026-10-22 — delivered: Docker image of the API (without PGlite or .env, non-root), listens on 0.0.0.0:$PORT, JSON Cloud Logging logs with trace and 500 errors logged without sensitive data, clean shutdown on SIGTERM, short pool and verified certificate, migrations by a dedicated command under a lock (ADR 0023); image verified against the local PostgreSQL, measurement of Neon's sleep in production taken over by US-050
