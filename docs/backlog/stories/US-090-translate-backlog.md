# US-090 — Translate the backlog (method, board, epics, stories)

- **Epic**: EPIC-16
- **Status**: Ready
- **Priority**: Should
- **Size**: L
- **Branch**: `us-090-translate-backlog`

## Story

As an **English-speaking contributor**, I want **the backlog in English** so that **I can follow what was done and
write my own stories**.

## Acceptance criteria

- [ ] `docs/backlog/README.md` (way of working), `TABLEAU.md` (board), every epic and every story are in English,
      paths unchanged, following the formats of ADR 0051 (`- **Status**: Done`…).
- [ ] `python scripts/close-story.py --recount` leaves the board and the epics consistent.
- [ ] Links and anchors still resolve; `npm run check` passes.

## Log

- 2026-10-27 — created (EPIC-16).
