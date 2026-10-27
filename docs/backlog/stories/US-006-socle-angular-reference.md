# US-006 — Angular foundation aligned with the the company reference

- **Epic**: EPIC-00
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-006-socle-angular`

## Story

As the **project owner**, I want **the first technical choices to rely on the the company technology ADRs**
so that **I work with the Group's stack and practices, without bearing its enterprise obligations**.

## Acceptance criteria

- [x] An ADR sets the reference: each relevant the company technology ADR is kept, adapted or rejected, with its reason.
- [x] The ADRs that contradict the reference (0001 Next.js) are replaced by new ADRs, without being rewritten.
- [x] **Given** the repository, **when** I type `npm run dev`, **then** the Angular front end (localhost:4200) and the
      API (localhost:3000) start, and the front end displays the state of the API.
- [x] The game logic lives in a pure package `packages/domain`, used by the API.
- [x] `npm run check`, `npm run build` and `npm run test:e2e` pass; the CI is adapted.
- [x] SonarWay-type static analysis rules (eslint-plugin-sonarjs) apply locally and in the CI.
- [x] README, CLAUDE.md, BOARD and CHANGELOG are up to date.

## Notes

Source: reference of the the company ADRs from the [ref] Confluence space (mirror dated 2026-09-16 in
`(local mirror)`). User's decision on 2026-10-16:
**inspiration only** (no Okta, Azure Repo, TAD or LeanIX imposed) and **switch to Angular** (the company [ref]).

## Log

- 2026-10-16 — created; branch opened.
- 2026-10-16 — ADRs 0005 to 0009 written, 0001 replaced. Next.js removed; npm workspaces monorepo; `packages/domain`
  and Fastify API (`/api/v1/sante`, `/api/v1/raretes`, Problem Details errors) tested (9 tests), ESLint + SonarJS green.
  **Blocked**: Angular 22 requires Node ≥ 24.15 (installed: 24.14) — Node update to be done by the project owner.
- 2026-10-16 — delivered: ADRs 0005 to 0009 inspired by the the company reference; Angular 22 + Fastify 5 API + packages/domain; SonarJS; 12 unit tests and 4 e2e journeys green
