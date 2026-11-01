# US-021 — Bot levels

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-021-niveaux-bot`

## Story

As a **player**, I want to **choose the bot's difficulty** so that **I can progress, from beginner to seasoned
player**.

## Acceptance criteria

- [x] Three levels, from the simplest to the strongest, named after the universe: **Nightly Batch** (the current one,
      predictable), **ESB Architect** (medium) and **Autonomous Agent** (hard). Each level sees only its own view of
      the game (no cheating).
- [x] The ESB Architect and Autonomous Agent levels **evaluate the consequences of their actions** with the engine, on a
      state rebuilt from their view (hidden cards are replaced by neutral cards).
- [x] The simulation shows a clear progression: ESB Architect wins more than half of its games against Nightly Batch
      (initial target 60%, achieved 55%: the game's randomness caps the gap, see the notes), Autonomous Agent at least
      55% against ESB Architect (achieved 58%) and 63% against Nightly Batch; results recorded in
      [cartes-set-1.md](../../produit/cartes-set-1.md). `npm run simuler` also compares the levels.
- [x] A bot turn stays fast: under 200 ms on average for the strongest level (response target: 3 s for a front-end
      API).
- [x] The API lists the levels (`GET /api/v1/niveaux`) and accepts the level when a game is created (Nightly Batch by
      default); OpenAPI contract up to date.
- [x] On screen, the level choice comes before the deck choice, and the level is recalled during the game.
- [x] Domain tests (bot choices, state reconstruction), API tests and screen tests; e2e journeys and axe-core audit
      green.

## Notes

- The "medium" level (ESB Architect) targets the EPIC-04 indicator: about one game in two won against a beginner
  player.
- **What the simulations taught** (300 games per trial): a purely immediate choice is weaker than Nightly Batch (it does
  not see that a decommission makes it possible to deploy a card); looking one move ahead on all actions is the best
  setting; going further into the turn, or simulating the opponent's reply on hidden cards replaced by neutral cards,
  makes the bot **weaker**. The evaluation weights change the result little (± 5 points).
- An Autonomous Agent turn takes 7 ms on average, 44 ms at worst (127 turns measured).
- The player's view now exposes their own markers ("once per turn", protections), so that the reconstruction is
  faithful; a test checks that the rebuilt state offers exactly the same actions as the real game.

## Log

- 2026-10-18 — created, after the project owner's choice ("you will evaluate that better than I will").
- 2026-10-18 — `reconstitution.ts`, `bots-forts.ts` (evaluation, adjustable search), `niveaux.ts`; `simuler` compares
  two strategies; simulation script extended to the levels; API `GET /niveaux` and level at creation; screen:
  difficulty choice and reminder during the game; 4 domain tests, 3 API tests, screen and e2e updated. In review.
- 2026-10-18 — delivered: three bot levels (Nightly Batch, ESB Architect, Autonomous Agent), no cheating, progression measured by simulation
