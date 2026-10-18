# US-022 — Compte invité, sans mot de passe

- **Epic** : EPIC-02
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-022-compte-invite`

## Récit

En tant que **joueur**, je veux **un compte créé en un clic, avec un simple pseudo** afin de **garder ma collection
sans retenir de mot de passe**.

## Critères d'acceptation

- [x] Un ADR consigne la solution d'authentification **simple** retenue (décision du porteur du projet,
      2026-10-18 : « faisons simple pour le moment ») : compte invité avec pseudo, jeton secret gardé par le
      navigateur, **code de récupération** pour retrouver son compte sur un autre appareil ; ni mot de passe ni
      e-mail ; un fournisseur OIDC pourra être ajouté plus tard (ADR 0005 : pas de mots de passe maison).
- [x] Un ADR consigne le stockage : les comptes (et bientôt les collections) sont **persistants** ; la base doit
      tourner en développement et en tests **sans Docker** si possible, avec le même schéma Drizzle qu'en production
      (PostgreSQL, ADR 0003).
- [x] **Étant donné** un premier passage, **quand** je choisis un pseudo, **alors** mon compte est créé, je reste
      connecté sur ce navigateur et je vois mon code de récupération (à noter).
- [x] **Quand** je saisis mon code de récupération sur un autre appareil, **alors** je retrouve mon compte.
- [x] Le jeton n'est jamais stocké en clair en base (empreinte) ; l'API refuse une requête sans jeton valide sur les
      routes qui exigent un compte (401 au format Problem Details).
- [x] Le pseudo est affiché dans l'en-tête ; je peux me déconnecter (le navigateur oublie le jeton).
- [x] Contrat OpenAPI avant le code ; tests de l'API (création, connexion par code, refus) et de l'écran ; parcours
      e2e et audit axe-core au vert.

## Notes

- Les parties contre le bot restent jouables sans compte ; le compte devient nécessaire pour la collection (US-023).

## Journal

- 2026-10-18 — création.
- 2026-10-18 — ADR 0017 (compte invité : pseudo, jeton Bearer, code de récupération, empreintes SHA-256) et ADR 0018
  (PGlite en développement et en tests, PostgreSQL en production ; migrations au démarrage). Contrat
  `openapi/comptes.yaml`, tables `joueurs` et `sessions` (migration `0001_comptes`), routes `/joueurs`, `/sessions`,
  `/moi`. Front : page « Mon compte », pseudo dans le bandeau, intercepteur du jeton. Tests API (7), écran (3), e2e
  (création, rechargement, autre appareil, déconnexion) et axe en clair et en sombre au vert.
- 2026-10-18 — livrée : Compte invité : pseudo, jeton gardé par le navigateur, code de récupération ; PGlite en développement
