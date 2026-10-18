# US-038 — Un booster pour une victoire en duel

- **Epic** : EPIC-06
- **Statut** : À affiner
- **Priorité** : Could
- **Taille** : S
- **Branche** : `us-038-recompense-duel`

## Récit

En tant que **joueur connecté**, je veux **gagner un booster quand je remporte un duel** afin d'**avoir une raison
de défier mes collègues**.

## Critères d'acceptation

- [ ] Une victoire en duel rapporte un booster, dans le même plafond quotidien que les victoires contre le bot
      (US-025), une seule fois par duel.
- [ ] Une victoire par abandon ou forfait compte, sauf contre un adversaire déjà affronté le même jour (pour
      décourager les arrangements).
- [ ] L'écran de fin annonce le booster gagné ; tests de l'API et de l'écran.

## Notes

- Réutiliser la table `recompenses` (US-025), dont la clé devient l'identifiant de partie ou de duel.

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
