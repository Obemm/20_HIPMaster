# US-056 — La CI teste l'API sur un vrai PostgreSQL

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : S
- **Branche** : `us-056-ci-postgresql`

## Récit

En tant que **porteur du projet**, je veux **que la CI fasse aussi passer les tests de l'API sur PostgreSQL** afin
de **découvrir avant la production ce que PGlite ne peut pas montrer**.

## Contexte

Tous les tests de l'API et les parcours e2e tournent sur PGlite (ADR 0018), qui exécute les requêtes **une par une**
(verrou unique). Les tests « simultanés » des duels passeraient donc même sans `FOR UPDATE` ni `SKIP LOCKED`, et ni
postgres.js (pool, JSONB), ni les migrations sur un vrai serveur ne sont jamais exercés. La production utilisera
PostgreSQL chez Neon (ADR 0021).

## Critères d'acceptation

- [ ] **Étant donné** une pull request, **quand** la CI s'exécute, **alors** un job lance la suite de l'API avec un
      service `postgres` de la même version majeure que la base de production et `DATABASE_URL` renseignée, en plus de la suite
      PGlite actuelle.
- [ ] **Étant donné** ce job, **alors** les migrations sont appliquées sur une base vide, puis une seconde fois sans
      effet.
- [ ] **Étant donné** les opérations concurrentes (ouverture de booster, récompense de victoire, appariement des
      duels, action de duel), **alors** des tests les lancent vraiment en parallèle sur PostgreSQL et vérifient qu'aucun
      gain n'est doublé et qu'aucun duel n'est rejoint deux fois.
- [ ] Le temps de la CI reste raisonnable (le job tourne en parallèle des autres).

## Notes

- Le code sait déjà utiliser PostgreSQL via `DATABASE_URL` (ADR 0018) ; il faut donner une base propre à chaque
  fichier de tests (schéma ou base par fichier).

## Journal

- 2026-10-22 — création, issue de la revue de l'API avant mise en ligne.
