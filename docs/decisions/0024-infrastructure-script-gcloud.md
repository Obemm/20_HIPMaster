# 0024 — Infrastructure described by an idempotent `gcloud` script rather than Terraform

- **Date**: 2026-10-22
- **Status**: Accepted (by the project owner, review before going online on 2026-10-22: "the infrastructure is
  created by a `gcloud` script that Claude runs")
- **Completes**: [0021](0021-hebergement-gcp.md) (hosting)

## Context

ADR 0021 places HIPMaster on a Google Cloud project of the project owner's personal account (Cloud Run, Artifact
Registry, Secret Manager, Cloud Storage, Firebase Hosting), with a free Neon database. The project owner wants Claude
to create and maintain all of it from the command line, with no manual setting, and to be able to recreate everything
(US-049).

There are about thirty elements to create: project, billing link, APIs, image repository, bucket, two service
accounts, secret, Workload Identity Federation, IAM rights, budget, Firebase and its site, Neon project, compute,
database, role and connection URL.

Constraints:

- the workstation (Windows, Git Bash) already has `gcloud`, Node and Docker; its active `gcloud` configuration is the
  professional one and must **never** be used for this project (ADR 0021);
- the repository is public (ADR 0022): no secret, billing identifier or e-mail address may enter it;
- part of the infrastructure is outside Google Cloud (Neon);
- running the tool again must break nothing, and it must say what already existed.

## Decision

- **An idempotent bash script**, [`scripts/gcp/infrastructure.sh`](../../scripts/gcp/infrastructure.sh). For each
  resource, it reads the actual state, creates what is missing, puts right what deviates from the target, and says so:
  "already exists", "created" or "modified". The `--simulation` mode does the same reads without writing anything: it
  is the plan before a creation, and the check afterwards.
- **Tools**: `gcloud` for Google Cloud; the Firebase REST API, called with the token of that same `gcloud` (a single
  identity, already verified); `neonctl`, in a pinned version launched through `npx` (nothing to install).
- **Security**:
  - every `gcloud` call targets the dedicated `hipmaster` configuration, through environment variables and an option,
    with the account and project imposed;
  - the account, then the project ownership, are verified before any write; at the end, the script checks that the
    workstation's active configuration has not changed;
  - the Google account and the billing account come in through the environment, never through the repository;
  - the database URL goes from `neonctl` to Secret Manager through pipes: never displayed, written to disk or logged.
- **Neon database on PostgreSQL 18**, not 17. It is the version of PGlite (18.6), which is used for development and
  tests (ADR 0018), and that of `docker-compose.yml`. Neon never changes the major version of a project: the CI of
  US-056 must use PostgreSQL 18.
- **Outside the script**: the Cloud Run service and its jobs, created by the first deployment (US-050), which carries
  their configuration (image, revision, mounted secret). Monitoring and the nightly backup (US-051) are added to the
  script as new steps: it remains the only description of the infrastructure.

## Alternatives considered

- **Terraform**, with the Google and Neon providers: declarative, with a plan, drift detection and removal of what
  falls outside the description. Rejected at this scale, for four reasons:
  - one more binary to install and keep up to date;
  - a state file, which would contain the database password, to be stored somewhere. A bucket must exist before
    Terraform (the chicken and the egg). A local file gets lost and stays in clear on the workstation;
  - the Neon provider is community-maintained;
  - the same precautions on the `gcloud` configuration would remain to be taken.

  It remains the natural option if the infrastructure grows (`stg` pre-production, other services): existing
  resources can be imported (`terraform import`).

- **Pulumi or OpenTofu**: same remarks as Terraform (state to store, extra tool).
- **Infrastructure Manager** (Terraform managed by Google) or **Deployment Manager** (end of life): they require a
  service account and state storage on the Google side, and do not cover Neon.
- **Google Cloud console and a written procedure**: neither reproducible nor verifiable, contrary to the goal of
  configuring nothing by hand.
- **Firebase CLI** for Firebase: a second identity, with its own login, which had in fact expired on 2026-10-22, and
  which the `gcloud` configuration check does not cover. The REST API, called with the token already verified, does
  the same thing.

## Consequences

- Nothing to install other than `gcloud`, Node (`npx`) and `curl`; Claude can run and re-run the script, and the
  simulation shows any drift before writing.
- With no state file, the cloud is the source of truth: the script re-reads everything on each run (one to two
  minutes).
- The script only sees what it checks: it removes neither a right added by hand nor a resource removed from the
  script. A deletion is done by hand, and the operations guide describes it.
- Each new resource (US-050, US-051) becomes a step of the script, with its existence check.
- Git Bash quirks are handled in the script: `\r\n` line endings from `gcloud`, MSYS path conversion, Windows paths
  of temporary files.
- The major version of the database (PostgreSQL 18) is imposed on the CI (US-056) and on restores (US-051).
