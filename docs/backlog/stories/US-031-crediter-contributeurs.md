# US-031 — Credit contributors in the game

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Could
- **Size**: S
- **Branch**: `us-031-crediter-contributeurs`

## Story

As a **contributor**, I want to **see my name on the cards I proposed** so that **I am recognised and want to propose
more**.

## Acceptance criteria

- [x] The detail of a card that has an author (US-030) shows "Proposée par …" / "Proposed by …", with a link to the
      Contributors page; the text is translated (ADR 0042), the name is not.
- [x] The catalogue gets a third filter, "Origine" ("All cards" / "Community cards"), built like the family and rarity
      filters and combined with them; when it is on, a line points to the Contributors page.
- [x] A "Contributors" page (`/contributeurs`) lists the authors in alphabetical order, each with their published
      cards (by number); a card opens its detail over the page, as in the catalogue. Reachable from the footer and from
      the catalogue.
- [x] While no card has an author, the page says so and points to the contributor guide (`CONTRIBUTING.md`).
- [x] Screen tests with a fixture card that has an author; e2e journey (author injected into the API's answer, never
      into the real catalogue) and axe-core audit green in both themes; mobile first, keyboard accessible.
- [x] `docs/contribuer/regles-cartes.md`, "What happens to a proposal": the Credit step describes what is shown.

## Notes

- The display name comes from the PR (chosen by the author): it is not linked to any game account (ADR 0050). The
  initial plan offered a copy of the card in the author's collection: dropped, for lack of a link between the author
  and an account.
- **No new API route, no ADR**: the contributors list is derived in the front end from `GET /api/v1/cartes`, which
  already carries `auteur` (US-030) and is kept in the public cache and in the front end's memory (ADR 0039). A
  `/contributeurs` route would duplicate the catalogue for a few dozen cards at most. The grouping is display logic,
  so it lives in the front end (`apps/web/src/app/cartes/communaute.ts`), not in the domain.
- Alphabetical order of the authors (locale collation): no ranking by number of cards, which EPIC-08 leaves out of
  scope.
- The card thumbnail gets an optional heading level, so that on the Contributors page the cards (h3) sit under their
  author (h2).

## Log

- 2026-10-19 — created (EPIC-08, to be handled later).
- 2026-10-27 — refined (ADR 0050): credit taken from the catalogue's author field.
- 2026-10-28 — refined (criteria, contributors derived from the cached catalogue, no ADR); work started.
- 2026-10-28 — delivered: Contributors credited in the game: 'Proposed by' on the card detail, community filter in the catalogue, Contributors page
