# US-064 — A bot a beginner can beat, a fair game for both players

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-064-bot-equilibre`

## Story

As a **beginner player**, I want **a bot level I can beat, and not to be at a disadvantage when I play second**, so
that **I learn the game by winning games and want to come back**.

## Context

The project owner finds it "almost impossible to win against the bot". A simulation study of 2026-10-22 (360 games per
measurement, lent decks crossed) found two causes:

- **no level is really easy**: "Nightly Batch", presented as easy and preselected, is US-011's old reference bot. A
  "beginner" profile (it deploys its most expensive card, attacks the System whenever it can, otherwise the first
  target, with no spells or decommissioning) beats it only 16% of the time, 7% when playing second; it manages only 11%
  against ESB Architect and 3% against Autonomous Agent;
- **starting gives a big advantage**: Nightly Batch against itself wins 60% of its games when starting, 33% when
  second, with no compensation at all. On a copy of the engine, **+1 Throughput on the second player's first turn**
  evens it out (bot against bot 47 / 47%, beginner against beginner 51 / 54%), whereas one extra card is not enough
  for beginners (70 / 32%).

## Acceptance criteria

Measurements are made by simulation (`npm run simuler`), on crossed lent decks.

- [x] **Given** a game, against the bot or in a duel, **when** the player who plays second starts their first turn,
      **then** they receive 2 Throughput instead of 1; their following turns stay at +1 per turn, 10 at most (ADR 0026,
      which supplements ADR 0010). Domain tests.
- [x] **Given** any bot level, **when** it plays against itself, **then** the player who starts and the second player
      each win between 45 and 55% of the games.
- [x] A new **easy level, "Intern"**, preselected: it plays like a beginner (it deploys its most expensive card,
      attacks the System whenever it can, makes no thoughtful trades). A beginner profile wins **at least 50%** of its
      games against it, a player of the Nightly Batch level **at least 80%**.
- [x] The existing levels become **Medium** (Nightly Batch), **Hard** (ESB Architect) and **Expert** (Autonomous
      Agent), with updated descriptions; the API (`GET /api/v1/niveaux`, default level when creating a game, OpenAPI
      contract) and the selection screen follow.
- [x] `npm run simuler` also measures the beginner profile, the win share of the player who starts and of the second
      player, and each level against the beginner profile; tables reported in
      [cartes-set-1.md](../../produit/cartes-set-1.md) and below.
- [x] The rules ([regles.md](../../produit/regles.md)) and the "How to play" help on the selection screen and the game
      screen explain the second player's Throughput.
- [x] Reward: the current rule stays (one booster per victory against the bot, whatever the level, 3 per day at most);
      confirmed by the project owner on 2026-10-23, Intern included.
- [x] Domain, API and screen tests; `npm run check` passes; e2e journeys and axe-core audit green.

## Results

`npm run simuler -- 200 1`: 1,800 games per line, crossed lent decks; seed 1001 in square brackets when it differs by
more than 2 points. "Before": the engine without the rule, with the US-021 levels. Detail and reading in
[cartes-set-1.md](../../produit/cartes-set-1.md).

| Each player against itself | Before: first / second | After: first / second |
| -------------------------- | ---------------------- | --------------------- |
| Beginner profile           | 73 / 27%               | 54 / 46%              |
| Intern                     | —                      | 53 / 48%              |
| Nightly Batch              | 63 / 36%               | 52 / 46%              |
| ESB Architect              | 66 / 33%               | 54 / 46%              |
| Autonomous Agent           | 62 / 38%               | 49 / 51%              |

| After: bot level          | Beginner (starting / second) | "Nightly Batch" player (starting / second) |
| ------------------------- | ---------------------------- | ------------------------------------------ |
| Intern (easy)             | **56%** (59 / 53%)           | **90%** (91 / 89%)                         |
| Nightly Batch (medium)    | 14% (16 / 12%)               | 50% (53 / 46%)                             |
| ESB Architect (hard)      | 8% (9 / 7%)                  | 44% [40%] (49 / 40%)                       |
| Autonomous Agent (expert) | 4% (5 / 2%)                  | 39% [36%] (42 / 36%)                       |

Before, against Nightly Batch, then presented as easy, a beginner won 14% of their games (21% when starting, 7% when
second). The three targets are met at both seeds: beginner against Intern 56 and 54%, "Nightly Batch" player against
Intern 90%, mirrors between 46 and 54% at every level.

## Notes

- Decision: [ADR 0026](../../decisions/0026-debit-du-second-joueur.md).
- **Reward**: a victory against Intern earns a booster, like against the other levels (US-025: once per game, 3 per
  day at most). Project owner's decision on 2026-10-23: keep it as is, including against the easy level; the daily cap
  already limits abuse.
- The rule lives in the engine (`debuterTour`): it applies to games against the bot as well as to duels, without
  changing anything in the API. The game log announces it to the second player ("You play second: 1 extra Throughput
  on this first turn").
- **The beginner profile** (`choisirActionDebutant`, in `packages/domain/src/combat/bot-stagiaire.ts`) is used as a
  measure: it deploys its most expensive card as long as it can, attacks the System whenever it can, otherwise the
  first permitted target (a Guard), with no spell, incident or decommissioning.
- **Why Intern is not exactly the beginner profile**: against itself, the beginner profile wins one game in two on
  average; the "at least 50%" criterion would therefore come down to a coin toss. Variants tried (1,800 games per
  measurement, crossed decks, seed 1, with the ADR 0026 rule):

  | Intern                                                      | Beginner | "Nightly Batch" player | Mirror (1st / 2nd) |
  | ----------------------------------------------------------- | -------- | ---------------------- | ------------------ |
  | The beginner profile as is                                  | 52%      | 87%                    | 54 / 46%           |
  | Without evolution                                           | 51%      | 86%                    | 54 / 46%           |
  | **A single deployment per turn** (chosen)                   | 56%      | 90%                    | 53 / 48%           |
  | Attack before deploying                                     | 57%      | 88%                    | 54 / 46%           |
  | Without evolution, attack before deploying                  | 56%      | 87%                    | 55 / 45%           |
  | The System, otherwise a Guard it destroys in one hit        | 61%      | 87%                    | 51 / 48%           |
  | The System, otherwise the Guard with one component per turn | 53%      | 87%                    | 54 / 46%           |
  | The System only: nothing when a Guard protects it           | 68%      | 90%                    | 48 / 49%           |

  "A single deployment per turn" leaves the beginner a margin, keeps a balanced mirror and an active bot, which also
  attacks Guards; "the System only" is easier still, but the bot stays inert behind a Guard.

- **ESB Architect now studies 4 candidate actions instead of 3.** With the Throughput rule alone, its mirror stayed at
  56 / 44% at seeds 1 and 1001 (54.7% for the first player on average over six seeds, 10,800 games), outside the
  target, whereas Nightly Batch and Autonomous Agent fell within it. The number of candidates settles this advantage
  (seed 1, 1,800 games per measurement, crossed decks; ESB wins against the other two):

  | Candidates     | Mirror (1st / 2nd) | Against Nightly Batch | Against Autonomous Agent |
  | -------------- | ------------------ | --------------------- | ------------------------ |
  | 2              | 58 / 42%           | 45%                   | 31%                      |
  | 3 (before)     | 56 / 44%           | 56%                   | 41%                      |
  | **4** (chosen) | 54 / 46%           | 59%                   | 45%                      |
  | 5              | 53 / 47%           | 61%                   | 47%                      |
  | 6              | 51 / 49%           | 61%                   | 48%                      |

  With 4 candidates, ESB falls within the target and stays between Nightly Batch and Autonomous Agent; beyond that, it
  almost catches up with Autonomous Agent. A bot that studies too few actions benefits more from the first turn's
  lead.

## Log

- 2026-10-22 — created, following the simulation study of the same day.
- 2026-10-22 — second-player rule in the engine (game log, rules, "How to play" help); beginner profile and
  `simulerCroise`; Intern "a single deployment per turn", chosen among eight variants; ESB Architect at 4 candidates
  to fall within the fairness target; API, screen and e2e follow; before and after measurements at seeds 1 and 1001. `npm run check` and `npm run test:e2e` (75 journeys) pass.
- 2026-10-23 — `main` merged in (US-046, US-049, US-055): `npm run check` passes. Ports 3000 and 4200 being taken by
  another session's servers, the merged branch's e2e journeys are left to the PR's CI.
- 2026-10-23 — delivered: second player's Throughput rule (ADR 0026), easy Intern level preselected, ESB Architect at 4 candidate actions; a beginner beats Intern 54 to 56% of the time, a player of the Nightly Batch level 90%, and the first and second players each win between 46 and 54% in the mirror at every level
- 2026-10-23 — project owner's decision: a victory against Intern earns a booster, like against the other levels (3
  per day at most).
