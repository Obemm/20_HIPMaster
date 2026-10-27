# 0001 — Next.js + React + Tailwind CSS, strict TypeScript

- **Date**: 2026-10-16
- **Status**: Superseded by 0006

## Context

An online TCG is a highly interactive **application** (animated booster opening, game board, filterable collection)
with accounts and an authoritative server (draws, combats). The interface and the server need to live in the same
project, in TypeScript like the other projects.

## Decision

Next.js 16 (App Router, React 19, Server Components and Server Actions), Tailwind CSS 4, strict TypeScript
(`noUncheckedIndexedAccess`), Node 24, npm.

## Alternatives considered

- **Astro** (used for SiteML): excellent for content pages, less suited to a stateful, rich application.
- **Vite + React (SPA) + separate API**: two projects to maintain, more plumbing code.
- **SvelteKit**: very good, but its ecosystem (components, animation, examples) is smaller than React's.

## Consequences

- A single repository for the interface, the API (Server Actions / Route Handlers) and the server logic.
- Next.js moves fast: read `node_modules/next/dist/docs/` before using an API (see `AGENTS.md`).
- Can be deployed on Vercel or on any Node server / container.
