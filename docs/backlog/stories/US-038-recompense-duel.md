# US-038 — Un booster pour une victoire en duel

- **Epic** : EPIC-06
- **Statut** : Faite
- **Priorité** : Could
- **Taille** : S
- **Branche** : `us-038-recompense-duel`

## Récit

En tant que **joueur connecté**, je veux **gagner un booster quand je remporte un duel** afin d'**avoir une raison
de défier mes collègues**.

## Critères d'acceptation

- [x] Une victoire en duel rapporte un booster, dans le même plafond quotidien que les victoires contre le bot
      (US-025), une seule fois par duel.
- [x] Une victoire par abandon ou forfait compte, sauf contre un adversaire déjà affronté le même jour (pour
      décourager les arrangements).
- [x] L'écran de fin annonce le booster gagné ; tests de l'API et de l'écran.

## Notes

- Réutiliser la table `recompenses` (US-025), dont la clé devient l'identifiant de partie ou de duel.

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
- 2026-10-19 — `recompenserVictoire` sert aussi aux duels (la colonne `partie_id` de `recompenses` porte
  l'identifiant de la partie ou du duel) ; nouvelle colonne `motif` (migration `0007_motif_recompense`) :
  « plafond » ou « adversaire-deja-affronte ». Un duel gagné expose `recompense` au vainqueur seulement, décidée
  une fois. Victoire par abandon ou forfait sans booster s'il existe un autre duel entre les deux joueurs créé le
  même jour UTC. Écran de fin : booster gagné, plafond, ou « ne compte qu'une fois par jour contre le même
  adversaire ». Tests : API (2), écran (1), e2e (booster annoncé au vainqueur d'un abandon).
- 2026-10-19 — livrée : Booster pour une victoire en duel, plafond commun, garde-fou contre les arrangements
