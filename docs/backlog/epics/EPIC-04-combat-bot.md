# EPIC-04 — Combat contre le bot

- **Statut** : En cours
- **Priorité** : Must

## Objectif

Jouer une partie courte contre un bot, avec plusieurs niveaux de difficulté, et gagner des boosters.

## Indicateur de réussite

Une partie dure moins de 5 minutes ; le bot de niveau facile gagne au plus une partie sur deux contre un joueur
débutant, et commencer ne donne pas d'avance décisive.

Indicateur revu le 2026-10-22 (US-064) : il visait le niveau moyen (Architecte ESB du temps d'US-021), mais un
débutant ne gagne qu'environ une partie sur sept contre Batch de nuit, désormais moyen, et moins encore contre
Architecte ESB. C'est le niveau facile, Stagiaire, qui lui laisse plus d'une partie sur deux.

## Stories

- [x] US-010 — Moteur de combat : règles de base
- [x] US-011 — Bot « Batch de nuit » et decks prêtés
- [x] US-012 — API de partie contre le bot
- [x] US-013 — Écran de partie contre le bot
- [x] US-014 — Sorts et incidents
- [x] US-019 — Effets propres des composants
- [x] US-020 — Capacités IA et Migration
- [x] US-021 — Niveaux du bot
- [x] US-025 — Un booster pour chaque victoire
- [x] US-026 — Une vue publique complète, qui suffit à un bot
- [x] US-039 — Expliquer les attaques et la résolution des combats
- [x] US-040 — Consulter le détail des cartes de sa main
- [x] US-041 — Consulter le détail des cartes du plateau
- [x] US-064 — Un bot battable par un débutant, une partie équitable pour les deux joueurs
- [x] US-071 — Dire pourquoi une carte de la main ne se joue pas

Premier jalon jouable à la fin d'US-013, avec les cartes que le moteur prend déjà en charge (décision du porteur du
projet, 2026-10-18). Niveaux du bot (US-021) et récompense de victoire (US-025, avec EPIC-02 et EPIC-03) rédigés le 2026-10-18.

Epic rouvert le 2026-10-22 : le porteur du projet trouve le bot presque impossible à battre ; une simulation montre
qu'aucun niveau n'est vraiment facile et que commencer donne un gros avantage (US-064).

Epic rouvert le 2026-10-23 : le porteur du projet n'arrive pas à jouer Apigee AI Gateway, une évolution dont l'écran
ne dit pas qu'elle attend sa carte d'origine sur le plateau (US-071).

## Hors périmètre

Combat contre d'autres joueurs (EPIC-06).
