# 0028 — Continuous deployment: revision verified before the switch, front end published through Firebase's REST API

- **Date**: 2026-10-23
- **Status**: Accepted
- **Completes**: [0021](0021-hebergement-gcp.md) (hosting), [0023](0023-postgresql-production.md) (migrations before
  deployment) and [0024](0024-infrastructure-script-gcloud.md) (infrastructure by script)

## Context

ADR 0021 puts the front end on Firebase Hosting and the API on Cloud Run, deployed by GitHub Actions after the CI,
without a key (Workload Identity Federation). ADR 0023 requires running the migrations in a Cloud Run Job before
sending traffic to the new version. ADR 0024 leaves the creation of the service and the job to the first deployment.
US-049 created the rest: image repository, secrets, service accounts, and a Google token issued only to the `main`
branch.

Constraints noted by US-050:

- **at most one instance** as long as the games against the bot live in memory (ADR 0014): no progressive deployment
  possible;
- a failing step must not touch the live version;
- a strict CSP (`script-src 'self'; style-src 'self'`, without `unsafe-inline`) blocks the critical CSS that Angular
  inserts into `index.html`: a site without styles, checked on 2026-10-22;
- the workstation's Firebase CLI login expires (noted on 2026-10-22), and it is a second identity, which the checks of
  the `gcloud` configuration do not cover;
- the repository is public (ADR 0022): no key, no secret.

## Decision

- **Trigger**: the `deploy.yml` workflow starts at the end of the CI (`workflow_run`), only if it succeeded on a push
  to `main` of this repository. It checks out the commit the CI verified. One deployment at a time, never interrupted
  (`concurrency` without cancellation); GitHub environment `production`.
- **A single script, two uses**: `scripts/gcp/deployer.sh` describes each step (`prerequis`, `image`, `migrations`,
  `revision`, `sante`, `trafic`, `front`, `site`). The workflow runs one per GitHub step; a workstation runs the same
  ones, with the dedicated `gcloud` configuration, account and project verified. Nothing becomes public without the
  `--public` option, which only the workflow passes.
- **Prerequisites**: before any write, the API's secrets must exist, with an active version. The deployment account
  reads only their metadata (`roles/secretmanager.viewer`, added to the infrastructure script). A missing secret (such
  as `cle-codes-recuperation`, as long as US-047 has not created it) stops everything with a clear message.
- **Image**: built from the Dockerfile of US-046, tagged with the commit SHA, pushed without attestation, and not
  rebuilt if it already exists (resuming a deployment). On a workstation, the Docker configuration stays intact:
  `gcloud` supplies the credentials to a temporary configuration.
- **Migrations**: the `hipmaster-migrations` job receives the API's image and configuration (account, secrets), only
  the command changes; it is run to completion. On failure, the deployment stops.
- **API**: a new revision **without traffic**, tagged `essai`. Its `/api/v1/sante` probe is called on its own address,
  then all traffic is switched. The revision that was serving receives the `precedente` tag: rolling back takes one
  command. Settings: `europe-west3`, `hipmaster-api` account, 1 vCPU, 512 MiB, 0 to 1 instance, startup boost, CPU
  allocated during requests only, `DATABASE_URL` and `CLE_CODES_RECUPERATION` taken from Secret Manager,
  `GOOGLE_CLOUD_PROJECT` and `PROXYS_DE_CONFIANCE=2` (US-047). The first deployment creates the service, with no
  previous revision to protect.
- **Front end**: the Angular build is published through the **Firebase Hosting REST API**
  (`scripts/gcp/publier-front.ts`), with the deployment account's `gcloud` token, without the Firebase CLI or a key.
  `firebase.json` is authoritative: the script translates it, and refuses what it cannot translate rather than
  forgetting it. A last step checks the public site: CSP, cache, bundle served, and `/api` relayed to Cloud Run.
- **`firebase.json`**: security headers on all responses; `no-cache` everywhere except under `/api`, where the API
  keeps control (`no-store` from US-047, public cache from US-057); illustrations kept for a day; fingerprinted files
  `immutable`. `/api/**` is rewritten to `hipmaster-api`, the rest to `index.html`.
- **CSP verified by the e2e journeys**: the CI runs them on the production build, served by a small local server that
  applies `firebase.json` like Hosting. Each CSP violation the browser reports is recorded there, and a single one
  fails the series. The production build disables the inlining of critical CSS (`inlineCritical: false`).

## Alternatives considered

- **Deployment job in `ci.yml`** (`needs`, or a reusable workflow): simpler context, but the CI cancels its running
  executions on every push (`cancel-in-progress`), including a deployment half-way through. A separate workflow keeps
  its own queue, without cancellation.
- **Direct deployment with traffic**: Cloud Run only checks that the container is listening. A revision that starts
  but answers badly would receive the traffic. The tag, the probe and then the switch cost only one more command.
- **Progressive switch** (10%, then 100%): impossible with a single instance and in-memory games (ADR 0014).
- **Firebase CLI** (`firebase deploy`): the standard tool, which reads `firebase.json` as is. But it is one more big
  npm package, and a second identity, whose login expires on the workstation. The REST API does the same thing in
  150 lines, with the identity already verified. The `FirebaseExtended/action-hosting-deploy` action requires a JSON
  key: rejected.
- **`pinTag`** (Hosting pins a Cloud Run revision): it ties the front end's rollback to the API's, and creates tags
  that only the Firebase CLI manages. Rejected for now.
- **Firebase emulator for the e2e**: it requires the Firebase CLI, and its `run` rewrite targets the real Cloud Run
  service. A local server of about a hundred lines is enough; the real cache behaviour is checked at each deployment,
  by the `site` step.
- **Reuse the CI build** rather than rebuilding the front end: artefacts would have to be shared between workflows.
  Rebuilding the same commit, with the same `package-lock.json`, is enough.

## Consequences

- A merge into `main` is live a few minutes after the CI. A failure before the switch leaves the old revision
  serving. A failure after it (front end publication) leaves the new API with the old front end: the API must remain
  compatible with the previous front end, as a migration must with the previous API (add, deploy, then remove).
- One-command rollback for each: `deployer.sh retour-api` gives the traffic back to the `precedente` revision, whose
  image is still kept (Artifact Registry keeps 2); `deployer.sh --public retour-front` republishes the previous
  version of the front end. Further back, an old commit is redeployed by re-running its workflow execution.
- Each deployment erases the games against the bot in progress, until US-052 (ADR 0014).
- The address of the `essai` revision is reachable like the service: it is the code that is going to serve, with no
  extra risk. The probe depends on this `run.app` address: disabling the service's default address
  (`--no-default-url`) would require reviewing the probe.
- A deployment from a workstation remains possible, with the same script, but never while the workflow is running.
- The CI runs the e2e journeys on the production build. Locally, `npm run test:e2e` stays on the development server,
  and `npm run test:e2e:production` reproduces the CI.
- `firebase.json` accepts only what `hebergement.ts` can translate. Adding redirects, for example, requires first
  completing this module and its tests.
- For headers, when several rules match, the last one wins: this is the behaviour confirmed by the Firebase team
  (firebase-tools#9467), and the `site` step checks it at each deployment.
