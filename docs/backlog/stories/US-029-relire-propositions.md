# US-029 — Review a card proposed in its pull request

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-029-relecture-pr-carte`

## Story

As the **project owner**, I want to **review each card proposed in its PR with a checklist** so that **I only publish
cards that are accurate, balanced and free of sensitive content**.

## Acceptance criteria

- [x] A "card" PR template (`.github/PULL_REQUEST_TEMPLATE/carte.md`) carries the proposal and the checklist:
      technical accuracy, understandable "In real life" text, confidentiality, no duplicate of an existing card,
      plausible balance, compliant illustration, original attached.
- [x] A `CODEOWNERS` file asks for the project owner's review on every PR.
- [x] The CI of a PR coming from a fork checks the catalogue invariants (`npm run check`) without any secret.
- [x] The balance of a proposed card is measured by simulation (`npm run simuler:carte`, two copies in each lent deck
      against the three decks, method of US-077), run in CI on each PR for the new cards and shown in the job
      summary; the approach is described in the guide.
- [x] The guide (US-027) states the possible answers and the target turnaround (under two weeks): merged, to be
      reworked, or refused with a reason.

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md). Replaces the in-game review queue of the
  initial plan (reviewer role, statuses in the database, protected routes).
- `npm run simuler -- 200` takes 10 to 30 minutes: too long for each PR; a reduced volume is to be planned.

## Log

- 2026-10-19 — created (EPIC-08, to be handled later).
- 2026-10-27 — refined (ADR 0050): the review happens in the GitHub PR, no longer in the game.
- 2026-10-27 — `scripts/simuler-carte.ts`: 400 games per duel, a minute and a half per card; the signal is a gap of
  10 points or more between the unchanged deck and the deck with the card (rather than absolute bounds: the baseline
  itself varies by a few points). Tried on cards 72 to 74 recovered through `--base` (catalogue from before US-077):
  GraphQL API makes the Legacy deck win noticeably more (+17 to +23 points at 100 games), which the US-077
  measurement, done in the Modern deck alone, did not show. Confirmed at 400 games on seeds 1 and 2: Legacy +13 to
  +18 points against each deck, Modern and Hybrid +1 to +10. To be examined outside this story (the card, or the
  cards it replaces in Legacy).
- 2026-10-27 — `CODEOWNERS` asks for the project owner's review; branch protection (mandatory review) is not
  enabled: only the project owner can merge.
- 2026-10-27 — delivered: Card PR template (contributor's checks, reviewer's checklist), CODEOWNERS, simuler:carte script and CI job Balance of new cards; guides updated.
