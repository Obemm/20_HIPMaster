# 0003 — PostgreSQL + Drizzle ORM, Docker en développement

- **Date** : 2026-10-16
- **Statut** : Acceptée

## Contexte

Il faut stocker joueurs, cartes, collections, boosters et parties, avec des transactions fiables
(ouvrir un booster = débiter un booster et créditer 5 cartes, d'un seul bloc).

## Décision

PostgreSQL 18 ; Drizzle ORM (schéma en TypeScript dans `src/db/schema.ts`, migrations SQL versionnées dans `drizzle/`) ;
base locale lancée par `docker compose` (port 5433).

## Alternatives envisagées

- **Prisma** : très populaire, mais plus lourd (génération de client) et moins proche du SQL.
- **SQLite** : simple, mais moins adapté aux écritures concurrentes d'un jeu multijoueur.
- **Supabase / Firebase** : rapide à démarrer, mais dépendance à un service et logique dispersée.

## Conséquences

- Types partagés entre la base et le code, migrations relues dans les PR.
- Docker Desktop doit être lancé pour développer avec la base.
- Hébergement de production à choisir plus tard (Neon, Supabase Postgres, VPS…).
