# US-051 — Monitoring, verified backups and security scan

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: S
- **Branch**: `us-051-supervision-sauvegardes-securite`

## Story

As the **project owner**, I want **to be warned when the game goes down, to know how to restore the database and to
have checked the obvious flaws** so that I can **invite my colleagues with peace of mind**.

## Acceptance criteria

- [x] **Given** the live site, **then** a Cloud Monitoring uptime check queries `/api/v1/sante` every 15 minutes, and an
      outage that lasts sends me an e-mail. This route **does not touch the database**: waking it at each check would
      keep it from going to sleep and exhaust the free Neon quota (ADR 0021).
- [x] **Given** the consumption of the Neon database, **then** it is read every day (compute hours, storage), and an
      e-mail alerts me when it exceeds 70% of the month's free quota.
- [x] **Given** a 500 error of the API, **then** it appears in Error Reporting with its stack trace, with no token,
      recovery code or request body in the log.
- [x] **Given** an unhandled JavaScript error in a player's browser, **then** it is sent (message, page, version) to a
      rate-limited API route, and appears in Error Reporting; source maps stay out of the published site.
- [x] **Given** the Neon database, **then** a Cloud Run job triggered every night by Cloud Scheduler makes a compressed
      `pg_dump` of it into the backup bucket (30 days kept), and its failure sends me an e-mail: it is also the daily
      check that the database answers.
- [x] **Given** a backup, **when** I follow the restoration procedure of the operations guide, **then** it is restored
      into a temporary Neon branch, the accounts and collections are found there, then the branch is deleted.
      Procedure tried once.
- [x] **Given** the live site (or an identical environment), **when** a baseline OWASP ZAP scan runs, **then** no
      high-level alert is left unanswered; accepted alerts are justified in the story.

## Notes

- DAST: a baseline scan before opening, then at each major version (ADR 0021).
- Neon Free's restore history covers only 6 hours: hence the backup of each night.
- Cloud Scheduler offers 3 free tasks: backup, purge (US-054) and consumption reading.
- Cloud Logging logs are kept 30 days by default: duration to be restated in the privacy page (US-053).
- Decision: [ADR 0033](../../decisions/0033-supervision-sauvegardes.md) (completes ADRs 0021, 0024 and 0028).
- **Availability**: Cloud Monitoring check "HIPMaster : santé de l'API" on `https://hipmaster.web.app/api/v1/sante` (the
  route does not touch the database), every 15 minutes from Europe, South America and Asia; alert "HIPMaster : site
  indisponible" when 2 regions out of 3 fail two rounds in a row (≈ 20 minutes). Alerts on uptime checks remain free
  after September 2027.
- **Operations jobs**: `exploitation` image (Node 24.22 and PostgreSQL 18.6 client, `scripts/exploitation/`), tagged
  with the Git fingerprint of its sources, built and deployed by the last step of the deployment
  (`deployer.sh exploitation`). One service account per job; each account runs only its job.
- **Backup**: `pg_dump --format=custom --compress=9`, three attempts to let the database wake from sleep, archive
  verified (`PGDMP` signature, data of the `joueurs` and `collection` tables in the table of contents), sent without
  being able to overwrite (`ifGenerationMatch=0`, `objectCreator` right only) with CRC32C check. At 5:30, Paris time:
  outside Neon's maintenance window (Thursday, 2 a.m. to 3 a.m. UTC).
- **Consumption**: read from Neon's API (`compute_time_seconds` of the project, `logical_size` of the branches), never
  from the database; Neon organisation key limited to the project (`neon-cle-api` secret). Observed on 2026-10-23:
  1,963 s of compute for 7,764 s of activity, i.e. 0.25 CU; 1 GiB limit per branch read from the project.
- **A single alert on the logs** for the two jobs and their scheduled tasks (WARNING or ERROR): $0.35 per month from
  September 2027, to be reviewed then.
