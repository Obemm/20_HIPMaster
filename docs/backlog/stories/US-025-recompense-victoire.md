# US-025 — Un booster pour chaque victoire

- **Epic** : EPIC-04
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-025-recompense-victoire`

## Récit

En tant que **joueur connecté**, je veux **gagner un booster quand je bats le bot** afin d'**avoir une raison de
rejouer**.

## Critères d'acceptation

- [x] Une victoire contre le bot, partie jouée en étant connecté, rapporte **un booster** (plafond de 3 par jour,
      réglable) ; la récompense est attribuée **par le serveur**, une seule fois par partie.
- [x] L'écran de fin de partie annonce le booster gagné (ou le plafond atteint) et mène à son ouverture.
- [x] Tests de l'API (récompense unique, plafond) et de l'écran.

## Notes

- Dépend d'US-022 (compte) et d'US-023 (boosters).

## Journal

- 2026-10-18 — création.
- 2026-10-18 — la partie retient le joueur connecté qui l'a lancée (jeton facultatif sur `POST /parties`) ; une
  victoire ajoute `recompense` à la partie (`GET` et `POST …/actions`). Table `recompenses` (une ligne par partie
  gagnée, migration `0004_recompenses`) : une seule récompense par partie, plafond de 3 boosters par jour UTC
  (`REGLES_BOOSTERS.victoiresParJour`), booster gagné ajouté au stock même au-delà du plafond de recharge. Écran de
  fin : « Un booster gagné ! » et « Ouvrir mon booster », plafond atteint, ou invitation à créer un compte. Tests :
  API (5 : unicité, plafond et lendemain, dépassement du plafond de recharge, partie gagnée connectée, partie sans
  compte), écran (3).
- 2026-10-18 — livrée : Un booster par victoire contre le bot, une fois par partie, 3 par jour au plus
