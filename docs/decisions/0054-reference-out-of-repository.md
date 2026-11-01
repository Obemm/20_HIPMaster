# 0054 — The company ADR reference stays out of the public repository

- **Date**: 2026-10-29
- **Status**: Accepted

## Context

ADR 0005 copies the table of the company's technology ADRs: their numbers, their subjects and the internal tools they impose.
ADR 0022 made the repository public and judged a clean-up "pointless, since this information is public". An audit of
2026-10-29 shows that ADR 0005 is the file that tells the most about the company's internal tooling, and that contributors do
not need it to propose a card.

## Decision

`docs/decisions/0005-reference.local.md` leaves the public repository: it is untracked and listed in
`.gitignore`. It stays on the project owner's machine and remains **accepted and authoritative** for the decisions
made there (CLAUDE.md, rule 4). The public files that linked to it cite "ADR 0005" as plain text, with no link.

This decision narrows ADR 0022 for this one file; the rest of ADR 0022 is unchanged.

## Alternatives considered

- **Remove every company mention** (cards, the "company reference" field of every ADR): broader, not requested for now.
- **Rewrite the Git history**: the only way to erase past versions, but it breaks the forks of contributors and every
  open pull request; not requested for now.
- **Move ADR 0005 to a private repository**: one more repository to keep in sync for a single file.

## Consequences

- Visitors no longer find the company reference table in the current version of the repository.
- The file remains readable in the Git history until a possible rewrite. Update of 2026-10-29: the history was
  rewritten at the project owner's request (no fork existed; every branch force-pushed, protections put back); only
  GitHub's cache of old pull request commits remains, until GitHub support purges it.
- The other ADRs still cite the company's ADRs they keep, adapt or reject in their "company reference" field. Update of
  2026-10-30: no longer true, ADR [0055](0055-reference-out-of-adrs.md) moves that field out of the public ADRs.
- A contributor cannot open ADR 0005; the decisions that apply it (0006 to 0053) stay readable on their own.
