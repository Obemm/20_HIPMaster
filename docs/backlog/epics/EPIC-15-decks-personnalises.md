# EPIC-15 — Des decks à soi

- **Statut** : Terminé
- **Priorité** : Should

## Objectif

Aujourd'hui, on ne joue qu'avec trois decks prêtés (Héritage, Moderne, Hybride, US-011). La vision produit prévoit
pourtant de **construire son deck** à partir de sa collection (`docs/produit/vision.md`). Demande du porteur du
projet (2026-10-26) : chaque joueur doit pouvoir se construire des decks personnalisés et jouer avec, ce qui donne
enfin un sens à la collection et aux boosters.

## Indicateur de réussite

- Un joueur compose un deck à partir des cartes qu'il possède, le nomme, le garde, et le retrouve sur un autre
  appareil (compte invité, US-022).
- Il joue avec ce deck contre le bot et en duel ; le serveur vérifie toujours le deck (taille, exemplaires, cartes
  possédées), jamais le front (ADR 0004).
- Les decks prêtés restent disponibles, pour débuter.

## Stories

- [x] US-083 — Construire, nommer et garder ses decks à partir de sa collection
- [x] US-084 — Jouer avec son deck contre le bot et en duel

Ordre : US-083, puis US-084.

## Hors périmètre

- L'échange ou la vente de cartes entre joueurs.
- Des formats de deck différents (taille, restrictions par famille) : les règles actuelles (20 cartes, 2 exemplaires
  au plus, 1 pour une légendaire, `validerDeck` du domaine) s'appliquent.