- **Front end errors**: `RapporteurErreurs` replaces Angular's `ErrorHandler` (which also receives window errors) and
  sends through `fetch` (without token or interceptor) message, stack, page path and version (script name
  `main-XXXXXXXX`); at most 5 errors per page, no duplicate nor HTTP response. `POST /api/v1/erreurs` (contract
  `erreurs.yaml`, 30 per hour and per address) logs a `ReportedErrorEvent` of the `hipmaster-web` service. Source
  maps: absent from the production build (Angular's default configuration), hence outside the published site.
- **500 errors of the API**: already logged with `stack_trace`, without token, code or body (US-046,
  `journaux.test.ts`).
- **Restoration**: `scripts/gcp/restaurer.sh` (temporary Neon branch, empty database, `pg_restore` in the jobs image
  built on the machine, count, deletion of the branch).
- The SonarJS lint refuses MD5, even for an integrity check: CRC32C, which Cloud Storage also verifies on receipt.

## Online trials (2026-10-23, with the project owner's agreement)

- **Infrastructure**: `infrastructure.sh` created 15 items (2 service accounts, rights, `neon-cle-api` secret, 2
  scheduled tasks, e-mail channel, uptime check, 2 alerts), then, after the first deployment of the jobs, the rights of
  the scheduled tasks. Two more passes: stable (the two defects found on the way are fixed: JSON body with accents
  garbled by Windows, bucket rights misread). The machine's professional configuration intact.
- **Jobs**: `exploitation` image pushed (separate package: the API images did not move), jobs created by
  `deployer.sh exploitation`.
- **Consumption**: "0,5 h-CU sur 100 (0,5 %, 4,9 prévues sur le mois), stockage 38 Mo sur 1 024 Mo (3,7 %)".
- **Backup**: `hipmaster-2026-10-23T20-48-38Z.dump`, 14,523 bytes, 19 s run, database woken once.
- **Restoration** (`restaurer.sh`): branch `restauration-20261023-204943`, empty database, archive restored in 9 s;
  found: 1 account, 1 session, 34 collection rows, 1 reward, 2 invitations, 0 duels; branch deleted.
- **Alerts**: the first two failed runs (Neon project not named, token address) wrote their ERROR in the log, which
  triggers the "Neon backup or consumption" alert: real trials of the e-mail.
- **Error Reporting**: an error written in the format of the `POST /api/v1/erreurs` route appears in a group of the
  `hipmaster-web` service. The route itself goes live with the merge.

## Baseline OWASP ZAP scan (2026-10-23)

`zap-baseline.py` (image `ghcr.io/zaproxy/zaproxy:stable`, classic and Ajax spider, 2 minutes) on
`https://hipmaster.web.app`: 72 addresses, **no high or medium alert**, 0 failures, 57 rules passed.

| Alert (ZAP)                                      | Risk          | Response                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict-Transport-Security Header Not Set [10035] | low           | Accepted: only the API's 404 responses relayed by Firebase Hosting lack it (`GET /api/v1/joueurs`, `/sessions`); all the others carry it (`max-age=31556926; includeSubDomains; preload`), and the `.app` domain is in the browsers' preloaded HSTS list: no clear-text connection is possible. |
| Timestamp Disclosure - Unix [10096]              | low           | False positive: numbers in the minified Angular script (`main-….js`), not server dates.                                                                                                                                                                                                         |
| Re-examine Cache-control Directives [10015]      | informational | Intended: `no-cache` on `index.html` and the Angular routes (revalidated at each visit), `public, max-age` on the API catalogue (US-057).                                                                                                                                                       |
| Retrieved from Cache [10050]                     | informational | Intended: fingerprinted files served by Firebase's CDN with a one-year cache (`immutable`).                                                                                                                                                                                                     |
| Modern Web Application [10109]                   | informational | Finding: Angular application; the Ajax spider was used.                                                                                                                                                                                                                                         |

## Log

- 2026-10-22 — created, from the review before going live (ADR 0021).
- 2026-10-23 — delivered: uptime check of /api/v1/sante every 15 minutes and e-mail alert; nightly Cloud Run backup job (verified pg_dump to gs://hipmaster-sauvegardes) and Neon consumption reading job (alert at 70%), scheduled by Cloud Scheduler; front end errors to Error Reporting through POST /api/v1/erreurs; restoration tried in a temporary Neon branch; baseline ZAP scan with no high or medium alert (ADR 0033)
