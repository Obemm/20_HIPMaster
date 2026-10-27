# US-086 — The contributor kit in English

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-086-kit-contributeur-anglais`

## Story

As an **English-speaking architect invited to propose a card**, I want a **contributor kit in English** so that I can
**understand the rules and propose my card without going through a translator**.

## Acceptance criteria

- [x] `CONTRIBUTING.md`, the guide `docs/contribuer/regles-cartes.md`, the card instruction, the illustration
      instruction and the "card" PR template are in English (British, like the `/en/` version of the game).
- [x] A proposal can be written in English: the card instruction asks the AI to write the game texts in French (the
      reference language, ADR 0043) and in English, and to keep in French what the project keeps in French (code
      comments, `cartes-set-1.md`, CHANGELOG).
- [x] The exception to the "everything in French" rule is recorded in ADR 0050 and in `CLAUDE.md`.
- [x] `README.md` presents contribution in English too.

## Notes

- Project owner's decision (2026-10-27): the repository will be shared with English-speaking colleagues; the rest of
  the project (backlog, ADRs, code, product documentation) stays in French.
- The file paths do not change (`docs/contribuer/…`): they are cited by ADR 0050, the stories and the README.
- The French text of a card proposed in English is written by the contributor's AI; the project owner reviews it.

## Log

- 2026-10-27 — created (EPIC-08).
- 2026-10-27 — delivered: Contributor kit in English (CONTRIBUTING.md, guide, card and illustration instructions, PR
  template); exception recorded in ADR 0050 and CLAUDE.md; bilingual README.
