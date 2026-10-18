# US-012 — API de partie contre le bot

- **Epic** : EPIC-04
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-012-api-partie-pve`

## Récit

En tant que **joueur**, je veux **que la partie se déroule sur le serveur** afin que **personne ne puisse tricher et
que le bot joue selon les mêmes règles que moi**.

## Critères d'acceptation

- [x] Un ADR consigne le choix : l'état des parties en cours est **gardé en mémoire** par l'API, avec expiration
      (parties abandonnées) et nombre maximal de parties ; une partie est perdue si l'API redémarre. À revoir avec
      les comptes joueurs et le passage à plusieurs instances.
- [x] Le contrat OpenAPI des ressources `decks` et `parties` est écrit avant le code.
- [x] `GET /api/v1/decks` liste les decks prêtés.
- [x] `POST /api/v1/parties` (deck choisi) crée une partie contre le bot Batch de nuit et renvoie son identifiant
      (UUID, non devinable) et la **vue du joueur** ; si le bot commence, son premier tour est déjà joué.
- [x] `GET /api/v1/parties/{id}` renvoie la vue du joueur, avec ses actions possibles.
- [x] `POST /api/v1/parties/{id}/actions` applique l'action du joueur ; après « fin de tour », le serveur fait jouer
      le bot et renvoie la nouvelle vue avec les événements du tour du bot.
- [x] Erreurs au format Problem Details : partie inconnue ou expirée (404), action illégale (422) avec la raison.
- [x] Tests par injection de requêtes, dont une partie menée jusqu'à son terme.

## Notes

- Sans comptes (EPIC-02), une partie appartient à qui connaît son identifiant : limite assumée et notée dans
  l'[ADR 0014](../../decisions/0014-parties-en-memoire.md).
- Le bot joue avec un deck prêté tiré au sort ; la vue renvoyée donne l'attaque effective de chaque composant (bonus
  de Hub compris), pour que l'écran n'ait aucune règle à calculer.

## Journal

- 2026-10-18 — création (découpage d'EPIC-04).
- 2026-10-18 — ADR 0014 ; contrat `apps/api/openapi/parties.yaml` ; `DepotParties` en mémoire (UUID, expiration
  30 min, plafond 1 000, horloge et graine injectables) ; routes `GET /decks`, `POST /parties`, `GET /parties/{id}`,
  `POST /parties/{id}/actions` (le bot joue dans la requête) ; vue du domaine enrichie de l'attaque effective ;
  9 tests dont une partie menée à son terme ; vérifié sur l'API locale. En revue.
- 2026-10-18 — livrée : parties contre le bot côté serveur : dépôt en mémoire (ADR 0014), contrat OpenAPI, 4 routes, le bot joue dans la requête
