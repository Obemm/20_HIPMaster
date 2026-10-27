# US-050 — Continuous deployment to Cloud Run and Firebase Hosting

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-050-deploiement-continu`

## Story

As the **project owner**, I want **a merge into `main` that passes the CI to be put live automatically** so that I can
**deliver often, with no manual handling and no secret on my machine**.

## Acceptance criteria

- [x] **Given** a merge into `main` whose CI is green, **when** the deployment workflow runs, **then** it authenticates
      through Workload Identity Federation (US-049), builds the API image (tagged with the commit SHA), pushes it to
      Artifact Registry, **runs the migration job** with this image, deploys the Cloud Run service, checks
      `/api/v1/sante`, then publishes the front end on Firebase Hosting.
- [x] **Given** a failed migration or health probe, **then** the deployment stops and the old revision keeps serving
      traffic.
- [x] **Given** `firebase.json`, **then** it publishes the Angular build, relays `/api/**` to the Cloud Run service,
      returns `index.html` for Angular routes, serves fingerprinted files with a long cache (`immutable`),
      illustrations with a one-day cache (their name has no fingerprint yet, US-057) and `index.html` without cache,
      and sets the security headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
      embedding in a frame forbidden.
- [x] **Given** the strict CSP (`script-src 'self'; style-src 'self'`, without `unsafe-inline`), **then** the site
      displays normally: the production build disables inlining of critical CSS (`inlineCritical: false` in
      `angular.json`), which currently adds a `<style>` and an inline script that the CSP would block (site without
      styles, verified on 2026-10-22). No CSP violation on the e2e journeys.
- [x] **Given** a crawler, **when** it visits the site, **then** `robots.txt` and
      `<meta name="robots" content="noindex">` ask it to index nothing (site reserved for invitees).
- [x] **Given** the Cloud Run service, **then** it runs in Frankfurt (`europe-west3`, close to the Neon database) with
      the API's service account, 1 vCPU, 512 MiB, 0 minimum instances, 1 maximum (kept after ADR 0030, see the log),
      startup boost, and receives the database URL through Secret Manager.
- [x] **Given** a faulty version live, **then** the operations guide describes the rollback (previous Cloud Run
      revision, previous Firebase version) and it has been tried once.
- [x] The rule of compatible migrations is written down: a migration never breaks the version still live (add, deploy,
      then remove), since it runs before traffic is switched.
- [x] **Given** the live service, **when** no more requests arrive, **then** the Neon database goes to sleep in under
      10 minutes, measured following the procedure of US-046 (Cloud Run's CPU allocated during requests only).

## Notes

- Depends on US-046 (API image, migration command) and US-049 (infrastructure).
- What the API image expects (US-046, ADR 0023): `DATABASE_URL` (Secret Manager, Neon direct endpoint,
  `sslmode=require` accepted), `GOOGLE_CLOUD_PROJECT` (links logs to traces); `NODE_ENV=production` and `PORT` come
  from the image and Cloud Run; `LOG_LEVEL` and `BASE_*` are optional (`.env.example`). The migration job uses the same
  image with the command `node apps/api/src/migrer.ts`.
- The current CI (`.github/workflows/ci.yml`) remains the entry gate: deployment starts only after it.
- Firebase Hosting relays no cookie except `__session`: authentication through the `Authorization` header (ADR 0017)
  is not concerned.
- Infrastructure ready (US-049, [operations guide](../../exploitation/README.md)):
  - authentication: provider
    `projects/307763122401/locations/global/workloadIdentityPools/github/providers/github-actions`, with the account
    `hipmaster-deploiement@hipmaster.iam.gserviceaccount.com`. The token is issued only to `refs/heads/main`;
  - images: `europe-west3-docker.pkg.dev/hipmaster/images`. Push them without attestation (`--provenance=false`),
    otherwise it counts among the 2 versions kept;
  - API and migration job: they run under `hipmaster-api@hipmaster.iam.gserviceaccount.com`, with the `database-url`
    secret in `DATABASE_URL`;
  - missing right: add it to the `scripts/gcp/infrastructure.sh` script, not by hand.
- Implementation ([ADR 0028](../../decisions/0028-deploiement-continu.md),
  [guide](../../exploitation/README.md#déployer)):
  - `scripts/gcp/deployer.sh` carries each step, which the `deploy.yml` workflow chains and which a machine can run;
    nothing becomes public without `--public`;
  - the API goes through a revision with no traffic, tagged `essai` and probed, before the switch; the revision left
    gets the `precedente` tag, the target of `retour-api`;
  - the front end is published through Firebase Hosting's REST API (`scripts/gcp/publier-front.ts`), without the
    Firebase CLI; `scripts/gcp/hebergement.ts` translates `firebase.json` and also serves the local server of the e2e
    journeys;
  - the CI runs the e2e journeys on the production build, served with the headers of `firebase.json`: each CSP
    violation is reported to the local server and fails the run;
  - under `/api`, Firebase sets no `Cache-Control`: the API keeps control (`no-store` of US-047, cache of US-057);
  - the `cle-codes-recuperation` secret (US-047) is expected in addition to `database-url`: without it, the deployment
    stops before any write, with a clear message. The deployment account reads the secrets' metadata for this
    (`roles/secretmanager.viewer`, added to the infrastructure script and applied on 2026-10-23);
  - the API also receives `PROXYS_DE_CONFIANCE=2` (US-047: Firebase Hosting, then Cloud Run's front end); the
    migration job receives the same configuration as the service;
  - the probe goes through the `run.app` address of the `essai` revision: if US-047 disables the default address
    (`--no-default-url`), the probe must be reviewed.
- To check at the first real deployment (after US-047 and US-048): Workload Identity Federation token, publication on
  Firebase Hosting and real headers (`site` step), rollback tried once (API and front end), Neon sleep in under 10
  minutes.

## Log

- 2026-10-22 — created, from the review before going live (ADR 0021).
- 2026-10-22 — US-046: measurement of Neon's sleep in production taken over here, variables expected by the image.
- 2026-10-23 — in progress: `deploy.yml` workflow and `deployer.sh` script (revision with no traffic, probe, switch),
  `firebase.json` and publication through Firebase's REST API (ADR 0028), CSP verified by the e2e journeys on the
  production build (93 journeys, no violation; inline critical CSS causes 2, detected).
- 2026-10-23 — in review: `prerequis` verified on the project (both secrets present; a missing secret stops everything
  before any write); `roles/secretmanager.viewer` right applied by `infrastructure.sh` (1 created, 29 already in
  place); image built locally, simple manifest without index. Validation on Google Cloud (image pushed, migration job
  on Neon, private service probed with an identity token) awaiting the project owner's agreement.
- 2026-10-24 — verified in production: real deployments succeeded end to end through Workload Identity Federation
  (US-051, US-059, US-065: image, migration job, probed "essai" revision, switch, front end, site check); a missing
  secret stops everything before any write, and each workflow step stops at the first failure (`set -Eeuo pipefail`,
  no tolerant step), the live revision continuing to serve. Configuration read on the service: Frankfurt, `hipmaster-api`
  account, 1 vCPU, 512 MiB, 0 to 1 instance, CPU during requests only, startup boost, `DATABASE_URL` and
  `CLE_CODES_RECUPERATION` drawn from Secret Manager. Rollback tried once, round trip (launched by the project owner,
  Claude Code's auto mode blocking writes on GCP): API to the `precedente` revision in 32 s, front end to the previous
  publication in 42 s, site healthy (`/api/v1/sante` 200, previous bundle served), then the current version restored.
  Neon's sleep measured over 48 h: compute suspended 5 min 36 s to 6 min 20 s after the last request (e.g. 21:54:25 →
  22:00:45). The maximum of one instance is kept despite ADR 0030: rate-limiting counters and connection pool per
  instance.
- 2026-10-24 — delivered: continuous deployment verified in production: complete chain, stop at the first failure, API and front end rollback tried (32 s and 42 s), Neon sleep in 6 min at most
