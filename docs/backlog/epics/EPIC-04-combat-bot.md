# EPIC-04 — Combat contre le bot

- **Statut** : À affiner
- **Priorité** : Must

## Objectif

Jouer une partie courte contre un bot, avec plusieurs niveaux de difficulté, et gagner des boosters.

## Indicateur de réussite

Une partie dure moins de 5 minutes ; le bot de niveau moyen gagne environ une partie sur deux contre un joueur débutant.

## Stories

À découper : moteur de règles pur (`src/domain/`), plateau de jeu, bot (niveaux), deck prêté aux débutants,
récompense de victoire, simulation « bot contre bot » pour équilibrer les cartes.

## Hors périmètre

Combat contre d'autres joueurs (EPIC-06).
