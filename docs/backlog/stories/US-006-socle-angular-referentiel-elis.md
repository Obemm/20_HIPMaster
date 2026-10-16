# US-006 — Socle Angular aligné sur le référentiel Elis

- **Epic** : EPIC-00
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-006-socle-angular`

## Récit

En tant que **porteur du projet**, je veux **que les premiers choix techniques s'appuient sur les ADR technologiques
d'Elis** afin de **travailler avec la stack et les pratiques du Groupe, sans en subir les obligations d'entreprise**.

## Critères d'acceptation

- [x] Un ADR fixe le référentiel : chaque ADR technologique Elis pertinent est retenu, adapté ou écarté, avec sa raison.
- [x] Les ADR qui contredisent le référentiel (0001 Next.js) sont remplacés par de nouveaux ADR, sans être réécrits.
- [x] **Étant donné** le dépôt, **quand** je tape `npm run dev`, **alors** le front Angular (localhost:4200) et l'API
      (localhost:3000) démarrent, et le front affiche l'état de l'API.
- [x] La logique de jeu vit dans un paquet pur `packages/domain`, utilisé par l'API.
- [x] `npm run check`, `npm run build` et `npm run test:e2e` passent ; la CI est adaptée.
- [x] Les règles d'analyse statique de type SonarWay (eslint-plugin-sonarjs) s'appliquent localement et en CI.
- [x] README, CLAUDE.md, TABLEAU et CHANGELOG sont à jour.

## Notes

Source : référentiel des ADR Elis de l'espace Confluence ATR (miroir daté du 2026-09-16 dans
`14_AssistanceEquipe/outils/tad-validation/reference/adr-referentiel.md`). Décision de l'utilisateur le 2026-10-16 :
**inspiration seulement** (pas d'Okta, d'Azure Repo, de TAD ni de LeanIX imposés) et **passage à Angular** (ADR-005 Elis).

## Journal

- 2026-10-16 — création ; branche ouverte.
- 2026-10-16 — ADR 0005 à 0009 écrits, 0001 remplacé. Next.js retiré ; monorepo npm workspaces ; `packages/domain` et
  API Fastify (`/api/v1/sante`, `/api/v1/raretes`, erreurs Problem Details) testés (9 tests), ESLint + SonarJS au vert.
  **Bloqué** : Angular 22 exige Node ≥ 24.15 (installé : 24.14) — mise à jour de Node à faire par le porteur du projet.
- 2026-10-16 — livrée : ADR 0005 à 0009 inspirés du référentiel Elis ; Angular 22 + API Fastify 5 + packages/domain ; SonarJS ; 12 tests unitaires et 4 parcours e2e au vert
