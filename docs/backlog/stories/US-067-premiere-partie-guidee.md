# US-067 — A guided first game

- **Epic**: EPIC-11
- **Status**: Done
- **Priority**: Should
- **Size**: L
- **Branch**: `us-067-premiere-partie-guidee`

## Story

As a **colleague discovering HIPMaster**, I want **a first game guided step by step** so that **I understand the rules
in 5 minutes, without reading anything beforehand**.

## Acceptance criteria

- [x] **Given** a visitor who has never played, **when** they arrive on the home page or the "Play" screen, **then**
      "Learn to play (5 min)" is offered. It stays reachable from the "How to play" help.
- [x] **Given** the guided game, **then** it pits fixed starter decks against Intern, with a fixed seed: the starting
      hand and the draws are known in advance (replayable engine, ADR 0013).
- [x] **Given** each step (Throughput and deploying; attacking the System; the counter-attack between components;
      Guard; discarding to gain Throughput; ending the turn; victory), **then** a bubble explains what to do,
      highlights the relevant area, waits for the right gesture and politely refuses any other gesture.
- [x] **Given** the end of the guided game, **then** the screen congratulates the player and offers a game against
      Intern with the hint enabled (US-066). The guided game earns no booster.
- [x] Bubbles announced to screen readers, usable with the keyboard and at 375 px; e2e journey that follows the guided
      game to the end.

## Notes

- To be done after US-059 (board that fits on a phone screen), so as not to redo the bubbles.
- The scenario (decks, seed, steps) is versioned domain data, like the catalogue (ADR 0011).
- Choices made ([ADR 0041](../../decisions/0041-partie-guidee-graine-fixe.md)):
  - **Scenario** (`packages/domain/src/combat/partie-guidee.ts`): the player's "Starter" deck, the bot's deck made of
    small components and two Drop folders (Guard), seed 1262 (the player starts), against Intern. 12 guided steps over
    three turns (deploy, end, attack the System, decommission LLM to deploy two cards, end, Guard, counter-attack,
    System reachable again, deploy, end), then a 13th, free one. A test replays the scenario: each expected action is
    legal at its step, the Guard is there when the bubble talks about it, and the game is then won following the hints
    on turn 11 (25 actions), well under 5 minutes.
  - **API**: `POST /api/v1/parties` with `guidee: true` (deck and level ignored); every response carries `guide`, the
    current step (step n expects the n-th action, the game's version). No reward.
  - **Screen**: the "Step n / 13" bubble above "End my turn", announced to screen readers; what it designates carries
    the golden dotted outline of the hint (US-066); another gesture is politely refused ("Not just yet: follow the
    step…"), without a request; "Skip the guide" at any time. The help does not open by itself in the guided game, and
    the hint is only offered at the last, free step.
  - **Entry points**: on the "Play" screen, "First game? Learn to play (5 min)" at the top as long as the guide is
    neither finished nor skipped, then "Review the rules by playing" at the bottom; a link from the home page (same
    condition) and from the "How to play" help. Finished or skipped is kept in the browser
    (`hipmaster.partie-guidee-finie`, ADR 0032).
  - **End**: "Well done, you know how to play!", with no booster, and "Play against Intern with the hint", which
    enables "A hint every move" and opens the "Play" screen (Intern preselected).
  - **Gap**: the server does not refuse an out-of-scenario action (the refusal is done by the screen): a learning game
    has nothing at stake, and whoever skips the guide carries on freely against Intern.

## Log

- 2026-10-23 — created, at the project owner's request ("a tutorial mode").
- 2026-10-24 — refined and started: choices noted above (ADR 0041).
- 2026-10-24 — delivered: guided game: fixed decks and seed against Intern, 12 steps served by the API that wait for the right gesture and politely refuse the others, skippable, then free play to victory, with no booster (ADR 0041)
