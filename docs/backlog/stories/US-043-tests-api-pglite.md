# US-043 — API tests that stay robust on a loaded machine

- **Epic**: EPIC-00
- **Status**: Done
- **Priority**: Must
- **Size**: S
- **Branch**: `us-043-tests-api-pglite`

## Story

As a **developer**, I want **`npm run check` to pass even when my machine is saturated** so that **I do not mistake a
timeout for a regression, nor rerun the tests at random**.

## Context

Finding of 2026-10-19 (machine with 15 GB, 2 GB free): the API tests (`comptes`, `boosters`, `duels`, `recompenses`)
open an in-memory PGlite database **in each `beforeEach`**. Measurement: one opening costs ≈ 1.6 s (of which ≈ 1.55 s
loading PGlite's WASM, the migrations take only 50 ms), i.e. 43 openings and nearly 70 s of WASM for these four files.
When the 20 files run in parallel, the `beforeEach` exceeds the default 10 s `hookTimeout`, even with
`--maxWorkers=3`, whereas each file passes on its own. Two domain tests that simulate about ten complete games
(`niveaux.test.ts`, `parties/schemas.test.ts`) also exceed the default 5 s.

## Acceptance criteria

- [x] **Given** an API test file, **when** it runs, **then** a single PGlite database is opened for the whole file
      (`beforeAll`) and the tables are emptied before each test, which therefore starts from an empty database as
      before.
- [x] **Given** a new table added to the Drizzle schema, **then** it is emptied too without touching the test code
      (the list of tables comes from the schema).
- [x] **Given** the two domain and API tests that simulate complete games, **then** their timeout is raised
      explicitly, with the reason in a comment, without reducing the number of simulated games.
- [x] **Given** the `api` project of `vitest.config.ts`, **then** the hook timeout is raised and justified in a
      comment (one WASM load per file, whose duration depends on the machine and not on the code).
- [x] **Given** the memory of a PGlite (≈ 550 MB resident), **then** the API test files run one after the other (a
      single in-memory database at a time), the domain remaining in parallel.
- [x] `npm run check` passes, and `npx vitest run` passes three times in a row.

## Notes

- No change in the behaviour of the API or the domain: only the test setup changes.
- The raised timeouts do not hide a functional regression: they cover a WASM load and game simulations, whose
  duration is by nature tied to the machine.
- Second finding during the story: once the timeouts were settled, one run in four still died from lack of memory
  ("Fatal process out of memory", Vitest worker process killed on `comptes.test.ts`): with 12 cores, Vitest started the
  5 PGlite files at once, i.e. ≈ 3 GB for 4.4 GB free. Hence `fileParallelism: false` on the `api` project alone.
- Distinct from US-042 (reliable e2e), which dealt with the same saturation on the Playwright side.

## Log

- 2026-10-19 — created, after measuring the cost of opening PGlite.
- 2026-10-19 — delivered: one PGlite database per test file (tables emptied between tests), API files run in sequence, timeouts raised and justified; check and vitest ×4 green on a saturated machine
