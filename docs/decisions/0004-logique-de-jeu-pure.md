# 0004 — Logique de jeu en TypeScript pur, autorité serveur

- **Date** : 2026-10-16
- **Statut** : Acceptée

## Contexte

Les règles (tirage des boosters, résolution d'un tour de combat, IA du bot) sont le cœur du jeu : elles doivent être
testées finement et ne doivent pas pouvoir être truquées depuis le navigateur.

## Décision

Toute la logique de jeu vit dans `src/domain/`, en fonctions TypeScript pures, sans dépendance à Next.js ni à la base
(le hasard est injecté, ex. `tirerRarete(aleatoire)`). Le serveur l'exécute et fait foi ; le client ne fait qu'afficher.

## Alternatives envisagées

- **Logique dans les composants React** : rapide au début, mais difficile à tester et facile à tricher.
- **Moteur de jeu externe** (boardgame.io…) : contraint le modèle de jeu avant qu'il soit défini.

## Conséquences

- Tests unitaires rapides et exhaustifs avec Vitest, parties rejouables à partir d'une graine.
- La même logique servira au bot et à des simulations « bot contre bot » pour équilibrer les cartes.
