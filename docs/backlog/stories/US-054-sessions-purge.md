# US-054 — Sessions that expire and data that does not pile up

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-054-sessions-purge`

## Story

As the **project owner**, I want **unused sessions to expire and outdated data to be deleted** so that I can **limit
the effect of a stolen token, keep the promise of the privacy page and keep a small, fast database**.

## Context

Review of 2026-10-22: nothing is ever deleted. Sessions do not expire (the 401 message nevertheless speaks of an
"expired" session), and abandoned accounts, expired challenges, finished duels (with their full state of 11 to 18 KB)
and rewards pile up endlessly. The token is kept in the browser (ADR 0017): a stolen token gives permanent access.

## Acceptance criteria

- [x] **Given** a session unused for a configurable duration (90 days by default), **then** it is refused (401); each
      use extends the session (at most one write per day and per session).
- [x] **Given** the written retention policy (durations per type of data, restated in the privacy page, US-053, ADR
      0031), **when** the purge runs, **then** it deletes expired sessions, challenges never accepted (7 days), expired
      games against the bot, and can lighten the full state of duels finished long ago.
- [x] **Given** an account, even inactive for years, **then** the purge **never** deletes the account, its collection,
      its rewards, or the history useful for scores (US-069): of a finished duel, at least the winner, the two players,
      the reason for the end and the date remain, even when the full state is lightened. Only the player deletes their
      account (US-053).
- [x] **Given** production, **then** the purge runs every night (Cloud Scheduler and Cloud Run Job, no background task
      in the API) and logs what it deleted.
- [x] Tests of the purge on a test database, injected clock.

## Design

ADR [0035](../../decisions/0035-purge-donnees-techniques.md).

- **Sessions**: column `sessions.utilisee_le` (migration `0012_sessions_utilisees`, add-only, default value `now()`,
  index for the purge). `joueurDuJeton` refuses a session unused for `SESSIONS_DUREE_JOURS` (90 by default) and
  extends it at most once a day. All routes go through it (`exigerJoueur`, games, administration) with the settings
  set by `construireApp` (`sessions`). Contract `comptes.yaml` 1.5.0.
- **Purge** (`apps/api/src/purge/purge.ts`, command `apps/api/src/purger.ts`, `npm run purge -w apps/api`): games
  against the bot with no move for 24 hours, challenges never accepted for 7 days, expired sessions (and their games);
  summary logged by kind. Never the `joueurs`, `collection`, `recompenses` tables, nor a duel that has started.
- **Lightening finished duels**: not retained. The full state carries the scores history (US-069) and the volume
  remains low; `lireMesDuels` therefore does not have to change.
- **Production**: Cloud Run job `hipmaster-purge` (API image, `hipmaster-purge` account that reads only
  `database-url`), launched at 5:25 (Paris) by Cloud Scheduler, five minutes before the backup (a single wake-up of
  Neon). `infrastructure.sh` (step 17) creates the account, its right and the scheduled task, and adds the job to the
  jobs alert; `deployer.sh purge` creates or updates the job; the deployment workflow only updates it if it exists.
  Going live: the project owner's agreement (operations guide, "Purge des données techniques").
- **`/confidentialite` page**: no more "soon"; it says that technical data is erased every night.

## Notes

- Decision of the project owner (2026-10-23): "player accounts, their collections and the scores must also be kept".
  No more deletion of inactive accounts. Only technical data expires: sessions unused for 90 days (the player signs in
  again with their code), technical logs and backups 30 days (Cloud Logging default retention, US-051), abandoned
  games against the bot (24 hours, ADR 0030: a reward won stays acquired), challenges never accepted.
- Lightening a finished duel: keep in columns (or a summary) what "My duels" and the future scores read before
  emptying `etat`, then adapt the reads that extract it from the JSON today (`lireMesDuels`).
- The indexes needed by the purge are set in US-057; that of `sessions.utilisee_le` comes with its column.
- **Going live**: the code, scripts and guide are delivered, but the purge will run every night only after the
  commands of the operations guide ("Mettre la purge en service"), launched with the project owner's agreement.
  Session expiry, for its part, applies from deployment.

## Log

- 2026-10-22 — created, from the review before going live.
- 2026-10-23 — decision of the project owner: accounts, collections and scores kept without limit; the purge touches
  only technical data (updated since US-053).
- 2026-10-24 — refined and started (branch cut from US-058): session expiry on read, purge through a dedicated command
  and a scheduled Cloud Run job, ADR 0035. No GCP command run: going live awaits the project owner's agreement.
- 2026-10-24 — delivered: sessions refused after 90 days without use (SESSIONS_DUREE_JOURS), extended at most once a day; purge of abandoned games against the bot, challenges never accepted and expired sessions through a dedicated command, never an account, a collection, a reward nor a duel that has started (test on an account inactive for years, ten years later); Cloud Run job hipmaster-purge and 5:25 Cloud Scheduler task in the GCP scripts, going live submitted to the project owner; privacy page without "soon"; ADR 0035
- 2026-10-24 — purge put live in production by the project owner (`infrastructure.sh`, `deployer.sh purge`): first run
  succeeded (0 session, 0 challenge, 0 game deleted), scheduled task "25 5 * * *" (Europe/Paris) active.
