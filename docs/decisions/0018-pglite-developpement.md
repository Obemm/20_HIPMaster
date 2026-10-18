# 0018 — PGlite en développement et en tests, PostgreSQL en production

- **Date** : 2026-10-18
- **Statut** : Acceptée
- **Remplace en partie** : [0003](0003-postgresql-drizzle.md) (Docker en développement)
- **Référence Elis** : aucune (ADR-030 Azure pour l'hébergement, déjà retenu par l'ADR 0008, reste valable pour la
  production)

## Contexte

Avec les comptes (US-022), puis les collections (US-023), l'API a besoin d'une base **persistante**. L'ADR 0003 a
retenu PostgreSQL et Drizzle, avec une base locale sous Docker. Or Docker n'est pas installé sur le poste du porteur du
projet (constaté le 2026-10-18), il le serait aussi en CI pour les tests, et il alourdit chaque démarrage.

## Décision

- **PostgreSQL et Drizzle restent** le choix de production (ADR 0003, hébergement Azure, ADR 0008).
- En **développement** et en **tests**, l'API utilise **PGlite** (`@electric-sql/pglite`) : le vrai moteur
  PostgreSQL compilé en WebAssembly, embarqué dans le processus Node. Même SQL, mêmes migrations, même schéma Drizzle.
- Choix par configuration :
  - `DATABASE_URL` renseignée (`postgres://…`) → PostgreSQL ;
  - sinon `BASE_LOCALE` : un dossier (`.donnees/pglite` par défaut, ignoré par Git) ou `memory://` pour une base en
    mémoire, utilisée par les tests et les parcours e2e.
- Les **migrations** SQL générées par `drizzle-kit` (dossier `apps/api/drizzle`) sont appliquées **au démarrage** de
  l'API, quelle que soit la base.

## Alternatives envisagées

- **Docker et PostgreSQL** (ADR 0003) : fidèle à la production, mais demande Docker partout ; écarté pour le
  développement et les tests, gardé comme option via `DATABASE_URL`.
- **SQLite** : léger, mais un autre dialecte SQL que la production, d'où des écarts de comportement et deux jeux de
  migrations.
- **Base en mémoire maison** : aucune persistance, et rien de commun avec la production.

## Conséquences

- `npm run dev`, les tests et la CI fonctionnent **sans Docker** ; chaque test d'API crée sa base en mémoire.
- PGlite ne sert qu'une connexion à la fois : suffisant pour le développement, jamais pour la production.
- Les scripts `db:up` et `docker-compose.yml` restent pour qui veut tester contre un vrai PostgreSQL.
