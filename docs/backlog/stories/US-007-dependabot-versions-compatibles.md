# US-007 — Dependabot ne propose que des versions compatibles

- **Epic** : EPIC-00
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : XS
- **Branche** : `us-007-dependabot-typescript`

## Récit

En tant que **développeur**, je veux **que Dependabot ne propose pas de versions incompatibles avec la stack**
afin de **ne recevoir que des mises à jour fusionnables, sans PR rouges à trier**.

## Critères d'acceptation

- [x] **Étant donné** Angular 22, qui exige TypeScript `>=6.0 <6.1`, **quand** Dependabot cherche des mises à jour,
      **alors** il ne propose pas TypeScript 6.1 ou plus.
- [x] **Étant donné** Node 24 (`.nvmrc`), **alors** Dependabot ne propose pas de version majeure de `@types/node`
      (qui doit suivre la version majeure de Node).
- [x] La PR #4 (TypeScript 7, `@types/node` 26), dont `npm ci` échoue, est fermée avec une explication.

## Notes

Échec constaté le 2026-10-16 sur la PR #4 : `npm ci` en `ERESOLVE` (typescript-eslint et Angular refusent TypeScript 7).
Les blocages seront levés quand Angular acceptera TypeScript 7, et quand le projet passera à Node 26.

## Journal

- 2026-10-16 — création.
- 2026-10-16 — livrée : TypeScript >=6.1 et versions majeures de @types/node ignorés par Dependabot ; PR #4 fermée
