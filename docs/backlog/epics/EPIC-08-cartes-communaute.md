# EPIC-08 — Cards proposed by the IT community

- **Status**: In progress
- **Priority**: Should

## Goal

Make the game a tool for **IT acculturation** carried by several voices: the project owner's fellow architects propose
their own cards (a technology, a pattern, an incident they lived through), with an "In real life" text that explains
what the card stands for in the information system. Request from the project owner, 2026-10-19.

**Refinement of 2026-10-27** (ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md)): the
contributors are architects who are comfortable with GitHub and with an AI assistant. Rather than a form and a review
queue in the game, **a community card is a pull request opened from a fork**. The repository gives them the material:
a guide to the card creation rules, a prompt for their AI to write the card, and another for it to draw the
illustration. Review, balancing and publication happen in the PR; the card takes the next number in the catalogue and
carries its author's name.

## Success indicator

- At least 5 contributors, other than the project owner, have a card published in the game.
- A card PR gets an answer (merged, to rework, rejected) in under two weeks.
- A card PR produced with the kit passes `npm run check` first time in most cases.
- Every published card keeps a reviewed "In real life" text, understandable by a non-specialist.

## Stories

- [x] US-027 — Contributor guide: the rules for creating a card
- [x] US-028 — Kit for the contributor's AI: card and illustration prompts
- [x] US-029 — Review a card proposed in its pull request
- [ ] US-030 — A card's author in the catalogue, and a first community card
- [x] US-031 — Credit contributors in the game
- [x] US-086 — The contributor kit in English

Suggested order: US-027 (useful right away, including for ideas received by message or in a workshop), US-028 and
US-029 (the complete kit), then US-030 with a first colleague to test the journey, and US-031.

## Decisions taken

- **Identity and review**: no account or role in the game; the contributor is the PR's author, the reviewer is the
  project owner (`CODEOWNERS`). No identity ADR (ADR 0050).
- **Access**: fork and PR, with no write access to the repository (ADR 0050).
- **Path to the catalogue**: the PR itself, with the invariant tests in CI (ADR 0011, 0050).
- **Sets**: no separate set; next numbers in the catalogue, distinguished by the author field (ADR 0050).
- **Confidentiality**: rule written in the guide (US-027), checked by the contributor before opening the PR (the
  repository is public as soon as it is opened), then by the reviewer (US-029 checklist).

## Out of scope

- Proposal form and review queue in the game (replaced by PRs, ADR 0050).
- Write access to the repository for contributors.
- A new combat ability brought by a card PR: it is the subject of its own story.
- Public votes on proposals and contributor rankings (EPIC-07, social life, if needed).
