# US-084 — Jouer avec son deck contre le bot et en duel

- **Epic** : EPIC-15
- **Statut** : Faite
- **ADR** : [0049](../../decisions/0049-jouer-avec-son-deck.md)
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-084-jouer-avec-son-deck`

## Récit

En tant que **joueur**, je veux **choisir un de mes decks au moment de jouer** afin de **mettre ma stratégie à
l'épreuve contre le bot et contre mes collègues**.

## Critères d'acceptation

- [x] **Étant donné** l'écran « Jouer contre le bot », **alors** mes decks valides apparaissent à côté des decks
      prêtés, avec leur nom et leur aperçu, et la partie se lance avec le deck choisi (ADR 0030 : le deck est gardé
      dans la partie).
      → Mes decks complets en tête de liste, en boîte de deck (cartes phares), puis les decks prêtés ; les decks
      incomplets ne sont pas proposés, et l'écran dit combien attendent d'être complétés.
- [x] **Étant donné** un défi ou un adversaire au hasard (EPIC-06), **alors** chaque joueur choisit son deck ;
      le serveur revérifie le deck au lancement.
      → `deck` accepte l'identifiant d'un de ses decks dans `POST /parties`, `POST /duels`, `POST /duels/hasard` et
      `POST /duels/{id}/rejoindre` ; 422 `deck-incomplet` pour un deck devenu incomplet, `deck-inconnu` pour le deck
      d'un autre joueur (ADR 0049). Le défi annonce le nom du deck du créateur.
- [x] **Étant donné** un deck modifié pendant une partie en cours, **alors** la partie garde le deck de son
      lancement.
      → La composition est copiée dans l'état du moteur au lancement ; le créateur d'un duel la fige dès la création
      (`cartes_createur`, `nom_deck_createur`), même si le deck change ou disparaît avant qu'un adversaire le rejoigne.
- [x] Le score et le classement (US-069) ne dépendent pas du deck choisi ; la partie guidée (US-067) garde son deck
      fixe.
      → Inchangés : le score ne lit pas le deck, la partie guidée ignore `deck` (tests existants).

## Journal

- 2026-10-26 — création, à la demande du porteur du projet (EPIC-15).
- 2026-10-26 — affinée (ADR 0049 : revérifié au lancement, figé dans la partie), puis codée : API, écrans de choix
  du deck (bot, défi, adversaire au hasard, relever un défi), textes anglais, tests unitaires, d'API (PGlite et
  PostgreSQL 18) et e2e.
- 2026-10-26 — livrée : Ses decks complets proposés contre le bot et en duel, revérifiés au lancement et figés dans la partie
