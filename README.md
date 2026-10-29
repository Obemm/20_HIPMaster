# HIPMaster

Collectible card game in the browser: open boosters, complete your collection, challenge the bot and your friends.
Inspired by WikiMasters and the Async TCG — see [docs/produit/inspirations.md](docs/produit/inspirations.md).

Stack, aligned with the the company technology reference (ADR 0005, kept locally, see [ADR 0054](docs/decisions/0054-reference-out-of-repository.md)):
[Angular 22](https://angular.dev) + [Tailwind CSS 4](https://tailwindcss.com), [Fastify 5](https://fastify.dev) API,
PostgreSQL + [Drizzle ORM](https://orm.drizzle.team), strict TypeScript, npm workspaces monorepo.

**Proposing a card**: architects and tech leads can propose their own cards through a pull request, see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Prerequisites

- Node.js 24.15 or later (see `.nvmrc`) and npm
- Nothing else: in development the database is PGlite (embedded PostgreSQL, in `.donnees/`, ADR 0018); Docker Desktop
  is only useful to test against a real PostgreSQL (`npm run db:up`, then `DATABASE_URL`)

## Supported browsers

Those required by Tailwind CSS 4: **Safari 16.4** (including iOS and iPadOS 16.4), **Chrome and Edge 111**,
**Firefox 128**, or newer. On an older browser, the game's styles are not applied correctly. The game needs
JavaScript; without it, the page says so (US-055).

## Getting started

```bash
npm install
cp .env.example .env
npm run dev          # migrations applied at startup; API on localhost:3000, game on http://localhost:4200
```

## Scripts

| Command                             | Purpose                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                       | API + Angular front end in development mode                              |
| `npm run build`                     | Builds the front end for production                                      |
| `npm run lint`                      | ESLint + SonarJS and Angular rules (`lint:fix`)                          |
| `npm run format`                    | Formats all the code with Prettier                                       |
| `npm run typecheck`                 | Checks the types of each package                                         |
| `npm test`                          | Unit tests (Vitest: domain, API, Angular)                                |
| `npm run test:e2e`                  | End-to-end tests + accessibility (Playwright)                            |
| `npm run test:e2e:production`       | The same on the production build, with the Firebase CSP (= CI)           |
| `npm run test:coverage`             | Domain and API tests with coverage                                       |
| `npm run check`                     | Lint + format + types + tests (quality gate, = CI)                       |
| `npm run db:up`                     | Starts PostgreSQL (Docker, optional); `db:down` to stop it               |
| `npm run db:generate`               | Generates a migration from the Drizzle schema                            |
| `npm run db:migrate`                | Applies the migrations to PostgreSQL (`DATABASE_URL`); PGlite: automatic |
| `npm run db:studio`                 | Explores the PostgreSQL database (`DATABASE_URL`) in the browser         |
| `npm run invitation`                | Creates, lists or revokes invitations (PostgreSQL, see `--aide`)         |
| `npm run illustrations`             | Derives the card illustrations (see `packages/illustrations`)            |
| `npm run illustrations:provisoires` | Draws the provisional illustrations of all the cards, then derives them  |
| `npm run simuler:carte -- <no.>`    | Measures a card's balance in the lent decks (PR CI, US-029)              |

The API tests run on PGlite, which executes queries one at a time. The CI also runs them on PostgreSQL 18, where
simultaneous operations really overlap (US-056); locally, with Docker:

```bash
npm run db:up
DATABASE_URL=postgres://hipmaster:hipmaster@localhost:5433/hipmaster npx vitest run --project api
```

Each test file creates its own database there, dropped at the end.

## API Docker image

The API goes to production as a Docker image, on Cloud Run (ADR 0021). The image is built from the root of the
repository (the npm workspaces live there) and contains only the API, `packages/domain`, the migrations and the
production dependencies:

```bash
docker build -t hipmaster-api .
npm run db:up        # local PostgreSQL, port 5433
docker run --rm -e DATABASE_URL=postgres://hipmaster:hipmaster@host.docker.internal:5433/hipmaster hipmaster-api node apps/api/src/migrer.ts
docker run --rm -p 8080:8080 -e DATABASE_URL=postgres://hipmaster:hipmaster@host.docker.internal:5433/hipmaster \
  -e CLE_CODES_RECUPERATION=cle-locale-de-trente-deux-caracteres-au-moins -e PROXYS_DE_CONFIANCE=0 hipmaster-api
```

In production (`NODE_ENV=production`, set by the image), the API no longer migrates at startup: the
`node apps/api/src/migrer.ts` command does it before each deployment (ADR 0023). It also requires the recovery-code key
and the number of relays placed in front of it, and rate-limits per address (ADR 0025). Variables: see `.env.example`.

## Going live

Every merge into `main` with a green CI is deployed automatically: the API on Cloud Run, the front end on Firebase
Hosting (`https://hipmaster.web.app`), by the `deploy.yml` workflow (ADR 0028). Infrastructure, manual deployment and
rollback: [operations guide](docs/exploitation/README.md).

## Code layout

| Folder                   | Content                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `apps/web/`              | Angular front end (PWA to come) — ADR 0006                                  |
| `apps/api/`              | Fastify REST API, Drizzle schema and migrations — ADR 0007, 0003            |
| `packages/domain`        | Pure, tested game logic (draws, rules, bot) — ADR 0004                      |
| `packages/illustrations` | Illustration import and optimisation pipeline — ADR 0015                    |
| `e2e/`                   | Playwright journeys                                                         |
| `docs/`                  | Vision, backlog (epics/stories), decisions (ADRs) — [index](docs/README.md) |

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) with the story ID as scope
  (`feat(US-012): …`), checked by commitlint.
- **Before each commit**: ESLint + Prettier on the modified files (Husky + lint-staged).
- **Branches**: `main` is stable; one branch per story `us-xxx-title`, then a PR.
- **Secrets**: only in `.env` (ignored by Git). Document each variable in `.env.example`.
- **CI**: GitHub Actions (check, build, API tests on PostgreSQL, Playwright) on every push and PR; Dependabot every
  week.
