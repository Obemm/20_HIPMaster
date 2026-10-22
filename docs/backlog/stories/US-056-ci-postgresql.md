# US-056 — La CI teste l'API sur un vrai PostgreSQL

- **Epic** : EPIC-09
- **Statut** : En cours
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
- **PostgreSQL 18**, et non 17 comme envisagé au lancement du lot : le projet Neon de production, créé à l'inscription
  du porteur du projet, est en PostgreSQL 18, et Neon ne change jamais la version majeure d'un projet (constat et
  ADR 0024 d'US-049). C'est aussi la version de PGlite (18.6) et de `docker-compose.yml`.
- Une base par fichier plutôt qu'un schéma : les migrations nomment le schéma `public` (`CREATE TYPE "public"…`).

## Réalisation

- `db/base-de-test.ts` : avec `DATABASE_URL`, `baseDeTest()` crée une base PostgreSQL vide par fichier
  (`creerBaseVide`), la migre à l'ouverture, la vide avant chaque test et la supprime à la fin ; sans, PGlite en
  mémoire comme avant.
- `concurrence.test.ts` : ouvertures de booster, récompenses (même partie, et plafond quotidien), appariement au
  hasard et actions de duel (avec et sans `If-Match`), dix à la fois. Le pool ouvre d'abord ses connexions : sans
  cela, il les ouvrait une à une et la première opération finissait avant que la deuxième ne commence.
- `db/migrations.test.ts` (PostgreSQL seulement) : migrations sur une base vide, puis une seconde ouverture sans effet
  (même nombre de migrations, données conservées).
- `.github/workflows/ci.yml` : job « Tests de l'API sur PostgreSQL 18 » (service `postgres:18-alpine`), en parallèle
  des autres.

## Vérifications

Le 2026-10-22, contre le PostgreSQL 18 de `docker-compose.yml` : toute la suite de l'API passe (35 s, contre 90 s sur
PGlite) et ne laisse aucune base derrière elle. Chaque verrou a été retiré à tour de rôle pour s'assurer que les tests
le remarquent :

| Verrou retiré                                     | PostgreSQL               | PGlite          |
| ------------------------------------------------- | ------------------------ | --------------- |
| `FOR UPDATE` de l'ouverture de booster            | échec 3 fois sur 3       | passe           |
| `FOR UPDATE` de la récompense (même partie)       | échec 5 fois sur 5       | passe           |
| `FOR UPDATE` de la récompense (plafond quotidien) | échec 3 fois sur 3       | passe           |
| `FOR UPDATE SKIP LOCKED` de l'appariement         | échec 3 fois sur 3       | passe           |
| `FOR UPDATE` de l'action de duel                  | les deux tests, 3 sur 3  | passe           |
| aucun                                             | 6 tests passent, 3 sur 3 | 6 tests passent |

## Journal

- 2026-10-22 — création, issue de la revue de l'API avant mise en ligne.
- 2026-10-22 — prise en charge (lot 1, session API) ; PostgreSQL 18 retenu, comme la base Neon de production.
