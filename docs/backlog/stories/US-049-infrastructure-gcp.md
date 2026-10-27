# US-049 — Free and reproducible infrastructure

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-049-infrastructure-gcp`

## Story

As the **project owner**, I want **the infrastructure described by ADR 0021 to be created by a versioned script that
Claude can run and rerun** so that **I pay nothing, configure nothing by hand and can recreate everything**.

## Acceptance criteria

- [x] **Given** the project owner's personal Google account, **when** the script runs, **then** it uses a dedicated
      `gcloud` configuration (`hipmaster`), checks the account and the project before any write, and never touches the
      machine's professional configuration.
- [x] **Given** this configuration, **then** the script creates the `hipmaster` project (or reuses it), links it to the
      personal billing account, enables the necessary APIs and creates, in Frankfurt (`europe-west3`):
  - a Docker **Artifact Registry** repository that keeps only the last 2 images;
  - a **Cloud Storage** bucket for backups, which deletes files older than 30 days;
  - the API's service account (read access to its single secret);
  - the deployment service account, linked to the GitHub repository through **Workload Identity Federation** and
    limited to the `main` branch (no JSON key created);
  - a **budget** with an alert from €1.
- [x] **Given** the `neonctl` CLI authorised by the project owner, **then** the script creates (or reuses) the Neon
      project (AWS `eu-central-1`, Frankfurt, PostgreSQL 18 like PGlite, ADR 0024), caps compute at 0.25 CU, creates
      the database and its role, and stores the connection URL in **Secret Manager** without ever displaying it or
      writing it to disk.
- [x] **Given** the dedicated `gcloud` configuration, **then** the script adds Firebase to the project and creates the
      Hosting site (`hipmaster` if it is free), through the Firebase API with the token of this configuration (ADR
      0024).
- [x] **Given** the script rerun on an existing infrastructure, **then** it breaks nothing and says what it did.
- [x] An operations guide (`docs/exploitation/`) describes the only manual steps: creating the free Neon account, and
      authorising the CLIs (`gcloud`, `neonctl`; `firebase` for the manual operations of US-050) by signing in in the
      browser.
- [x] No secret or e-mail address is hard-coded in the repository: they are passed as parameters or variables.

## Notes

- Tool: an idempotent **`gcloud` script** is enough at this scale (nothing more to install); Terraform would remain
  possible later. Choice recorded in [ADR 0024](../../decisions/0024-infrastructure-script-gcloud.md):
  [`scripts/gcp/infrastructure.sh`](../../../scripts/gcp/infrastructure.sh), `--simulation` mode for the plan and the
  check, guide in [`docs/exploitation/`](../../exploitation/README.md).
- **PostgreSQL 18** on Neon, not 17: it is the version of PGlite (18.6) and of `docker-compose.yml`, and the "HIPMaster"
  Neon project created when the project owner signed up already uses it. Neon does not change a project's major
  version: the CI of US-056 follows (ADR 0024).
- **Firebase** goes through its REST API, with the token of the verified `gcloud` configuration: a single identity. The
  Firebase CLI sign-in had expired (401 error on 2026-10-22); it now serves only for manual operations.
- **Database URL**: direct endpoint, `sslmode=verify-full` (with postgres.js, `require` does not verify the
  certificate) and without `channel_binding`, which `neonctl` adds and which postgres.js 3.4 would send to the server
  as an unknown parameter.
- **Deployment rights**: `run.admin` rather than `run.developer`, because making the API reachable by Firebase Hosting
  (`allUsers` invoker) requires `run.services.setIamPolicy`.
- The number of projects that can be linked to a billing account is limited: if the link fails, reuse an existing
  project or ask for a quota increase.
- Quality option, postponed to US-050 which creates the migration job: two PostgreSQL roles, one owning the schema for
  migrations, the other limited to reads and writes for the API. On Neon, a role created through the API inherits
  `neon_superuser`: the limited role will have to be created in SQL.
- The Cloud Run service and the migration job are created by the first deployment (US-050).

## Log

- 2026-10-22 — created, from the review before going live (ADR 0021).
- 2026-10-22 — reviewed for a free infrastructure (Neon instead of Cloud SQL), at the project owner's request.
- 2026-10-22 — in progress: script `scripts/gcp/infrastructure.sh`, operations guide and ADR 0024; simulation on the
  personal account (nothing written); "HIPMaster" Neon project (PostgreSQL 18) found, created at sign-up.
- 2026-10-22 — infrastructure created on the personal account, with the project owner's agreement (PostgreSQL 18
  chosen): `hipmaster` project (no. 307763122401) linked to billing, `images` repository, `hipmaster-sauvegardes`
  bucket, `hipmaster-api` and `hipmaster-deploiement` accounts, `github` pool and `github-actions` provider,
  `database-url` secret, €1 budget, Firebase and `hipmaster` site; "HIPMaster" Neon project reused, compute set to
  0.25 CU, `hipmaster` role and database. The first run stopped at step 5: Artifact Registry, just enabled, had created
  the repository despite an error. "Already exists" now counts as success on a new attempt, and the rerun resumed
  there. Each resource re-read; connection verified with postgres.js from the secret, without displaying it
  (PostgreSQL 18.6, `verify-full`).
- 2026-10-22 — idempotence: the first rerun put back on target the WIF provider that was already compliant (the
  expected variable, read-only, did not reach the check); fixed. Next rerun: 0 created, 0 modified, 29 already in
  place, secret URL up to date; the machine's active `gcloud` configuration unchanged at each pass.
- 2026-10-22 — delivered: Google Cloud, Firebase and Neon infrastructure created by scripts/gcp/infrastructure.sh (idempotent, --simulation), rerun without discrepancy; operations guide; ADR 0024 (script rather than Terraform, PostgreSQL 18, Firebase through its REST API)
- 2026-10-22 — guide: PowerShell variant, where `bash` means WSL (noted by the project owner, who reran the simulation
  from PowerShell: 29 items in place, nothing to do).
