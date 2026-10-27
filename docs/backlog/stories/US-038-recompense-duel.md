# US-038 — A booster for a duel victory

- **Epic**: EPIC-06
- **Status**: Done
- **Priority**: Could
- **Size**: S
- **Branch**: `us-038-recompense-duel`

## Story

As a **signed-in player**, I want to **win a booster when I win a duel** so that **I have a reason to challenge my
colleagues**.

## Acceptance criteria

- [x] A duel victory earns a booster, under the same daily cap as victories against the bot (US-025), only once per
      duel.
- [x] A victory by concession or forfeit counts, except against an opponent already faced the same day (to
      discourage collusion).
- [x] The end screen announces the booster won; API and screen tests.

## Notes

- Reuse the `recompenses` table (US-025), whose key becomes the game or duel identifier.

## Log

- 2026-10-19 — created (split of EPIC-06, ADR 0020 proposed).
- 2026-10-19 — `recompenserVictoire` also serves duels (the `partie_id` column of `recompenses` carries the game or
  duel identifier); new `motif` column (migration `0007_motif_recompense`): "plafond" or
  "adversaire-deja-affronte". A won duel exposes `recompense` to the winner only, decided once. A victory by
  concession or forfeit earns no booster if another duel between the two players was created the same UTC day. End
  screen: booster won, cap reached, or "only counts once a day against the same opponent". Tests: API (2), screen
  (1), e2e (booster announced to the winner of a concession).
- 2026-10-19 — delivered: Booster for a duel victory, shared cap, safeguard against collusion
