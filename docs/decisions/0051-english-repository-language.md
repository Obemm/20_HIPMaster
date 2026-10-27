# 0051 — English is the language of the repository

- **Date**: 2026-10-27
- **Status**: Accepted
- **Supersedes**: the "everything in French" rule of `CLAUDE.md` (rule 1) and the English-kit exception of
  [0050](0050-cartes-communaute-par-pull-request.md), which this decision generalises

## Context

Since its start, HIPMaster has been written in French: documentation, backlog, ADRs, CHANGELOG, code comments and
commit messages. On 2026-10-27 the project owner decided to share the repository with English-speaking colleagues
(architects), first to propose cards (ADR 0050, US-086 translated the contributor kit), then, as they will read the
rest and propose features, to take part in the whole project. About 140,000 words of documentation exist in French
(backlog 59,000, ADRs 35,000, product docs 31,000, operations 6,500, README/CHANGELOG/CLAUDE.md 8,600), and the tools
read French headings (`scripts/cloturer-story.py`: "Statut", "Faite", "Terminé").

## Decision

- **English is the language of the repository**: documentation, backlog (epics, stories, board), ADRs, CHANGELOG,
  `CLAUDE.md`, new code comments and commit messages. British spelling, like the `/en/` version of the game.
- **What stays in French**: the conversation between the project owner and Claude; the French texts of the game, its
  reference language (ADR 0043), and the French interface; existing code comments, translated when a file is touched
  (a mass rewrite of the code would make every pending branch conflict).
- **Existing documents are translated** (EPIC-16), keeping their file paths: links, ADRs and stories cite them, and a
  path is not worth breaking for its language. New files get English names.
- **During the transition**, an untranslated file is updated in its own language. `scripts/close-story.py` (renamed
  from `cloturer-story.py`) reads and writes each story, epic and the board in its own language, recognised by its
  "Status" or "Statut" line.
- **Formats**: story and epic headers become `- **Status**: …`, `- **Epic**: …`, `- **Priority**: …`, `- **Size**: …`,
  `- **Branch**: …`; story statuses `To refine | Ready | In progress | In review | Done`, epic statuses `To refine | In
progress | Done`; ADR headers `- **Date**:` and `- **Status**:` (Proposed, Accepted, Superseded by NNNN).
- **ADR history**: a translated ADR keeps its number, date and meaning; the translation changes no decision.

## Alternatives considered

- **Contributor kit only in English** (ADR 0050 as written): enough to propose cards, not to read the rules, the
  decisions and the backlog, nor to propose features.
- **Bilingual documentation** (every file in both languages): readable by all, but every change made twice, and
  versions that drift apart.
- **English for new documents only**: no translation effort, but a repository half in each language for good, and
  the history (ADRs, rules) closed to the new contributors.
- **Translating code comments now**: consistent, but thousands of lines touched in every package, conflicts with every
  open branch, for little value to contributors who mostly read the docs.

## Consequences

- Contributors read and write the whole project in English.
- A one-off translation effort (EPIC-16), split by area so that sessions do not touch the same files; the product
  owner reviews the result.
- The project owner reads the repository in English; the conversation with Claude stays in French.
- For a while, code comments mix French (old) and English (new).
- French typography rules (non-breaking space before a colon, « » quotes) no longer apply to the docs.
