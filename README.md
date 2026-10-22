# HIPMaster

Jeu de cartes à collectionner dans le navigateur : ouvre des boosters, complète ta collection, défie le bot et tes amis.
Inspiré de WikiMasters et de l'Async TCG — voir [docs/produit/inspirations.md](docs/produit/inspirations.md).

Stack, alignée sur le référentiel technologique Elis ([ADR 0005](docs/decisions/0005-referentiel-adr-elis.md)) :
[Angular 22](https://angular.dev) + [Tailwind CSS 4](https://tailwindcss.com), API [Fastify 5](https://fastify.dev),
PostgreSQL + [Drizzle ORM](https://orm.drizzle.team), TypeScript strict, monorepo npm workspaces.

## Prérequis

- Node.js 24.15 ou plus (voir `.nvmrc`) et npm
- Rien d'autre : en développement, la base est PGlite (PostgreSQL embarqué, dans `.donnees/`, ADR 0018) ;
  Docker Desktop n'est utile que pour tester contre un vrai PostgreSQL (`npm run db:up`, puis `DATABASE_URL`)

## Navigateurs pris en charge

Ceux qu'exige Tailwind CSS 4 : **Safari 16.4** (iOS et iPadOS 16.4 compris), **Chrome et Edge 111**, **Firefox 128**,
ou plus récents. Sur un navigateur plus ancien, les styles du jeu ne s'appliquent pas correctement. Le jeu a besoin de
JavaScript ; sans lui, la page le dit (US-055).

## Démarrage

```bash
npm install
cp .env.example .env
npm run dev          # migrations appliquées au démarrage ; API sur localhost:3000, jeu sur http://localhost:4200
```

## Scripts

| Commande                            | Rôle                                                                  |
| ----------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                       | API + front Angular en mode développement                             |
| `npm run build`                     | Construit le front pour la production                                 |
| `npm run lint`                      | ESLint + règles SonarJS et Angular (`lint:fix`)                       |
| `npm run format`                    | Formate tout le code avec Prettier                                    |
| `npm run typecheck`                 | Vérifie les types de chaque paquet                                    |
| `npm test`                          | Tests unitaires (Vitest : domaine, API, Angular)                      |
| `npm run test:e2e`                  | Tests de bout en bout + accessibilité (Playwright)                    |
| `npm run test:coverage`             | Tests du domaine et de l'API avec couverture                          |
| `npm run check`                     | Lint + format + types + tests (quality gate, = CI)                    |
| `npm run db:up`                     | Démarre PostgreSQL (Docker, facultatif) ; `db:down` pour l'arrêter    |
| `npm run db:generate`               | Génère une migration depuis le schéma Drizzle                         |
| `npm run db:migrate`                | Applique les migrations à PostgreSQL (`DATABASE_URL`) ; PGlite : auto |
| `npm run db:studio`                 | Explore la base PostgreSQL (`DATABASE_URL`) dans le navigateur        |
| `npm run illustrations`             | Décline les illustrations des cartes (voir `packages/illustrations`)  |
| `npm run illustrations:provisoires` | Dessine les illustrations provisoires des 71 cartes, puis les décline |

## Organisation du code

| Dossier                  | Contenu                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `apps/web/`              | Front Angular (PWA à venir) — ADR 0006                                     |
| `apps/api/`              | API REST Fastify, schéma et migrations Drizzle — ADR 0007, 0003            |
| `packages/domain`        | Logique de jeu pure et testée (tirages, règles, bot) — ADR 0004            |
| `packages/illustrations` | Chaîne d'import et d'optimisation des illustrations — ADR 0015             |
| `e2e/`                   | Parcours Playwright                                                        |
| `docs/`                  | Vision, backlog (epics/stories), décisions (ADR) — [index](docs/README.md) |

## Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) avec l'ID de story en portée
  (`feat(US-012): …`), vérifiés par commitlint.
- **Avant chaque commit** : ESLint + Prettier sur les fichiers modifiés (Husky + lint-staged).
- **Branches** : `main` est stable ; une branche par story `us-xxx-titre`, puis PR.
- **Secrets** : uniquement dans `.env` (ignoré par Git). Documenter chaque variable dans `.env.example`.
- **CI** : GitHub Actions (check, build, Playwright) sur chaque push et PR ; Dependabot chaque semaine.
