# 0021 — Near-zero-cost hosting: Firebase Hosting, Cloud Run and Neon PostgreSQL

- **Date**: 2026-10-22
- **Status**: Accepted (by the project owner, on 2026-10-22)
- **Supersedes**: [0008](0008-hebergement-azure.md) (Azure)

## Context

The project owner wants to put HIPMaster online in **their personal Google Cloud space**, for the integration team and
colleagues **by invitation**: a few dozen players, little traffic, nothing financial at stake. A first version of this
ADR proposed Cloud SQL (≈ €10 to 12 per month); the project owner judged it **too expensive for a personal exercise**
and asked for a cheaper solution that Claude could **manage end to end** (2026-10-22). ADR 0008 targeted Azure, and
nothing had been deployed there.

What the application needs:

- a **static** Angular front end that calls the API with relative URLs (`/api/v1/…`);
- a Fastify API (Node 24, native TypeScript) with no state, except the games against the bot kept in memory (ADR 0014,
  a single instance);
- a **PostgreSQL** database (ADR 0003, 0018), a few megabytes in size;
- 2.5 MB of static illustrations (ADR 0015, 0016).

The project owner's workstation already has `gcloud`, the Firebase CLI and Docker; their personal Google account has a
billing account open. Free quotas noted on 2026-10-22 (per month):

- **Cloud Run**: 2 million requests, 180,000 vCPU-seconds, 360,000 GiB-seconds;
- **Firebase Hosting**: 10 GB stored and 360 MB transferred per day;
- **Neon Free**: 1 GB of storage and 100 CU-hours per project, suspended after 5 minutes of inactivity, 6-hour restore
  history, no credit card;
- **Artifact Registry** 0.5 GB, **Secret Manager** 6 versions, **Cloud Logging** 50 GiB, **Cloud Scheduler** 3 jobs.

## Decision

A **dedicated Google Cloud project** (`hipmaster`) on the project owner's personal account, and a free Neon database.
The API and the database are in **Frankfurt**, as close to each other as possible, because every API request queries
the database several times.

| Need                     | Service                                                           | Main settings                                                                                                                                                                              | Cost |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| Front end, URL, TLS, CDN | **Firebase Hosting**                                              | Angular build; `/api/**` rewritten to Cloud Run; fallback to `index.html`; security headers (CSP, HSTS…); long cache on fingerprinted files; address `hipmaster.web.app`                   | €0   |
| API                      | **Cloud Run** (`europe-west3`, Frankfurt)                         | Node 24 Docker image; 1 vCPU, 512 MiB; per-request billing; 0 minimum instances; **1 maximum instance** as long as ADR 0014 holds; listens on `0.0.0.0:$PORT`; clean shutdown on `SIGTERM` | €0   |
| Database                 | **Neon Free** (managed PostgreSQL, AWS `eu-central-1`, Frankfurt) | compute capped at 0.25 CU; TLS connection; suspended after 5 minutes without an open connection                                                                                            | €0   |
| Migrations, backups      | **Cloud Run Jobs** and **Cloud Scheduler**                        | migrations run by the deployment before traffic is switched; `pg_dump` every night to **Cloud Storage** (30 days kept)                                                                     | ≈ €0 |
| Images, secrets          | **Artifact Registry**, **Secret Manager**                         | last 2 images kept; the database URL is a secret, never in the repository                                                                                                                  | €0   |
| Logs, alerts             | **Cloud Logging**, **Error Reporting**, **Monitoring**            | JSON logs with `severity`; uptime check and e-mail alert; monitoring of Neon consumption                                                                                                   | €0   |
| Deployment               | **GitHub Actions** + **Workload Identity Federation**             | on merge into `main`, after CI; no service account key stored                                                                                                                              | €0   |
| Safeguards               | **Billing budget**                                                | alert from €1; Cloud Run instance cap                                                                                                                                                      | €0   |

Target cost: **€0**, give or take a few cents (backup storage, egress traffic). Everything is driven from the command
line (`gcloud`, Firebase CLI, `neonctl`): Claude can install, deploy and maintain everything. The only manual step:
creating the Neon account (free) and the project owner authorising the CLI.

## Alternatives considered

- **Cloud SQL for PostgreSQL** (db-f1-micro, ≈ €10 to 12 per month): a managed database inside GCP, with no hours
  quota, but too expensive for a personal exercise (project owner's decision, 2026-10-22). It remains the target if the
  game grows: only the connection variable changes.
- **PostgreSQL on a free e2-micro VM**: €0 and everything in GCP, but the free tier exists only in the United States
  (data outside the EU, ≈ 100 ms more per request), with 1 GB of memory, and the system, PostgreSQL, patches and
  backups would all be ours to maintain. Rejected: more work and risk for the same price.
- **Firestore**: free at small scale, but the whole persistence layer would have to be rewritten (contrary to ADR 0003
  and 0018). Rejected.
- **PGlite in the container, backed up to Cloud Storage**: free, but a single instance, possible losses between two
  backups and no lock against two simultaneous instances. Rejected.
- **Cloud Run alone, also serving the front end**: one deployment fewer, but no CDN, a first display that waits for the
  container to start, and a hard-to-read `run.app` address. Rejected.
- **Load balancer and Cloud CDN**: ≈ $18 per month for the forwarding rule alone. Rejected.
- **Azure (ADR 0008)**: the project owner has a GCP space. Rejected.

## Consequences

- **Keep the database suspended when nobody is playing**: the free Neon quota (100 CU-hours per month, i.e. about
  13 hours of activity per day at 0.25 CU) is exceeded if the database never sleeps. An open connection prevents it
  from suspending: the API closes its unused connections quickly, and the front end stops its periodic polling when the
  tab is hidden or the player is inactive. If the quota were exhausted, the database would be suspended until the
  following month: consumption is monitored and triggers an alert well before.
- **Wake-up time**: after a pause, the first request waits for Cloud Run to start (1 to 3 s) and for the database to
  wake up (a few hundred milliseconds). The front end announces it ("Loading…", new attempt).
- **Backups**: Neon's 6-hour history is not enough; a `pg_dump` backup goes to Cloud Storage every night, and its
  restoration is tested.
- **A second provider** (Neon) besides Google: free account, no credit card. The code stays standard PostgreSQL, and
  moving to Cloud SQL only requires changing the connection variable.
- **Isolated project**: the `hipmaster` project lives on the project owner's personal account, administered through a
  dedicated `gcloud` configuration. The workstation's professional `gcloud` configuration is never used for this
  project.
- **Accepted deviation from the reference** (ADR 0005): Azure is irrelevant for a personal project outside any company
  information system. Logs go to Cloud Logging and Error Reporting, illustrations are served as static files by Firebase
  Hosting, and a basic DAST scan runs before opening.
- **ADR 0014**: as long as the games against the bot live in memory, Cloud Run stays at one instance, and a deployment
  or a scale-down to zero erases them; persisting them in the database lifts this limit (EPIC-09).
- **Firebase Hosting** relays the `Authorization` header (ADR 0017) but no cookie except `__session`, and cuts a relayed
  request after 60 s, far beyond the 3 s response target of a front-end API. Its **CSP** (without `unsafe-inline`)
  requires disabling the inlining of critical CSS in the Angular build (`inlineCritical: false`).
- ADR [0008](0008-hebergement-azure.md) (Azure) is superseded by this one.
