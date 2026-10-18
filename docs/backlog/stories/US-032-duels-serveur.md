# US-032 — Duels côté serveur : créer, rejoindre, jouer à son tour

- **Epic** : EPIC-06
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-032-duels-serveur`

## Récit

En tant que **joueur connecté**, je veux **qu'un duel contre un autre joueur soit tenu par le serveur** afin de
**jouer à mon rythme sans que personne ne puisse tricher**.

## Critères d'acceptation

- [ ] L'ADR [0020](../../decisions/0020-duels-asynchrones.md) est accepté par le porteur du projet.
- [ ] Une table `duels` (migration) garde les deux joueurs, leurs decks, l'état du moteur, le joueur actif,
      l'issue, l'échéance du tour et une version ; les deux joueurs sont des comptes (ADR 0017).
- [ ] `POST /duels` crée un duel en attente d'adversaire avec le deck choisi ; `POST /duels/{id}/rejoindre` le
      lance avec le deck de l'adversaire (tirage de qui commence, comme contre le bot).
- [ ] `GET /duels/{id}` renvoie **la vue du joueur qui demande** et sa version ; avec la version connue, la réponse
      est vide si rien n'a changé (304).
- [ ] `POST /duels/{id}/actions` n'est accepté que du joueur actif ; deux actions simultanées ne peuvent pas
      s'appliquer toutes les deux (409 sur version périmée) ; un tiers reçoit 403 ou 404.
- [ ] Contrat OpenAPI avant le code ; tests de l'API (droits, tour, concurrence, vue cachée de l'adversaire).

## Notes

- Réutiliser le moteur tel quel (`appliquer`, `vueDe`) et les schémas de la vue publique (US-026).

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
