# US-025 — Un booster pour chaque victoire

- **Epic** : EPIC-04
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-025-recompense-victoire`

## Récit

En tant que **joueur connecté**, je veux **gagner un booster quand je bats le bot** afin d'**avoir une raison de
rejouer**.

## Critères d'acceptation

- [ ] Une victoire contre le bot, partie jouée en étant connecté, rapporte **un booster** (plafond de 3 par jour,
      réglable) ; la récompense est attribuée **par le serveur**, une seule fois par partie.
- [ ] L'écran de fin de partie annonce le booster gagné (ou le plafond atteint) et mène à son ouverture.
- [ ] Tests de l'API (récompense unique, plafond) et de l'écran.

## Notes

- Dépend d'US-022 (compte) et d'US-023 (boosters).

## Journal

- 2026-10-18 — création.
