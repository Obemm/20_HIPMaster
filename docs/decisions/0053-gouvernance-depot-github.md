# 0053 — Repository governance: a protected `main`, the owner's review, configuration as a script

- **Date**: 2026-10-28
- **Status**: Accepted
- **Completes**: [0050](0050-cartes-communaute-par-pull-request.md) (community cards by pull request),
  [0022](0022-depot-public.md) (public repository) and [0028](0028-deploiement-continu.md) (continuous deployment)

## Context

ADR 0050 opens the repository to cards proposed by pull request from a fork; every merge into `main` with a green CI
is deployed (ADR 0028). An audit on 2026-10-28 found that only the absence of write access protected `main`: no branch
rule, so a pull request could be merged with a red CI and the owner could push to `main` directly (which deploys);
the CI of a fork ran without approval from a contributor's second pull request on; rebase merges were allowed, although
`CONTRIBUTING.md` announces squash merges; the free security features of a public repository were off. The project
owner is the only maintainer, and GitHub does not let anyone approve their own pull request. The project owner wants
contributors to contribute while keeping control of the validation.

## Decision

- **Two rulesets on the default branch**:
  - **`main — integrity`**, with **no bypass**: changes through a pull request only, merged by **squash**; the four CI
    checks required (lint, format, types, tests and build; API on PostgreSQL; journeys on the production build;
    balance of new cards); no force push, no deletion.
  - **`main — owner review`**: one approval required, from a **code owner** (`CODEOWNERS`: the project owner),
    cancelled by any later push, the last push needing approval by someone else than its author. The **repository
    admin** may bypass it, **through a pull request only**: this is how the project owner merges their own pull
    requests and those of their AI sessions.
- **The CI of a fork waits for the owner**: GitHub Actions asks for approval for **every external contributor**
  ("Approve and run"), so no contributed code runs before the owner has read the diff.
- **The `production` environment** only accepts deployments from `main`, in addition to the checks of the deployment
  workflow and of the Google identity federation (US-049).
- **Free protections of a public repository**: secret scanning with push protection, private vulnerability reporting,
  Dependabot security updates; merged branches deleted.
- **Configuration as a script**: `scripts/github/configurer-depot.sh` applies these settings through the GitHub API,
  idempotently, as `scripts/gcp/infrastructure.sh` does for Google Cloud (ADR 0024).

## Alternatives considered

- **A single ruleset with the admin bypass**: simpler, but a bypass lifts every rule of the ruleset, including the
  required CI: the owner could merge a red pull request, which would be deployed.
- **No bypass at all**: the only maintainer could no longer merge their own pull requests, nor those of Dependabot or
  of their AI sessions.
- **Classic branch protection** rather than rulesets: it has no bypass limited to one rule; rulesets combine, the most
  restrictive rule wins.
- **Approval of the CI on a first contribution only** (GitHub's default): convenient, but a contributor's next pull
  request runs any code in the repository's Actions without the owner seeing it.
- **Settings by hand in the GitHub interface**: nothing to maintain, but nothing to review or replay either.

## Consequences

- No one can push to `main` any more, the owner included: every change, even urgent, goes through a pull request with a
  green CI. In a real emergency the owner disables the `main — integrity` ruleset, then turns it back on.
- A red CI blocks the merge for everyone; a job renamed in `.github/workflows/ci.yml` must also be renamed in the
  script, otherwise every pull request waits for a check that never comes.
- Each fork pull request needs a click to run its CI: the owner reads the diff first (workflows, scripts, dependencies).
- Dependabot pull requests are merged by the owner through the bypass, with a green CI.
