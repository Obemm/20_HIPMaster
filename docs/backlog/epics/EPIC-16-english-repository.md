# EPIC-16 — The repository in English

- **Status**: Done
- **Priority**: Should

## Goal

Open the whole project to English-speaking colleagues (architects), who will read the rules and decisions and
propose cards and features: the repository is written in English from now on (ADR
[0051](../../decisions/0051-english-repository-language.md)), and its existing French documents are translated.
Decision of the project owner, 2026-10-27.

## Success indicator

- No French left in the documentation, the backlog, the ADRs and the CHANGELOG, except quotations of the game's
  French texts.
- The tools (`scripts/close-story.py`, templates) work in English; `npm run check` stays green.
- A contributor finds every rule, decision and story in English.

## Stories

- [x] US-087 — English as the repository language: ADR, CLAUDE.md, templates and closing script
- [x] US-088 — Translate the product docs, READMEs, operations guide and review
- [x] US-089 — Translate the ADRs
- [x] US-090 — Translate the backlog (method, board, epics, stories)
- [x] US-091 — Translate the CHANGELOG
- [x] US-092 — Links across translated folders, and the contributor kit after the switch

US-087 comes first (rules and tools); US-088 to US-091 then run in parallel, each on its own files.

## Out of scope

- The game's French texts and interface (bilingual by design, ADR 0042 and 0043).
- Rewriting existing code comments: they are translated when a file is touched (ADR 0051).
- Renaming existing files: paths are kept.
