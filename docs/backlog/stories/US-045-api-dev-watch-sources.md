# US-045 — `npm run dev` restarts the API only when its sources change

- **Epic**: EPIC-00
- **Status**: Done
- **Priority**: Must
- **Size**: XS
- **Branch**: `us-045-api-dev-watch-sources`

## Story

As a **developer**, I want **the API started by `npm run dev` to restart only when I change its code** so that **I can
develop without it restarting in a loop on a loaded machine**.

## Context

Finding of 2026-10-20: `npm run dev` made the API restart in a loop. The API's `dev` script runs
`node --watch src/server.ts`, which watches **the whole graph of loaded modules**, `node_modules` included. On a
saturated machine (antivirus, low memory), files in `node_modules` are seen as "modified" while loading, hence a
restart, which reloads the modules, and so on. Temporary workaround: a `hipmaster-sans-watch` configuration in
`.claude/launch.json`, not committed, which starts the API without watching.

## Acceptance criteria

- [x] **Given** `npm run dev`, **when** the API starts, **then** only its sources (`apps/api/src`), its migrations
      (`apps/api/drizzle`) and the game logic (`packages/domain/src`) are watched, not `node_modules`.
- [x] **Given** the API started by `npm run dev`, **when** a file in `apps/api/src` or `packages/domain/src` is
      modified, **then** the API restarts once.
- [x] **Given** the API started by `npm run dev` and no modification, **then** it does not restart.
- [x] The `hipmaster-sans-watch` workaround is removed from `.claude/launch.json`.

## Notes

- `--watch-path` replaces watching the module graph with watching only the folders given (Node ≥ 22, supported on
  Windows and macOS, and on Linux since the recursive `fs.watch` watching).
- Measurements of 2026-10-22 (API alone, 45 s without modification): 3 restarts with `--watch`, none with
  `--watch-path`. With `--watch-path`, modifying `apps/api/src/config.ts` then `packages/domain/src/index.ts` gives
  exactly one restart each. Full `npm run dev`: no restart in 60 s.

## Log

- 2026-10-22 — created, to replace the `hipmaster-sans-watch` workaround of 2026-10-20.
- 2026-10-22 — delivered: the API now watches only src, drizzle and packages/domain/src; no more restarts without a modification, a single one per modification; hipmaster-sans-watch workaround removed
