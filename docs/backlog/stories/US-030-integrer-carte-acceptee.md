# US-030 — A card's author in the catalogue, and a first community card

- **Epic**: EPIC-08
- **Status**: In progress
- **Priority**: Should
- **Size**: M
- **Branch**: `us-030-auteur-carte`

## Story

As the **game maintainer**, I want a **catalogue card to be able to carry its author** and to **test the kit with a
first colleague** so that **community cards are published without re-entry, with their credit**.

## Acceptance criteria

- [x] A domain card can carry an optional **author** (display name chosen by the contributor); existing cards have
      none; the catalogue API exposes it (OpenAPI contract updated before the code).
- [x] The catalogue invariant tests accept cards with an author, following the existing numbers.
- [x] The card brief (US-028) fills in this field.
- [ ] **Given** an architect colleague and the kit, **when** they open their PR from a fork, **then** it is reviewed,
      merged and put online; whatever got stuck is fixed in the guide or the brief.

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md). Replaces the integration command of the
  initial plan (`npm run carte:integrer`), now useless: the contributor's PR is the integration.
- The illustration follows the chain of ADR 0047; failing that, the placeholder illustration (ADR 0016).

## Log

- 2026-10-19 — created (EPIC-08, to be handled later), under the title "Integrate an accepted card into the
  catalogue".
- 2026-10-27 — refined (ADR 0050): an author field and a first trial with a colleague, no command any more.
- 2026-10-27 — optional `auteur` field (40 characters at most, not translated) in the domain, the OpenAPI contract,
  the API and the front-end model; catalogue invariant (no author on cards 1 to 74, short name without superfluous
  whitespace); the brief and the template fill it in. The first trial with a colleague remains: the story stays in
  progress.
