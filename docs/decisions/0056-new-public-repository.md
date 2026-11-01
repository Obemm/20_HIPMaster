# 0056 — A new public repository that no longer names the company

- **Date**: 2026-11-01
- **Status**: Accepted

## Context

Colleagues must be able to read and contribute to the repository from Monday 2026-11-02. The current repository went
private after ADR 0054, because the read-only references of its past pull requests still point to the commits from
before the history rewrites of ADR 0054 and 0055: anyone could read those versions in the "Commits" and "Files changed"
tabs of a closed pull request. Only GitHub support can purge these references, with no guaranteed delay.

The clean-up was also partial: stories still quoted company ADR numbers, and the game itself said what the company
does ("At …" field of the sheets, "In real life" texts), which ADR 0022 had accepted and the project owner no longer
wants public.

## Decision

- **A new repository under the same name.** The current one is renamed `Obemm/20_HIPMaster-archive` and stays private,
  with its pull requests. A new public `Obemm/20_HIPMaster` receives the rewritten history: `main` and the branch of the
  paused set 2, nothing else. It has no pull request reference, so nothing to purge.
- **The company is no longer named**, in the files, the file names or the commit messages, over the whole history:
  no company ADR number, no "At …" field, no sentence on what the company uses or forbids. The joke of the FTP card stays
  without it ("Officially banned. Unofficially…").
- **Tool and product names stay**: they are public information (webMethods, Apigee, Solace, Okta…).
- The optional company field of the sheets leaves the domain, the API and the interface; this supersedes that field
  in ADR 0036. Without it, the total length check of a sheet can no longer fail and goes too.
- ADR 0005 and the mapping of ADR 0055 stay local, under neutral names (`docs/decisions/*.local.md`, ignored by Git).
- The new repository gets the settings of ADR 0053, which apply again now that it is public, and GCP accepts its tokens
  through its new numeric identifier (ADR 0028).

## Alternatives considered

- **Making the current repository public**: exposes the old versions through closed pull requests until the purge, on a
  date nobody controls.
- **Waiting for GitHub support**: same uncertainty, and Monday would be missed.
- **A new repository with a single commit**: no more to hide than the rewritten history, and the project's history is
  lost.
- **A separate public repository for cards only**: contributors could not read the rules and decisions, and two
  repositories to keep in sync.

## Consequences

- Closed pull requests and their discussions stay in the private archive only. Numbers such as `(#123)` in old commit
  messages now point to nothing, or to a different pull request of the new repository.
- Open pull requests do not follow: Dependabot recreates its own, the draft of set 2 is reopened from its branch.
- History rewriting gives each past version masked wordings where it named the company: readable, but not as written at
  the time. Hashes change once more; every local clone is cloned again or reset.
- Players see fewer lines in the "Learn more" sheets of eight cards, in both languages.
- Screenshots of the repository are checked by eye: text in an image escapes the automatic checks.
