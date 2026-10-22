# 0008 — Azure comme hébergement cible

- **Date** : 2026-10-16
- **Statut** : Remplacée par 0021
- **Référence Elis** : ADR-030 (Azure seul cloud public), ADR-006 (Application Insights / Log Analytics),
  ADR-012 (Azure Storage Account pour les fichiers), ADR-004 (préfixes d'URL hors production)

## Contexte

Rien n'est encore en ligne, mais le choix du cloud oriente la base, le stockage des illustrations et la supervision.
Le référentiel Elis désigne **Microsoft Azure** comme unique cloud public.

## Décision

Cible de mise en ligne (à réaliser dans un futur epic) :

| Besoin                   | Service Azure                                        |
| ------------------------ | ---------------------------------------------------- |
| Front Angular (statique) | Azure Static Web Apps                                |
| API Fastify              | Azure Container Apps (image Docker de `apps/api`)    |
| Base de données          | Azure Database for PostgreSQL – serveur flexible     |
| Illustrations des cartes | Azure Storage Account (Blob) + CDN                   |
| Journaux et métriques    | Application Insights + Log Analytics (OpenTelemetry) |
| Secrets                  | Azure Key Vault                                      |

Environnements : `dev`, `stg` puis production sans préfixe (ex. `stg.hipmaster…`).

## Alternatives envisagées

- **Vercel / Netlify + Neon** : plus simple pour un projet personnel, mais hors référentiel Elis.
- **VPS auto-hébergé** : moins cher, mais exploitation et sécurité entièrement à notre charge.

## Conséquences

- Le code reste portable (Docker, PostgreSQL standard, OpenTelemetry) : aucune dépendance Azure dans `packages/domain`.
- Pas de fichiers stockés en base : les images iront dans un Storage Account (ADR-012 Elis).
- Coût à surveiller : privilégier les offres gratuites ou à la consommation tant que le jeu a peu de joueurs.
