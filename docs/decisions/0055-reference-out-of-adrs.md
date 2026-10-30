# 0055 — The the company reference of each ADR stays out of the public repository

- **Date**: 2026-10-30
- **Status**: Accepted

## Context

ADR [0054](0054-reference-out-of-repository.md) took ADR 0005 (the table of the the company technology ADRs) out of the
repository, but left out of scope the "the company reference" field that every ADR since 0006 carries. Read together, these
fields rebuild a large part of that table: the company ADR numbers, their subjects and the internal tools they impose (identity
provider, software factory, feature flags, localisation, master data, audience measurement…). Several ADR bodies also
quote these rules ("the the company reference requires…"). Contributors do not need any of it to read a decision.

## Decision

- The "the company reference" field leaves the public ADRs, the ADR template and the index of `docs/decisions/README.md`. Its
  content moves, unchanged, to `docs/decisions/reference-mapping.local.md`, ignored by Git, on the project owner's machine.
- ADR bodies no longer quote an the company ADR number, an the company internal tool or an the company rule. When a decision follows or departs
  from the reference, they say "the reference (ADR 0005)". Tools the project actually uses or weighed for itself
  (Angular, Azure in ADR 0008, SonarCloud, Figma…) stay named; the word "the company" stays where it describes the game's
  universe or its players.
- Rule 4 of `CLAUDE.md` keeps the principle; its local details (mirror path, tools not imposed) move to
  `CLAUDE.local.md`, ignored by Git.
- The Git history is rewritten so that past versions of these files no longer hold the field either: every historical
  version of an ADR that cites the the company reference takes the text of its current version; the index, the template,
  `CLAUDE.md` and `README.md` have their the company ADR numbers and internal tools masked. The project owner runs the script
  once this ADR is on `main`.

ADRs are not modified after acceptance (README of the decisions): this ADR is an exception, for an editorial redaction
that changes no decision. ADR 0054 is completed, not superseded.

## Alternatives considered

- **Neutralised field** ("Company reference: adopted…", without numbers or tools): keeps a trace in every ADR, but the
  verdicts alone still describe the company's rules.
- **Field removed with nothing kept**: simpler, but the owner loses the record of how each decision fits the reference.
- **No history rewrite**: the old versions would remain one `git log -p` away.

## Consequences

- A visitor reads the decisions without learning the the company internal rules or tooling; the owner keeps the full mapping
  locally.
- Each new ADR gets its line in `reference-mapping.local.md` instead of a header field.
- After the rewrite, the history of an ADR no longer shows its earlier wordings (French version, past statuses): each
  version that cited the reference shows the current text. Every commit hash changes from the first ADR on: open branches
  and forks must be rebased, which the script checks before pushing.
- Out of scope, as for ADR 0054: the card texts ("At the company", "In real life"), the stories, the CHANGELOG and the product
  documents.
