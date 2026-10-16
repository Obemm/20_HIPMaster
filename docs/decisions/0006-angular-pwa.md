# 0006 — Angular for the front end, delivered as a PWA

- **Date**: 2026-10-16
- **Status**: Accepted
- **Supersedes**: [0001](0001-nextjs-tailwind.md)

## Context

ADR 0001 had chosen Next.js (React). Aligning with the reference that inspires the project (ADR 0005, kept locally)
leads to **Angular** for the front end, delivered as a **PWA** rather than a native application for a game aimed at the
general public.

## Decision

- **Angular 22**: standalone components, signals, change detection without zone.js, Angular CLI (`@angular/build`),
  Vitest unit tests built into the CLI.
- Single-page application (no SSR: a game does not need page-by-page indexing); made installable as a **PWA**
  (manifest + service worker) in a dedicated story.
- **Tailwind CSS 4** for styling.
- Code in `apps/web/`.

## Alternatives considered

- **Keeping Next.js**: rejected, nothing justifies a departure from the reference at the start.
- **Native Android/iOS application**: suited to internal applications with readers or offline use, not to a game for the
  general public.

## Consequences

- The front end contains **no game rule**: it displays and calls the API ([0007](0007-api-rest-monorepo.md)).
- Angular ecosystem: RxJS is available, but signals are preferred for interface state.
- Angular is updated at least every six months (good practice).
