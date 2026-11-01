# HIPMaster

Collectible card game in the browser (inspired by WikiMasters and the Async TCG, see `docs/produit/inspirations.md`).
npm monorepo: **Angular 22** front end + Tailwind CSS 4, **Fastify 5** API, pure TypeScript game logic, PostgreSQL +
Drizzle. Strict TypeScript, Node ≥ 24.15.

## Mandatory project rules

1. **Talk to the user in French** (answers, questions, summaries). **Write the repository in English** (ADR 0051):
   documentation, backlog (epics, stories), ADRs, CHANGELOG, new code comments and commit messages. The game itself
   stays bilingual, French being its reference language (ADR 0043). Existing French code comments are translated
   when a file is touched; files of the backlog and docs not translated yet (EPIC-16) are updated in their own
   language until they are.
2. **Everything that is coded is documented in a story and an epic.** No line of code without a `US-XXX` story
   attached to an `EPIC-XX` epic. If no story covers the request, write the story (and the epic if needed) in
   `docs/backlog/` **before** coding, and keep it up to date during and after the work (criteria, log, board). Only
   exception: a card pull request proposed by a contributor belongs to EPIC-08, without a story (ADR 0050).
3. **Every architecture decision is recorded in an ADR** (`docs/decisions/NNNN-title.md`, from `template.md`, listed
   in `docs/decisions/README.md`). Accepted ADRs are **authoritative**: read them before designing or coding, follow
   them, and never contradict them silently. To change your mind, write a new ADR that supersedes the old one (status
   "Superseded by NNNN").
4. **The company's technology ADRs are the reference** (ADR 0005, a local file ignored by Git, ADR 0054): before a
   decision, read them, then keep, adapt or reject them. Neither the company's name nor their numbers enter the repository (ADR 0056): the company
   reference of each ADR goes to the local `docs/decisions/reference-mapping.local.md` (ADR 0055), and the public ADR
   speaks only of "the reference" (ADR 0005). Details in `CLAUDE.local.md`, on the project owner's machine.

## Layout and commands

| Folder                   | Content                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `apps/web`               | Angular front end (standalone, signals, zoneless), selector prefix `hip-`                   |
| `apps/api`               | Fastify REST API `/api/v1/…`, Drizzle schema and migrations (`apps/api/drizzle`)            |
| `packages/domain`        | `@hipmaster/domain`: pure game logic (ADR 0004)                                             |
| `packages/illustrations` | Illustration pipeline: originals → AVIF/WebP + manifest (`npm run illustrations`, ADR 0015) |
| `e2e`                    | Playwright journeys with axe-core audit                                                     |

- `npm run dev`: API (localhost:3000) + front end (localhost:4200, which proxies `/api` to the API). `npm run build`.
- Full check: `npm run check` (lint + format + typecheck + tests) — must pass before any commit; it is the quality
  gate (SonarJS rules included, ADR 0009).
- Local database: PGlite in `.donnees/` by default (ADR 0018), migrations applied when the API starts;
  `DATABASE_URL` switches to PostgreSQL (`npm run db:up`, Docker). Any change to `apps/api/src/db/schema.ts` goes
  through `npm run db:generate` (committed SQL migration).
- **Game logic lives in `packages/domain`**: pure functions, injected randomness, no dependency on Angular, Fastify or
  the database. The server is authoritative: never a draw or a combat resolution in the front end.
- The API runs as native TypeScript (Node, no build step): relative imports with the `.ts` extension, no `enum` or
  `namespace` (`erasableSyntaxOnly`). Errors as Problem Details; OpenAPI contract before each resource.
- **Bilingual game** (ADR 0042): every interface text carries `i18n` (templates) or `$localize` (code); run
  `npm run i18n:extraire` after each added or changed text, then translate it in
  `apps/web/src/locale/messages.en.json` (`npm run i18n:verifier` checks it, so does the CI). The build serves `/fr/`
  and `/en/`; `npm run dev` serves French only, `npm run start:en` English.
- Environment variables: a single `.env` at the root (template `.env.example`); the API reads `API_HOST`/`API_PORT`.
- Tests: Vitest next to the code (`*.test.ts` for domain/api, `*.spec.ts` for Angular through `ng test`);
  `npm run test:e2e` before closing a story that touches a journey (the CI runs `test:e2e:production`: production
  build under the CSP of `firebase.json`, no inline style or script).
- Release: every merge into `main` with a green CI is deployed by `.github/workflows/deploy.yml` (ADR 0028); a
  migration stays compatible with the live version. Guide: `docs/exploitation/README.md`; GCP always with
  `--configuration=hipmaster`.
- Mobile first; accessible (keyboard, contrast, `lang`, angular-eslint a11y rules).
- Commits: Conventional Commits (commitlint through Husky), lowercase subject.

## Way of working (see `docs/backlog/README.md`)

- Branch `us-xxx-title`, commits `type(US-XXX): message`.
- At the end of a story: `python scripts/close-story.py US-XXX "summary"` (status, criteria, log, board, epic), then
  complete `CHANGELOG.md` by hand.
