# US-028 — Kit for the contributor's AI: card and illustration prompts

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-028-kit-ia-contributeur`

## Story

As an **architect proposing a card**, I want to **give my AI assistant a ready-to-use prompt** so that **it writes the
card and its illustration in line with the game, without my having to know all the files to touch**.

## Acceptance criteria

- [x] A **card prompt** (`docs/contribuer/consigne-carte.md`), to be copied into a coding assistant, starts from the
      proposal filled in according to the US-027 template and lists everything to write: the card in the domain
      catalogue (next number), its English translation, its "Learn more" sheet in French and English, the tests and
      e2e journeys that count the cards, the documentation (`cartes-set-1.md`), the CHANGELOG.
- [x] It forbids adding a new ability or engine mechanic, and requires `npm run check` to be green before opening the
      PR.
- [x] An **illustration prompt** (`docs/contribuer/consigne-illustration.md`), drawn from ADR 0047 and from
      [prompts-illustrations-gemini.md](../../produit/prompts-illustrations-gemini.md), gives the rendering reference
      image, the rules (one distinct creature, no text, no logo, no real person; family palette, intensity according to
      rarity) and the expected format of the original (4:3).
- [x] It explains how to produce and commit the variants (`npm run illustrations`) and attach the original to the PR.
- [x] **Given** a filled-in proposal, **when** an AI assistant follows the card prompt, **then** the resulting card
      passes `npm run check` without manual retouching, except for the illustrations test while the image is missing
      (trial recorded in the log).

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md). Replaces the in-game proposal form of the
  initial plan (ADR, form, preview, "My proposals").
- The prompt contains only public information from the repository (the company [ref]).
- To be updated when adding a card changes (new file, new language).

## Log

- 2026-10-19 — created (EPIC-08, to be handled later), under the title "Propose a card from the game".
- 2026-10-27 — refined (ADR 0050): the in-game form becomes a kit of prompts for the contributor's AI.
- 2026-10-27 — two trials of the card prompt by an AI agent, in an isolated worktree, with a trial card "Bulkhead"
  (common Patterns spell, never committed). First trial (effect "takes no damage"): a new engine status was needed,
  touching API, contract and screen; the "unknown number" test hard-coded the next number; the illustrations test
  stayed red. Fixes: the AI stops at any new mechanic (project owner's decision, ADR 0050), no story per card, test
  independent of the number of cards, up-to-date file list. Second trial (effect "+2 HP"): `npm run check` green on the
  first go except for the illustrations test, front-end tests green; final clarifications (log text of a reused status,
  scale of the bot's score, a card that outclasses another, front-end tests to run separately).
- 2026-10-27 — delivered: Prompts for the contributor's AI: docs/contribuer/consigne-carte.md (proven by two trials) and consigne-illustration.md; CONTRIBUTING.md links them.
