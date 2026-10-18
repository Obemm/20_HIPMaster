# US-012 — API de partie contre le bot

- **Epic** : EPIC-04
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-012-api-partie-pve`

## Récit

En tant que **joueur**, je veux **que la partie se déroule sur le serveur** afin que **personne ne puisse tricher et
que le bot joue selon les mêmes règles que moi**.

## Critères d'acceptation

- [ ] Un ADR consigne le choix : l'état des parties en cours est **gardé en mémoire** par l'API, avec expiration
      (parties abandonnées) et nombre maximal de parties ; une partie est perdue si l'API redémarre. À revoir avec
      les comptes joueurs et le passage à plusieurs instances.
- [ ] Le contrat OpenAPI des ressources `decks` et `parties` est écrit avant le code.
- [ ] `GET /api/v1/decks` liste les decks prêtés.
- [ ] `POST /api/v1/parties` (deck choisi) crée une partie contre le bot Batch de nuit et renvoie son identifiant
      (UUID, non devinable) et la **vue du joueur** ; si le bot commence, son premier tour est déjà joué.
- [ ] `GET /api/v1/parties/{id}` renvoie la vue du joueur, avec ses actions possibles.
- [ ] `POST /api/v1/parties/{id}/actions` applique l'action du joueur ; après « fin de tour », le serveur fait jouer
      le bot et renvoie la nouvelle vue avec les événements du tour du bot.
- [ ] Erreurs au format Problem Details : partie inconnue ou expirée (404), action illégale (422) avec la raison.
- [ ] Tests par injection de requêtes, dont une partie menée jusqu'à son terme.

## Notes

- Sans comptes (EPIC-02), une partie appartient à qui connaît son identifiant : limite assumée et notée dans l'ADR.

## Journal

- 2026-10-18 — création (découpage d'EPIC-04).
