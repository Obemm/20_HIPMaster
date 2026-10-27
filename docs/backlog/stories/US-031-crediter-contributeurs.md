# US-031 — Credit contributors in the game

- **Epic**: EPIC-08
- **Status**: To refine
- **Priority**: Could
- **Size**: S
- **Branch**: `us-031-crediter-contributeurs`

## Story

As a **contributor**, I want to **see my name on the cards I proposed** so that **I am recognised and want to propose
more**.

## Acceptance criteria

- [ ] The detail of a card that has an author (US-030) shows "Proposed by …"; the text is translated (ADR 0042).
- [ ] The catalogue can be filtered on community cards.
- [ ] A "Contributors" page lists the authors and their published cards.
- [ ] Screen tests; e2e journey and axe-core audit green.

## Notes

- The display name comes from the PR (chosen by the author): it is not linked to any game account (ADR 0050). The
  initial plan offered a copy of the card in the author's collection: dropped, for lack of a link between the author
  and an account.

## Log

- 2026-10-19 — created (EPIC-08, to be handled later).
- 2026-10-27 — refined (ADR 0050): credit taken from the catalogue's author field.
