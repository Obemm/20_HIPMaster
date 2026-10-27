# US-027 — Contributor guide: the rules for creating a card

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-027-guide-contributeur`

## Story

As an **architect who wants to propose a card**, I want **a clear guide to the creation rules** so that **I can design a
fair, playable and educational card without having to read the game's code**.

## Acceptance criteria

- [x] A `CONTRIBUTING.md` at the root presents the approach in a few lines (fork, kit, PR) and points to the guide
      `docs/contribuer/regles-cartes.md`; the `README.md` points to it too.
- [x] The guide explains in one page: families, card types, rarities, statistics (Throughput, Attack, HP) and existing
      abilities, with their **orders of magnitude per rarity** taken from the current catalogue.
- [x] It gives a proposal **template**: name, family, type, target rarity, statistics, abilities, optional effect,
      "In real life" text (110 characters at most), "Learn more" sheet (ADR 0036), sources, displayed author name.
- [x] It sets the **content rules**: nothing confidential (server names, addresses, customers, unfixed vulnerabilities,
      internal data), the repository being public **from the moment the PR is opened**; no disparaged brand; a
      benevolent tone; a text understandable by a non-specialist.
- [x] It shows **two annotated examples** taken from the catalogue (a good card, and a reworked card).
- [x] It explains the life cycle of a proposal: PR, review, balancing, validated illustration, merge, go-live and
      credit; and the alternative for those who do not use GitHub (proposal by message, integrated by the project
      owner).

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md); build on
  [regles.md](../../produit/regles.md), [univers.md](../../produit/univers.md) and
  [cartes-set-1.md](../../produit/cartes-set-1.md).
- Documentation only: no page in the game (the initial plan included one, useless for contributors who go through
  GitHub).

## Log

- 2026-10-19 — created (EPIC-08, to be handled later).
- 2026-10-27 — refined (ADR 0050): the guide targets contributors who go through a PR; no more page in the game.
- 2026-10-27 — delivered: Contributor guide: CONTRIBUTING.md and docs/contribuer/regles-cartes.md (families, types, rarities, orders of magnitude taken from the 74 cards, abilities, In real life, sheet, content rules, template, GraphQL API and API First examples, PR life cycle).
