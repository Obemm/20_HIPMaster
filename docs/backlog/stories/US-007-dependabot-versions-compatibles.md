# US-007 — Dependabot only proposes compatible versions

- **Epic**: EPIC-00
- **Status**: Done
- **Priority**: Must
- **Size**: XS
- **Branch**: `us-007-dependabot-typescript`

## Story

As a **developer**, I want **Dependabot not to propose versions that are incompatible with the stack**
so that **I only receive mergeable updates, with no red PRs to sort through**.

## Acceptance criteria

- [x] **Given** Angular 22, which requires TypeScript `>=6.0 <6.1`, **when** Dependabot looks for updates, **then** it
      does not propose TypeScript 6.1 or later.
- [x] **Given** Node 24 (`.nvmrc`), **then** Dependabot does not propose a major version of `@types/node` (which must
      follow the major version of Node).
- [x] PR #4 (TypeScript 7, `@types/node` 26), whose `npm ci` fails, is closed with an explanation.

## Notes

Failure observed on 2026-10-16 on PR #4: `npm ci` fails with `ERESOLVE` (typescript-eslint and Angular reject
TypeScript 7). The blocks will be lifted when Angular accepts TypeScript 7, and when the project moves to Node 26.

## Log

- 2026-10-16 — created.
- 2026-10-16 — delivered: TypeScript >=6.1 and major versions of @types/node ignored by Dependabot; PR #4 closed
