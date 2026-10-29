# US-095 — Keep the the company ADR reference out of the public repository

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Should
- **Size**: XS
- **Branch**: `us-095-private-reference`

## Story

As the **project owner**, I want **ADR 0005, which copies the table of the the company technology ADRs, to stay on my machine
and leave the public repository** so that **contributors and visitors no longer read the list of the company internal tools
and rules (identity provider, cloud, governance tools…)**.

## Acceptance criteria

- [x] **Given** the repository, **then** `docs/decisions/0005-reference.local.md` is no longer tracked by Git and
      `.gitignore` excludes it; the file stays on the project owner's machine, unchanged.
- [x] **Given** a public file that linked to ADR 0005, **then** it no longer holds a broken link: it cites "ADR 0005"
      as plain text, kept locally.
- [x] **Given** the decision, **then** ADR 0054 records it, its consequences on ADR 0022 and what it does not cover
      (Git history, the "the company reference" field of the other ADRs, the card texts).
- [x] `npm run check` passes.

## Notes

- Audit of 2026-10-29 of the the company mentions in the repository and the game: ADR 0005 is the file that lists the most
  the company internal tools (Okta, Azure Repo, TAD, LeanIX, AT Internet, ConfigCat, Localazy…). The project owner chose to
  start with this file only.
- Out of scope at first, then done on the project owner's request: rewriting the Git history. Still out of scope: the "the company reference" field of
  the other ADRs, the "At the company" and "In real life" texts of the cards.

## Log

- 2026-10-29 — created at the project owner's request ("put the ADR reference in the gitignore", ADR 0005 only).
- 2026-10-29 — delivered: ADR 0005 kept on the owner's machine, out of the repository and its history (ADR 0054)
- 2026-10-29 — Git history rewritten at the project owner's request: `.donnees/reecrire-historique.sh` (git
  filter-repo on a mirror clone, rulesets of `main` disabled then put back by `configurer-depot.sh`) removed the file
  from the 4 commits that held it; no GitHub branch contains it any more. GitHub support asked to purge the cached
  commits of the pull request refs.
