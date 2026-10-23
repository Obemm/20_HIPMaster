# 0033 — Monitoring and backups: Cloud Monitoring alerts, operations jobs, errors through the log

- **Date**: 2026-10-23
- **Status**: Proposed
- **Completes**: [0021](0021-hebergement-gcp.md) (hosting, nightly backup, Neon quota tracking),
  [0024](0024-infrastructure-script-gcloud.md) (infrastructure by script) and
  [0028](0028-deploiement-continu.md) (deployment)

## Context

ADR 0021 promises, before inviting colleagues: an alert when the game goes down, a nightly backup whose restoration
is tried (Neon Free history only covers 6 hours), tracking of the Neon quota (100 CU-hours per month, database
suspended until the following month if it is used up) and errors in Error Reporting. Constraints:

- **never wake the database at regular intervals**: a connection every 15 minutes would stop it from going to sleep
  and would use up the quota;
- **€0**: Cloud Scheduler offers 3 free tasks per billing account (backup, consumption report, and the purge of
  US-054); Cloud Monitoring will bill its alerts from 1 September 2027 ($0.35 per month per condition), except those
  on uptime checks, which stay free;
- everything goes through the scripts (ADR 0024, 0028), with no key or email address in the public repository
  (ADR 0022);
- the API image is purged beyond 2 versions (US-049): a job that kept it would stop starting.

## Decision

| Need                 | Choice                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Availability         | Cloud Monitoring uptime check on `https://hipmaster.web.app/api/v1/sante` (route without database), every 15 minutes from 3 regions; alert when 2 regions out of 3 fail two rounds in a row             |
| Backup               | Cloud Run job `hipmaster-sauvegarde`, every night at 5:30 (Paris): `pg_dump --format=custom`, archive checked (signature, data of `joueurs` and `collection`), then stored in the bucket (30 days)      |
| Neon consumption     | Cloud Run job `hipmaster-consommation`, every morning at 8:00: the month's counters read from the **Neon API** (never the database), with an organisation key limited to the project; WARNING above 70% |
| Job alerts           | **A single** alert on the logs: WARNING or ERROR from one of the two jobs, or ERROR from one of their scheduled tasks → one email, at most one per hour                                                 |
| API errors           | ERROR log with `stack_trace` (US-046), which Error Reporting reads without configuration                                                                                                                |
| Front-end errors     | Angular error handler → `POST /api/v1/erreurs` (30 per hour per address, 5 per page at most) → log in `ReportedErrorEvent` format, service `hipmaster-web`; no token or URL parameters                  |
| Jobs image           | `exploitation` image (Node 24 and PostgreSQL 18 client), tagged with the Git fingerprint of `scripts/exploitation`: rebuilt only when these sources change, so never purged while in use                |
| Accounts and rights  | One service account per job; the backup reads the database secret and **adds** objects to the bucket (`objectCreator`: no read, replace or delete); each account only runs its own job                  |
| Restoration          | `scripts/gcp/restaurer.sh`: temporary Neon branch, empty database, `pg_restore`, count of accounts and collections, then deletion of the branch                                                         |
| Security scan (DAST) | Baseline OWASP ZAP (`zap-baseline.py`, Docker) on the live site, before opening then at each major version; accepted alerts justified in the story                                                      |

`scripts/gcp/infrastructure.sh` creates the accounts, rights, secret, scheduled tasks, email channel, check and
alerts; `scripts/gcp/deployer.sh exploitation`, the last step of the deployment, builds the image if needed and
updates the two jobs. The alerts address comes in through the environment (`HIPMASTER_ALERTES`, the Google account by
default).

## Alternatives considered

- **Consumption report through an SQL query or a probe on the database**: would wake the database. Rejected.
- **Backup and report in one job**: would free a scheduled task, but a failure of one would deprive us of the other,
  and the report does not need to read the database. Rejected.
- **The jobs in the API image**: a single image, but purged after two deployments, and `pg_dump` shipped with the
  API. Rejected.
- **A Docker Hub image (`postgres:18`) and a script passed as an argument**: no image to build, but an untested
  shell script and a production dependency on Docker Hub. Rejected.
- **One alert per job, or a metric of failed executions**: finer, but two more conditions to pay for in 2027 for a
  message that the log details anyway. Rejected.
- **Error Reporting through its client library in the front end**: would need a public API key in the site. Rejected
  in favour of the API route, rate-limited.
- **Uptime Kuma, Better Stack or another external service**: one more account, and the database gains nothing from
  it. Rejected.

## Consequences

- **Cost**: 8,640 check executions per month (1 million free); two jobs of a few seconds per day, within Cloud Run's
  free quotas; a few megabytes of archives. From September 2027, the alert on the logs will cost $0.35 per month: to
  review then (budget of €1).
- **Database wake-ups**: only one per day, the backup's, which checks at the same time that the database responds.
  The uptime check wakes the API (Cloud Run), never the database.
- **Creation order**: the jobs are born at deployment; the infrastructure script, run again afterwards, gives the
  scheduled tasks the right to launch them (it reports it as long as they are missing).
- **Neon API key**: created once by the script, never displayed; limited to the project, it can nevertheless
  administer its branches. It is revoked in the Neon console.
- **Restoration**: manual, from a workstation with Docker; tried once before opening (US-051).
- **Front-end errors**: minified stack traces, the source maps staying outside the published site; the version is
  the name of the main script (`main-XXXXXXXX`).
