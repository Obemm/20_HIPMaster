# 0009 — Code quality: SonarWay rules and blocking quality gate

- **Date**: 2026-10-16
- **Status**: Accepted

## Context

The target is SonarCloud with the SonarWay profile and a quality gate that blocks merging. For a private repository,
SonarQube Cloud is paid; it is free for a public repository.

## Decision

- **From now on**: the SonarJS rules (`eslint-plugin-sonarjs`, the local equivalent of SonarWay for TypeScript) are part
  of ESLint; `npm run check` is the **quality gate**: it blocks the commit (Husky) and the PR (CI).
- Test **coverage** is measured (`npm run test:coverage`), with a target of 80% on `packages/domain`.
- **The day the repository is published on GitHub**: plug in SonarQube Cloud (SonarWay profile, analysis of every PR,
  quality gate required in the protection of `main`).
- Tests: Vitest (unit), **Playwright** (end to end, with an axe-core accessibility audit); Postman or Bruno for manual
  exploration of the API.

## Alternatives considered

- **SonarQube Cloud right away on a private repository**: paid for a personal project.
- **Self-hosted SonarQube Community**: a server to maintain for a single project.

## Consequences

- The same families of rules as SonarWay (cognitive complexity, duplication, common vulnerabilities) from the first
  commit.
- Accepted deviation from that target as long as the repository is private: no Sonar dashboard and no tracking of debt
  over time.
