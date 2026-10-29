# US-095 — Keep the the company ADR reference out of the public repository

- **Epic**: EPIC-08
- **Status**: In progress
- **Priority**: Should
- **Size**: XS
- **Branch**: `us-095-private-reference`

## Story

As the **project owner**, I want **ADR 0005, which copies the table of the the company technology ADRs, to stay on my machine
and leave the public repository** so that **contributors and visitors no longer read the list of the company internal tools
and rules (identity provider, cloud, governance tools…)**.

## Acceptance criteria

- [ ] **Given** the repository, **then** `docs/decisions/0005-reference.local.md` is no longer tracked by Git and
      `.gitignore` excludes it; the file stays on the project owner's machine, unchanged.
- [ ] **Given** a public file that linked to ADR 0005, **then** it no longer holds a broken link: it cites "ADR 0005"
      as plain text, kept locally.
- [ ] **Given** the decision, **then** ADR 0054 records it, its consequences on ADR 0022 and what it does not cover
      (Git history, the "the company reference" field of the other ADRs, the card texts).
- [ ] `npm run check` passes.

## Notes

- Audit of 2026-10-29 of the the company mentions in the repository and the game: ADR 0005 is the file that lists the most
  the company internal tools (Okta, Azure Repo, TAD, LeanIX, AT Internet, ConfigCat, Localazy…). The project owner chose to
  start with this file only.
- Out of scope: rewriting the Git history (the file stays readable in past commits), the "the company reference" field of
  the other ADRs, the "At the company" and "In real life" texts of the cards.

## Log

- 2026-10-29 — created at the project owner's request ("put the ADR reference in the gitignore", ADR 0005 only).
