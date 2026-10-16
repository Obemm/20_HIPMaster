# 0007 — Fastify REST API and npm workspaces monorepo

- **Date**: 2026-10-16
- **Status**: Accepted
- **Completes**: [0004](0004-logique-de-jeu-pure.md)

## Context

With Angular ([0006](0006-angular-pwa.md)), the front end and the server become two applications. The server must be
authoritative on the rules ([0004](0004-logique-de-jeu-pure.md)). The reference that inspires the project (ADR 0005)
calls for **REST** APIs, designed **contract first** and bounded (timeouts, request sizes), but does not prescribe a
server framework.

## Decision

- **npm workspaces monorepo**:
  - `apps/web` — Angular front end;
  - `apps/api` — **Fastify 5** REST API (TypeScript, Node 24), inputs and outputs validated with **Zod**;
  - `packages/domain` — pure game logic (`@hipmaster/domain`), with no dependency on Angular, Fastify or the database.
- Versioned API paths `/api/v1/…`, plural resources, errors in _Problem Details_ format (RFC 9457).
- **OpenAPI** contract written and reviewed before each new resource (design first), in `apps/api/openapi/`.
- Limits set from the start: body size (1 MB), request timeout (10 s).
- In development, the front end calls `/api` through the Angular server proxy: a single origin, no CORS.

## Alternatives considered

- **NestJS**: structure close to Angular, but heavy (decorators, injection) for a game API; slower tests.
- **Express**: ageing, with no built-in schema validation or typing.
- **Nx** for the monorepo: powerful but oversized; npm workspaces are enough.

## Consequences

- The game logic is tested on its own (`packages/domain`), the API is tested by request injection (`fastify.inject`).
- Two processes to run in development (`npm run dev` starts them together).
- The database schema and the Drizzle migrations ([0003](0003-postgresql-drizzle.md)) live in `apps/api`.
