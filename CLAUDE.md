# HIPMaster

Jeu de cartes à collectionner dans le navigateur (inspiré de WikiMasters et de l'Async TCG, voir
`docs/produit/inspirations.md`). Monorepo npm : front **Angular 22** + Tailwind CSS 4, API **Fastify 5**, logique de jeu
pure en TypeScript, PostgreSQL + Drizzle. TypeScript strict, Node ≥ 24.15.

## Règles impératives du projet

1. **Toujours parler en français** à l'utilisateur (réponses, questions, récapitulatifs), ainsi que dans la
   documentation, les messages de commit et les commentaires de code.
2. **Tout ce qui est codé est documenté dans une story et un epic.** Aucune ligne de code sans story `US-XXX`
   rattachée à un epic `EPIC-XX`. Si aucune story ne couvre la demande, rédiger la story (et l'epic si besoin) dans
   `docs/backlog/` **avant** de coder, et la tenir à jour pendant et après le travail (critères, journal, tableau).
3. **Toute décision d'architecture est consignée dans un ADR** (`docs/decisions/NNNN-titre.md`, à partir de
   `template.md`, référencé dans `docs/decisions/README.md`). Les ADR acceptés font **référence** : les relire avant
   de concevoir ou de coder, s'y conformer, et ne jamais les contredire en silence. Pour changer d'avis, écrire un
   nouvel ADR qui remplace l'ancien (statut « Remplacée par NNNN »).
4. **Les ADR technologiques Elis sont le référentiel** (ADR 0005) : avant une décision, consulter le miroir
   `../14_AssistanceEquipe/outils/tad-validation/reference/adr-referentiel.md` (source de vérité : Confluence ATR),
   puis retenir, adapter ou écarter en le disant, et citer la référence dans le champ « Référence Elis » de l'ADR.
   Inspiration seulement : pas d'Okta, d'Azure Repo, de TAD ni de LeanIX imposés.

## Organisation et commandes

| Dossier           | Contenu                                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| `apps/web`        | Front Angular (standalone, signals, sans zone.js), préfixe de sélecteurs `hip-` |
| `apps/api`        | API REST Fastify `/api/v1/…`, schéma Drizzle et migrations (`apps/api/drizzle`) |
| `packages/domain` | `@hipmaster/domain` : logique de jeu pure (ADR 0004)                            |
| `e2e`             | Parcours Playwright avec audit axe-core                                         |

- `npm run dev` : API (localhost:3000) + front (localhost:4200, qui relaie `/api` vers l'API). `npm run build`.
- Vérification complète : `npm run check` (lint + format + typecheck + tests) — doit passer avant tout commit ; c'est
  le quality gate (règles SonarJS incluses, ADR 0009).
- Base locale : `npm run db:up` (Docker Desktop doit être lancé), `npm run db:migrate` ; toute modification de
  `apps/api/src/db/schema.ts` passe par `npm run db:generate` (migration SQL commitée).
- **Logique de jeu dans `packages/domain`** : fonctions pures, hasard injecté, aucune dépendance à Angular, Fastify ni
  la base. Le serveur fait foi : jamais de tirage ni de résolution de combat dans le front.
- L'API s'exécute en TypeScript natif (Node, sans compilation) : imports relatifs avec l'extension `.ts`, pas d'`enum`
  ni de `namespace` (`erasableSyntaxOnly`). Erreurs au format Problem Details ; contrat OpenAPI avant chaque ressource.
- Variables d'environnement : `.env` unique à la racine (modèle `.env.example`) ; l'API lit `API_HOST`/`API_PORT`.
- Tests : Vitest à côté du code (`*.test.ts` pour domain/api, `*.spec.ts` pour Angular via `ng test`) ;
  `npm run test:e2e` avant de clore une story qui touche un parcours.
- Pensé d'abord pour le téléphone ; accessible (clavier, contrastes, `lang="fr"`, règles a11y d'angular-eslint).
- Commits : Conventional Commits (commitlint via Husky).

## Méthode de travail (voir `docs/backlog/README.md`)

- Branche `us-xxx-titre`, commits `type(US-XXX): message`.
- En fin de story : `python scripts/cloturer-story.py US-XXX "résumé"` (statut, critères, journal, tableau, epic),
  puis compléter `CHANGELOG.md` à la main.
