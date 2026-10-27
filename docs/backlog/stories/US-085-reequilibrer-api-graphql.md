# US-085 — Rebalance the GraphQL API card

- **Epic**: EPIC-13
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `claude/sharp-ptolemy-b65de6`

## Story

As a **player**, I want **the GraphQL API card to strengthen a deck without making it dominant** so that I can **keep
games close whichever deck hosts it**.

## Acceptance criteria

- [x] **Given** the US-029 measurement (`npm run simuler:carte -- 74`), **then** we know where the Legacy deck's gap
      comes from: the card itself or the cards it replaces there.
      → Both: the tool removes two weak cards in Legacy (a 3/4 common with no effect already gains 7 to 11 points
      there), but on an equal footing (Webhook 2/3 in place of two Pub/Sub in Modern) the card wins 18 to 20 points:
      the draw is too strong for 3 Throughput.
- [x] **Given** the card at fault, **then** its cost, statistics or draw cap are adjusted, with no new ability; if it
      is the tool, its replacement rule is corrected.
      → **4 Throughput** instead of 3, statistics (2/3) and effect unchanged. Tried and rejected: 1/3, 2/2, a single
      card drawn (Legacy still +10 to +15). Tool rule kept: breaking ties in favour of a pair in the deck moved the gap
      to Modern (+18 to +20) and made API First and EDA move.
- [x] **Given** two seeds at 400 games per duel, **then** no loaner deck wins or loses 10 points or more with the
      card, and `npm run simuler` (loaner decks) stays between 40 and 60%.
      → Gaps from −6 to +3 on seeds 1 and 2; `npm run simuler`: 45 to 54% (the loaner decks do not contain the card).
- [x] The measurements are recorded in `docs/produit/cartes-set-1.md`; the fr and en texts follow the effect if it
      changes.
      → Section "API GraphQL passe à 4 de Débit"; the effect does not change, so no text or translation; the example
      in the contributor guide (`docs/contribuer/regles-cartes.md`) follows the new cost.

## Notes

- Finding from US-029 while trying `scripts/simuler-carte.ts` on cards 72 to 74: with two GraphQL APIs, Legacy wins 13
  to 18 points against each of the three loaner decks (Modern +1 to +4, Hybrid +1 to +10). US-077 had only measured
  the card in the Modern deck.
- Game change: the project owner validates before merging.
- Tool limit, left as it is: a new 3-Throughput card takes the place of Universal Messaging and MWS in Legacy, the
  weakest of the deck; it leaves there with a 7 to 11 point lead over a neutral card. A ⚠️ on Legacy alone, for a
  3-Throughput card, is therefore to be checked by hand against this control.

## Log

- 2026-10-27 — created, following the US-029 finding.
- 2026-10-27 — measurements: effect-free controls (SOAP / WSDL, Webhook) and hand-picked replacements to separate the
  tool's effect from the card's; four card settings tried on seed 1; trial of a "pair first" replacement rule,
  abandoned; cost 4 confirmed on seeds 1 and 2.
- 2026-10-27 — delivered: GraphQL API goes to 4 Throughput (statistics and effect unchanged): no loaner deck moves by
  10 points or more on two seeds; measurements and controls recorded in cartes-set-1.md
