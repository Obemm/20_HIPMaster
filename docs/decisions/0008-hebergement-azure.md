# 0008 — Azure as the target hosting

- **Date**: 2026-10-16
- **Status**: Superseded by 0021

## Context

Nothing is online yet, but the choice of cloud shapes the database, the storage of illustrations and the monitoring. The
reference that inspires the project (ADR 0005) points to **Microsoft Azure**.

## Decision

Go-live target (to be carried out in a future epic):

| Need                       | Azure service                                        |
| -------------------------- | ---------------------------------------------------- |
| Angular front end (static) | Azure Static Web Apps                                |
| Fastify API                | Azure Container Apps (Docker image of `apps/api`)    |
| Database                   | Azure Database for PostgreSQL – flexible server      |
| Card illustrations         | Azure Storage Account (Blob) + CDN                   |
| Logs and metrics           | Application Insights + Log Analytics (OpenTelemetry) |
| Secrets                    | Azure Key Vault                                      |

Environments: `dev`, `stg`, then production without a prefix (e.g. `stg.hipmaster…`).

## Alternatives considered

- **Vercel / Netlify + Neon**: simpler for a personal project, but outside the reference (ADR 0005).
- **Self-hosted VPS**: cheaper, but operations and security are entirely on us.

## Consequences

- The code stays portable (Docker, standard PostgreSQL, OpenTelemetry): no Azure dependency in `packages/domain`.
- No files stored in the database: images will go into a Storage Account.
- Cost to watch: favour free or pay-as-you-go offers as long as the game has few players.
