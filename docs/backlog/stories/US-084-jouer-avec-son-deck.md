# US-084 — Jouer avec son deck contre le bot et en duel

- **Epic** : EPIC-15
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-084-jouer-avec-son-deck`

## Récit

En tant que **joueur**, je veux **choisir un de mes decks au moment de jouer** afin de **mettre ma stratégie à
l'épreuve contre le bot et contre mes collègues**.

## Critères d'acceptation

- [ ] **Étant donné** l'écran « Jouer contre le bot », **alors** mes decks valides apparaissent à côté des decks
      prêtés, avec leur nom et leur aperçu, et la partie se lance avec le deck choisi (ADR 0030 : le deck est gardé
      dans la partie).
- [ ] **Étant donné** un défi ou un adversaire au hasard (EPIC-06), **alors** chaque joueur choisit son deck ;
      le serveur revérifie le deck au lancement.
- [ ] **Étant donné** un deck modifié pendant une partie en cours, **alors** la partie garde le deck de son
      lancement.
- [ ] Le score et le classement (US-069) ne dépendent pas du deck choisi ; la partie guidée (US-067) garde son deck
      fixe.

## Journal

- 2026-10-26 — création, à la demande du porteur du projet (EPIC-15).
