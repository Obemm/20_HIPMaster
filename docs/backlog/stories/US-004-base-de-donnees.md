# US-004 — Base de données locale

- **Epic** : EPIC-00
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : XS
- **Branche** : `us-004-base-de-donnees`

## Récit

En tant que **développeur**, je veux **une base PostgreSQL locale lancée en une commande, avec migrations**
afin de **stocker joueurs, cartes et collections**.

> **Révisée le 2026-10-19.** Docker n'est pas installé sur le poste de développement : le besoin a été satisfait
> autrement par US-022 (ADR [0018](../../decisions/0018-pglite-developpement.md)). Les critères d'origine, écrits
> pour Docker, sont remplacés par ceux ci-dessous ; la voie Docker reste disponible mais n'a pas été vérifiée.

## Critères d'acceptation

- [x] **Quand** je tape `npm run dev`, **alors** l'API ouvre une base PostgreSQL embarquée (PGlite, dans `.donnees/`)
      sans Docker ni autre commande, et y applique toutes les migrations (`0000_init` à `0004_recompenses`).
- [x] Les tests de l'API et les parcours e2e utilisent une base PGlite en mémoire, vierge à chaque lancement.
- [x] Avec `DATABASE_URL`, l'API utilise un vrai PostgreSQL et le même schéma Drizzle ; `npm run db:up` (Docker,
      port 5433), `db:migrate` et `db:studio` servent dans ce cas — **non vérifié**, faute de Docker sur le poste.
- [x] ~~`npm run db:studio` permet de consulter la table `cartes`~~ : sans objet, la table provisoire `cartes` a été
      retirée par US-023 (ADR 0011).

## Notes

ADR [0003](../../decisions/0003-postgresql-drizzle.md) (PostgreSQL et Drizzle) et
[0018](../../decisions/0018-pglite-developpement.md) (PGlite en développement et en tests). `db:migrate` et
`db:studio` passent par drizzle-kit, qui lit `DATABASE_URL` : ils ne s'appliquent pas à la base PGlite, dont les
migrations sont appliquées au démarrage de l'API.

## Journal

- 2026-10-16 — création, configuration écrite.
- 2026-10-19 — révisée et close : la base locale est livrée par US-022 (PGlite, ADR 0018), le README précise que
  `db:up`, `db:migrate` et `db:studio` concernent PostgreSQL (`DATABASE_URL`).
- 2026-10-19 — livrée : Base locale sans Docker grâce à PGlite (US-022, ADR 0018) ; voie PostgreSQL documentée
