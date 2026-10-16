# HIPMaster

Jeu de cartes à collectionner dans le navigateur : ouvre des boosters, complète ta collection, défie le bot et tes amis.
Inspiré de WikiMasters et de l'Async TCG — voir [docs/produit/inspirations.md](docs/produit/inspirations.md).

Stack : [Next.js 16](https://nextjs.org) (React 19) + [Tailwind CSS 4](https://tailwindcss.com), TypeScript strict,
PostgreSQL + [Drizzle ORM](https://orm.drizzle.team).

## Prérequis

- Node.js 24 (voir `.nvmrc`) et npm
- Docker Desktop (base PostgreSQL locale)

## Démarrage

```bash
npm install
cp .env.example .env
npm run db:up        # PostgreSQL sur localhost:5433
npm run db:migrate   # applique les migrations
npm run dev          # http://localhost:3000
```

## Scripts

| Commande                | Rôle                                                   |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | Serveur de développement (localhost:3000)              |
| `npm run build`         | Construit l'application pour la production             |
| `npm run lint`          | Analyse ESLint (`lint:fix` pour corriger)              |
| `npm run format`        | Formate tout le code avec Prettier                     |
| `npm run typecheck`     | Vérifie les types TypeScript                           |
| `npm test`              | Tests unitaires (Vitest)                               |
| `npm run test:e2e`      | Tests de bout en bout + accessibilité (Playwright)     |
| `npm run test:coverage` | Tests + couverture de code                             |
| `npm run check`         | Lint + format + types + tests (identique à la CI)      |
| `npm run db:up`         | Démarre PostgreSQL (Docker) ; `db:down` pour l'arrêter |
| `npm run db:generate`   | Génère une migration depuis `src/db/schema.ts`         |
| `npm run db:migrate`    | Applique les migrations                                |
| `npm run db:studio`     | Explore la base dans le navigateur                     |

## Organisation du code

| Dossier       | Contenu                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `src/app/`    | Pages et routes Next.js (App Router)                                       |
| `src/domain/` | Logique de jeu pure et testée (tirages, règles, bot) — ADR 0004            |
| `src/db/`     | Schéma Drizzle et connexion à la base (serveur uniquement)                 |
| `drizzle/`    | Migrations SQL générées, versionnées                                       |
| `e2e/`        | Parcours Playwright                                                        |
| `docs/`       | Vision, backlog (epics/stories), décisions (ADR) — [index](docs/README.md) |

## Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) avec l'ID de story en portée
  (`feat(US-012): …`), vérifiés par commitlint.
- **Avant chaque commit** : ESLint + Prettier sur les fichiers modifiés (Husky + lint-staged).
- **Branches** : `main` est stable ; une branche par story `us-xxx-titre`, puis PR.
- **Secrets** : uniquement dans `.env` (ignoré par Git). Documenter chaque variable dans `.env.example`.
- **CI** : GitHub Actions (check, build, Playwright) sur chaque push et PR ; Dependabot chaque semaine.
