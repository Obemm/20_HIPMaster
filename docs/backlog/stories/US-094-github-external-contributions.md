# US-094 — A GitHub repository open to contributors, validated by the project owner

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-094-github-contributions`

## Story

As the **project owner**, I want **external contributors to be able to propose cards by pull request while nothing
reaches `main` without my review and a green CI** so that **I can open the repository to the community without losing
control of what is deployed**.

## Acceptance criteria

- [x] **Given** a pull request to `main`, **then** it can only be merged by squash, with the four CI checks green; no
      one, the project owner included, can push directly to `main`, force-push it or delete it.
- [x] **Given** a pull request from a contributor, **then** it needs the approval of the code owner (the project
      owner), cancelled by any later push; the project owner can merge their own pull requests (and those of their AI
      sessions) without an approval, but never without a green CI.
- [x] **Given** a pull request from a fork, **then** its CI only runs once the project owner has clicked "Approve and
      run", for every external contributor, not only the first time.
- [x] **Given** the `production` environment, **then** only the `main` branch can deploy to it.
- [x] **Given** the public repository, **then** secret scanning with push protection, private vulnerability reporting
      and Dependabot security updates are on; merged branches are deleted.
- [x] **Given** the settings, **then** `scripts/github/configurer-depot.sh` applies them all again (idempotent), and
      the operations guide and ADR 0053 describe them.

## Notes

- Audit of 2026-10-28: `main` was not protected, rebase merges were allowed, the CI of a fork only needed approval on
  a contributor's first pull request, the security features of a public repository were off. Contributors already had
  no write access (ADR 0050) and the deployment only starts from a push to `main` of this repository (US-049).
- GitHub does not let anyone approve their own pull request: hence the project owner's bypass, limited to pull requests
  and to the review rule only.

## Log

- 2026-10-28 — created at the project owner's request ("contributors can contribute, I keep control of the
  validation"), recommendations accepted.
- 2026-10-28 — delivered: repository settings applied by scripts/github/configurer-depot.sh: two rulesets on main, fork CI approval for every external contributor, production from main only, public-repository security on
