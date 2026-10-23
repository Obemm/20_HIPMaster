# 0035 — Expiring sessions and a nightly purge of technical data only

- **Date**: 2026-10-24
- **Status**: Accepted
- **Completes**: [0017](0017-compte-invite.md) and [0025](0025-protections-api.md) (sessions), applies the durations
  of [0031](0031-suppression-compte.md); clarifies [0019](0019-boosters-recharge-a-la-lecture.md),
  [0020](0020-duels-asynchrones.md) and [0030](0030-parties-bot-en-base.md) ("no background task" in the API)

## Context

The review of 2026-10-22 (US-054) found that nothing is ever deleted: sessions do not expire (a stolen token, kept by
the browser, ADR 0017, gives permanent access), and challenges never accepted, abandoned games against the bot and
forgotten sessions pile up. The "About and privacy" page (US-053, ADR 0031) nevertheless announces durations, marked
"soon".

The project owner decided on 2026-10-23: **accounts, their collections, their rewards and results (the future scores,
US-069) are kept with no limit**, unless the player deletes their account. Only technical data expires: sessions
unused for 90 days, challenges never accepted for 7 days (US-033), games against the bot abandoned for 24 hours
(ADR 0030).

Constraints: the free Neon database counts its compute hours and sleeps after 5 minutes without a connection
(ADR 0021, 0023); the API does nothing outside requests (CPU allocated during requests only, ADR 0028); two of the
three free Cloud Scheduler tasks are already used (backup and consumption report, ADR 0033).

## Decision

### Sessions

- **A session expires after 90 days without use** (`SESSIONS_DUREE_JOURS`, configurable): the `sessions` table gains
  `utilisee_le`. An expired session is refused like an unknown session (**401** "missing or expired session"); the
  player signs back in with their recovery code, their account is intact.
- **Each use extends the session**, with **at most one write per day per session**: checking the token remains a
  simple read for almost all requests.
- Migration compatible with the live version: a column added with a default value (`now()`), which existing sessions
  receive at the moment of the migration, and an index for the purge.

### Purge

- **One command**, `node apps/api/src/purger.ts`, deletes in a single pass: games against the bot with no move for
  24 hours, challenges (private or open) never accepted for 7 days, and expired sessions (with the games they had
  started). It logs what it deleted, by kind.
- **It never touches** an account, a collection, a reward or a duel that has started, ongoing or finished: a test
  checks this, on an account inactive for years and ten years later. The full state of finished duels (11 to 18 KB
  each) **is not slimmed down**: it is the score history, and the volume stays low (1,000 duels take less than
  20 MB, against 1 GiB at Neon).
- **In production, a Cloud Run Job** `hipmaster-purge`, with the **API image** (the purge code follows the schema)
  and its **own service account**, which only reads the database URL. **Cloud Scheduler** launches it every night at
  **5:25** (Paris), five minutes before the backup: a single database wake-up for both, and an already slimmed
  backup. It is the third and last free scheduled task. Its failures join the operations jobs alert (ADR 0033).
- **Continuous deployment keeps the job up to date but never creates it**: its creation (`deployer.sh purge` from a
  workstation) and its scheduling (`infrastructure.sh`) are actions of the project owner (operations guide).
- Expirations evaluated on read (expired challenge, game expired as 404, duel forfeit, ADR 0020, 0030) remain the
  rule of the game; the purge only frees space. The API still has **no background task**.

## Alternatives considered

- **Purging in the API**, as requests come in (like games at their creation, ADR 0030): no extra resource, but a
  player's request would pay for the purge, and nothing runs through days without traffic. Kept for games (cap),
  rejected as a general mechanism.
- **A timer in the API** (`setInterval`): Cloud Run only allocates CPU during requests and stops the idle instance;
  the timer would not run, or would keep the database awake. Rejected.
- **`pg_cron` at Neon**: no log in Cloud Logging nor alert, and a provider-specific extension. Rejected.
- **Absolute expiry** (90 days after sign-in, even when playing every day): simpler, but a loyal player would have to
  re-enter their code every three months. Rejected in favour of inactivity, fairer for a stolen token and for a
  regular player alike.
- **Writing `utilisee_le` on every request**: one more write per request, and as many database wake-ups for nothing.
  One per day is enough for a duration counted in days.
- **Deleting inactive accounts**, or **emptying the state of finished duels**: contrary to the project owner's
  decision (scores kept). Rejected.
- **Creating the job through continuous deployment**: more automatic, but one more resource and scheduled task that
  touch data, without an explicit action from the project owner. Rejected.

## Consequences

- A stolen token is only worth something while it is in use; "Sign out my other devices" (ADR 0025) remains the
  immediate remedy.
- A player absent for more than 90 days signs back in with their code: their cards, rewards and duels await them.
  Without a code, their account stays in the database, inaccessible, until they find it again: the game does not
  delete it.
- The privacy page no longer says "soon": changing a duration means changing the purge **and** the page.
- All the free Cloud Scheduler tasks are taken: a fourth would cost $0.10 per month.
- As long as the project owner has not created the job, the API already applies session expiry, but nothing is
  deleted.
