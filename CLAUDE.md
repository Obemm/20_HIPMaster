# HIPMaster

Jeu de cartes à collectionner dans le navigateur (inspiré de WikiMasters et de l'Async TCG, voir
`docs/produit/inspirations.md`). Next.js 16 (App Router, React 19) + Tailwind CSS 4, TypeScript strict, Node 24, npm,
PostgreSQL + Drizzle. Toujours répondre en français.

@AGENTS.md

- `npm run dev` (localhost:3000), `npm run build`.
- Vérification complète : `npm run check` (lint + format + typecheck + tests) — doit passer avant tout commit.
- Base locale : `npm run db:up` (Docker Desktop doit être lancé), `npm run db:migrate` ; schéma dans `src/db/schema.ts`,
  toute modification du schéma passe par `npm run db:generate` (migration SQL commitée dans `drizzle/`).
- **Logique de jeu dans `src/domain/`** : fonctions pures, hasard injecté, aucune dépendance à Next ni à la base (ADR 0004).
  Le serveur fait foi : jamais de tirage ni de résolution de combat côté client.
- `src/db/` est réservé au serveur (`import 'server-only'`).
- Tests : Vitest, fichiers `src/**/*.test.ts` à côté du code testé ; parcours dans `e2e/` (`npm run test:e2e`,
  avec audit axe-core), à lancer avant de clore une story qui touche un parcours.
- Pensé d'abord pour le téléphone ; accessible (clavier, contrastes, `lang="fr"`).
- Commits : Conventional Commits (commitlint via Husky).

## Méthode de travail (voir `docs/backlog/README.md`)

- Tout travail se rattache à une user story `US-XXX` d'un epic `EPIC-XX`. S'il n'y en a pas, en proposer une avant de coder.
- Branche `us-xxx-titre`, commits `type(US-XXX): message`.
- En fin de story : `python scripts/cloturer-story.py US-XXX "résumé"` (statut, critères, journal, tableau, epic),
  puis compléter `CHANGELOG.md` à la main.
- Décision structurante → nouvel ADR dans `docs/decisions/`.
