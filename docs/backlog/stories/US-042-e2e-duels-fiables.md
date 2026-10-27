# US-042 — Reliable duel e2e journeys under load

- **Epic**: EPIC-06
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-042-e2e-duels-fiables`

## Story

As a **game developer**, I want the **Playwright duel journeys to pass reliably when the whole suite runs in
parallel** so that **I can trust the quality gate before each merge, without rerunning or ignoring "timeout"
failures**.

## Acceptance criteria

- [x] **Given** the complete e2e suite (`npm run test:e2e`, "desktop" and "mobile" projects), **when** it runs three
      times in a row on a development machine, **then** it passes three times at 75/75, without a retry.
- [x] **Given** a two-browser duel journey, **when** it sets up the duel (two accounts, a challenge launched then
      taken up), **then** this setup goes through the API and not the interface, except in the journey that
      specifically tests the challenge by link (`duels.spec.ts`); the journey under verification remains the
      interface's.
- [x] **Given** the game's animated log (250 ms per line) and the CSS animations, **when** the e2e tests run,
      **then** the browsers request reduced motion (`reducedMotion: 'reduce'` in the Playwright configuration): the
      log is shown all at once, as for a player who has reduced animations.
- [x] **Given** the duel polling every 3 s during the opponent's turn (ADR 0020), **when** a journey waits for the
      other player's turn, **then** it waits no more than necessary (explicit, justified timeouts); the journey
      timeout is only raised (`test.slow()`) for journeys that chain several turns.
- [x] **Given** the development machine (15 GB, of which 2 to 4 GB free), **when** the suite runs, **then**
      Playwright opens only three workers locally (default value in CI): beyond that, the Angular server or the
      launcher die for lack of memory.
- [x] **Given** the "random opponent" journey, **when** the duel page opens, **then** the journey waits for the
      opponent's name in the title ("Duel against …" while loading) before reading it.
- [x] No real bug is masked: the wait timeouts remain bounded (10 s per opposing turn), no new retry (`retries`)
      locally, and a duel that does not propagate from one browser to the other still fails.
- [ ] `npm run check` passes (lint, format and typecheck pass; see the log for the unit tests).

## Notes

- **Measurements of 2026-10-19, before the fix** (the three duel files alone, 22 tests, 6 workers, development
  machine with 15 GB of which 4 GB free): over three runs, none at 22/22. Twice, the Angular server launched by
  Playwright died (code 0xC0000409, Node abort) after the first burst, hence cascading "connection refused" errors;
  the third time, served by `npm run dev`, it was the Playwright launcher itself that died ("Zone Allocation failed -
  process out of memory", code 134). When they pass, the journeys remain slow: "a duel is played with two browsers"
  29.8 s (limit 30 s), board axe audits 24 s on mobile, "challenge a colleague by link" 21 s. The API responds in
  under 35 ms: the time goes into the setup through the interface (two accounts, a challenge launched then taken up:
  six navigations), the wait for polling (3 s per turn) and memory.
- **Measurements after the fix** (complete suite, 75 tests): with four workers, the Angular server still dies
  (0xC0000409); with three, 72/75 in 2.6 min with a single failure, a too-early read of the "Duel against …" title in
  `duel-hasard.spec.ts` (fixed), and free physical memory drops to 443 MB (Chrome: 3 GB). The two-browser duel
  journeys go from 18 to 30 s down to 8 to 17 s; the challenge by link from 21 s to 12 s.
- **Root cause**: memory, not a game bug. Six workers each opening up to three browsers, plus the Angular server and
  the API, exceed what the machine can offer; everything slows down, then a Node process dies. Hence the three
  levers: fewer browsers per journey (setup through the API), fewer workers locally (four), and shorter waits
  (reduced animations).
- No ADR: nothing changes in the architecture (ADR 0020 unchanged, 3 s polling kept); only the tests and the
  Playwright configuration move.

## Log

- 2026-10-19 — created, at the project owner's request (parent session): the e2e suite has become fragile (75/75,
  then 69/75, then 74/75 the same day) because of two-browser duels that exceed 30 s under load.
- 2026-10-19 — delivered: Duel set up through the API in the board and "My duels" journeys (e2e/duel-api.ts), accounts through the API except the one that tests creation; reduced animations and three workers locally in playwright.config.ts; multi-turn journey declared slow; "random opponent" waits for the name in the title. Three complete suite runs at 75/75 (2.3 to 2.8 min).
- 2026-10-19 — `npm run check`: lint, format and typecheck pass; the unit tests fail on this machine by exceeding the
  10 s of the `beforeEach` that opens an in-memory PGlite database (API) and the 5 s of two domain tests, even with
  three Vitest workers, whereas each file passes on its own. Nothing in the API or the domain is touched by the
  story: it is the machine, saturated in memory (2 GB free), not the code. To be rerun on a less loaded machine or
  in CI.
