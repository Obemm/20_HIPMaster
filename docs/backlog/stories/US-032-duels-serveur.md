# US-032 — Duels côté serveur : créer, rejoindre, jouer à son tour

- **Epic** : EPIC-06
- **Statut** : En revue
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-032-duels-serveur`

## Récit

En tant que **joueur connecté**, je veux **qu'un duel contre un autre joueur soit tenu par le serveur** afin de
**jouer à mon rythme sans que personne ne puisse tricher**.

## Critères d'acceptation

- [x] L'ADR [0020](../../decisions/0020-duels-asynchrones.md) est accepté par le porteur du projet.
- [x] Une table `duels` (migration) garde les deux joueurs, leurs decks, l'état du moteur, le joueur actif,
      l'issue, l'échéance du tour et une version ; les deux joueurs sont des comptes (ADR 0017).
- [x] `POST /duels` crée un duel en attente d'adversaire avec le deck choisi ; `POST /duels/{id}/rejoindre` le
      lance avec le deck de l'adversaire (tirage de qui commence, comme contre le bot).
- [x] `GET /duels/{id}` renvoie **la vue du joueur qui demande** et sa version ; avec la version connue, la réponse
      est vide si rien n'a changé (304).
- [x] `POST /duels/{id}/actions` n'est accepté que du joueur actif ; deux actions simultanées ne peuvent pas
      s'appliquer toutes les deux (409 sur version périmée) ; un tiers reçoit 404.
- [x] Contrat OpenAPI avant le code ; tests de l'API (droits, tour, concurrence, vue cachée de l'adversaire).

## Notes

- Réutiliser le moteur tel quel (`appliquer`, `vueDe`) et les schémas de la vue publique (US-026).

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
- 2026-10-19 — ADR 0020 accepté. Contrat `openapi/duels.yaml` ; table `duels` (migration `0005_duels`, état du
  moteur en JSON, version) ; module `duels/duels.ts` (créer, lire, rejoindre, jouer, dans des transactions qui
  verrouillent la ligne) ; routes `/duels` avec `ETag`, `If-None-Match` (304) et `If-Match` (409 si périmé) ; le
  créateur joue j1, l'adversaire j2, le tirage désigne qui commence. Un tiers voit un duel en attente (pour le
  rejoindre, US-033) mais jamais un duel commencé (404). Tests de l'API (8), dont un duel joué jusqu'au bout.
