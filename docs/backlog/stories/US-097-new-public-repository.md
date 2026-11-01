# US-097 — A new public repository that no longer names the company

- **Epic**: EPIC-08
- **Status**: In progress
- **Priority**: Must
- **Size**: M
- **Branch**: `us-097-new-public-repository`

## Story

As the **project owner**, I want **a public repository, readable by my colleagues from Monday, that names neither the
company nor its internal ADRs, in its files or its history** so that **I can share the link without waiting for GitHub
support to purge the old pull requests**.

## Acceptance criteria

- [ ] **Given** the files of `main`, **then** a search for the company's name finds nothing, nor any company ADR number or local
      mirror path; tool and product names stay.
- [ ] **Given** the game, **then** the "At …" line of the "Learn more" sheets is gone in both languages, and the "In real
      life" texts no longer name the company; the FTP joke stays.
- [ ] **Given** the screenshots of the repository, **then** none shows the company's name.
- [ ] **Given** the new repository, **then** its whole history (contents, file names, commit messages) passes the same
      search, and the tip of `main` is identical to the one rehearsed.
- [ ] **Given** the old repository, **then** it is private, named `Obemm/20_HIPMaster-archive`.
- [ ] **Given** the new repository, **then** it is public, has the settings of ADR 0053, and a deployment from `main`
      succeeds.
- [ ] ADR 0056 records the decision; `npm run check` and `npm run test:e2e` pass.

## Notes

- Choices of the project owner on 2026-11-01: new repository with the cleaned history; remove the references to the
  internal ADRs and the "at the company" mentions, replace them when they were a joke, keep the tool names.

## Log

- 2026-11-01 — created at the project owner's request: the repository must be public on Monday 2026-11-02.
- 2026-11-01 — company removed from the game, the docs and the code comments. Script `.donnees/nouveau-depot.sh` rehearsed
  on a local mirror: 0 match left over 4,791 Git objects, tip of `main` unchanged, 128 commits kept. The screenshots were
  read by eye: no mention visible, and the about and home pages never held one in their source; some small card text stays
  unreadable.
