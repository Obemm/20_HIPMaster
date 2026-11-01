# US-096 — Keep the company reference of each ADR out of the public repository

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-096-reference-out-of-adrs`

## Story

As the **project owner**, I want **the "company reference" field of the ADRs and the company rules quoted in their bodies to
leave the public repository, its history included, while I keep the mapping on my machine** so that **visitors and
contributors can no longer rebuild the list of the company's internal rules and tools from the ADRs**.

## Acceptance criteria

- [x] **Given** the public ADRs, the template and the index of `docs/decisions/README.md`, **then** none carries the
      "company reference" field or column, and no ADR body quotes a company ADR number (`ADR-0NN`), an company internal tools or
      a company rule.
- [x] **Given** the project owner's machine, **then** `docs/decisions/reference-mapping.local.md` holds, unchanged, the
      former field of every ADR, and `CLAUDE.local.md` the local details of rule 4; both are ignored by Git.
- [x] **Given** `CLAUDE.md`, **then** rule 4 keeps the principle without the mirror path or the internal tools.
- [x] **Given** the decision, **then** ADR 0055 records it, and ADR 0054 points to it.
- [x] **Given** the Git history of GitHub after the owner runs `.donnees/reecrire-historique-adr.sh`, **then** no commit
      of a branch holds the field or a company ADR number in the ADRs, their index, their template, `CLAUDE.md` or
      `README.md`.
- [x] `npm run check` passes.

## Notes

- Follows US-095 (ADR 0005 out of the repository). Choices of the project owner on 2026-10-30: local mapping file,
  bodies of the ADRs included, history rewritten.
- Out of scope: the card texts ("At the company", "In real life"), the stories, the CHANGELOG and the product documents.

## Log

- 2026-10-30 — created at the project owner's request ("the ADR fields").
- 2026-10-30 — ADRs, template, index and rule 4 cleaned; mapping kept in `docs/decisions/reference-mapping.local.md`.
  History script `.donnees/reecrire-historique-adr.sh` rehearsed on a local mirror: 2,517 lines citing the reference
  before, 0 after, tip of `main` unchanged, 125 commits kept. To run by the project owner once the PR is merged.
- 2026-10-31 — delivered: company reference of each ADR moved to a local file, ADR bodies cleaned, Git history rewritten (ADR 0055)
