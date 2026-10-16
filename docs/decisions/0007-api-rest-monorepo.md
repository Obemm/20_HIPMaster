# 0007 — API REST Fastify et monorepo npm workspaces

- **Date** : 2026-10-16
- **Statut** : Acceptée
- **Référence Elis** : ADR-007 (stratégie REST), ADR-020 (design et sécurité REST v2 : design first, timeouts, tailles)
- **Complète** : [0004](0004-logique-de-jeu-pure.md)

## Contexte

Avec Angular ([0006](0006-angular-pwa.md)), le front et le serveur deviennent deux applications. Le serveur doit faire
autorité sur les règles ([0004](0004-logique-de-jeu-pure.md)). Le référentiel Elis impose des API **REST**, conçues
**contrat d'abord** et bornées (timeouts, tailles de requête), mais ne prescrit pas de framework serveur.

## Décision

- **Monorepo npm workspaces** :
  - `apps/web` — front Angular ;
  - `apps/api` — API REST **Fastify 5** (TypeScript, Node 24), validation des entrées et sorties par **Zod** ;
  - `packages/domain` — logique de jeu pure (`@hipmaster/domain`), sans dépendance à Angular, Fastify ni la base.
- Chemins d'API versionnés `/api/v1/…`, ressources au pluriel, erreurs au format _Problem Details_ (RFC 9457).
- Contrat **OpenAPI** écrit et relu avant chaque nouvelle ressource (design first), dans `apps/api/openapi/`.
- Limites posées dès le départ : taille de corps (1 Mo), délai de requête (10 s).
- En développement, le front appelle `/api` via le proxy du serveur Angular : une seule origine, pas de CORS.

## Alternatives envisagées

- **NestJS** : structure proche d'Angular, mais lourd (décorateurs, injection) pour une API de jeu ; tests plus lents.
- **Express** : vieillissant, pas de validation ni de typage des schémas intégrés.
- **Nx** pour le monorepo : puissant mais surdimensionné ; les workspaces npm suffisent.

## Conséquences

- La logique de jeu se teste seule (`packages/domain`), l'API se teste par injection de requêtes (`fastify.inject`).
- Deux processus à lancer en développement (`npm run dev` les démarre ensemble).
- Le schéma de base et les migrations Drizzle ([0003](0003-postgresql-drizzle.md)) vivent dans `apps/api`.
