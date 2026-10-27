# US-039 — Explain attacks and combat resolution

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Must
- **Size**: S
- **Branch**: `us-039-expliquer-attaques`

## Story

As a **beginner player**, I want to **understand that I must choose an attacker and its target myself each turn, and
how a combat is resolved** so that **I deal damage to the opponent instead of just deploying cards**.

## Acceptance criteria

- [x] `docs/produit/regles.md` states explicitly that nothing attacks on its own (except Autonomous agents): each
      turn, you choose the attacker then the target, in addition to deploying cards.
- [x] `docs/produit/regles.md` describes the resolution of an attack, step by step (conditions, strengths with Hub,
      simultaneous exchange, Broadcast and Reactive, destructions), consistent with the engine
      (`packages/domain/src/combat`).
- [x] Worked examples with set 1 cards: an exchange that destroys both cards, an attack on the System with a Hub,
      Guard and persistent damage, Reactive, Evolution.
- [x] The game's short rule (`hip-regle-courte`) says that each turn you must select the attacker then the target,
      and points to a short combat example (counter-attack).
- [x] Before ending their turn, a player who has components ready to attack and has not attacked is warned (without
      blocking the end of the turn).
- [x] Screen tests; `npm run check` passes; `npm run test:e2e` passes.

## Notes

- Feedback from the project owner after a game lost without having dealt a single point of damage (log of
  2026-10-19): they deployed their cards without ever launching an attack, not knowing they had to select them.
- The "in the game" part waits for US-034 (duel screen) to be committed: it also modifies
  `apps/web/src/app/jeu/regle-courte.ts` (project owner's decision, 2026-10-19).
- No game rule on the front-end side (ADR 0004): the warning relies on the `attaquer` actions offered by the API
  view.
- Idea: the log could also show the payment of On-premises upkeep, already recorded by the engine (`entretien`
  event).

## Log

- 2026-10-19 — created, after the project owner's feedback. Rules completed: "nothing attacks on its own", "Resolve
  a combat" section and five examples checked against the engine. The in-game part waits for US-034.
- 2026-10-19 — delivered: short rule (attacker then target, counter-attack example) and non-blocking warning before ending the turn when components can still attack; screen tests, check and e2e green
