# US-089 — Translate the ADRs

- **Epic**: EPIC-16
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-089-translate-adrs`

## Story

As an **English-speaking contributor**, I want **the architecture decisions in English** so that **I know why the
project is built this way before proposing a change**.

## Acceptance criteria

- [x] Every ADR of `docs/decisions/` (0001 to 0050), its index `README.md` and `template.md` are in English, numbers,
      dates, statuses and paths unchanged; the translation changes no decision.
- [x] Headers follow ADR 0051 (`- **Date**:`, `- **Status**:`, `- **company reference**:`…).
- [x] Links and anchors still resolve; `npm run check` passes.

## Log

- 2026-10-27 — created (EPIC-16).
- 2026-10-28 — delivered: ADRs 0001 to 0050, index and template in British English, numbers, dates and statuses kept (PR #113).
