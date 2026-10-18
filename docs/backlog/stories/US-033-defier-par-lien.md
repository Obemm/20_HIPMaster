# US-033 — Défier un collègue par lien

- **Epic** : EPIC-06
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-033-defier-par-lien`

## Récit

En tant que **joueur connecté**, je veux **envoyer un lien de défi à un collègue** afin de **jouer contre lui sans
chercher son pseudo**.

## Critères d'acceptation

- [ ] Depuis « Jouer », je choisis « Défier un collègue » et mon deck ; j'obtiens un lien à copier (bouton
      « Copier le lien »).
- [ ] **Étant donné** le lien, **quand** mon collègue l'ouvre, **alors** il voit qui le défie, choisit son deck
      et accepte ; sans compte, il est invité à en créer un, puis revient au défi.
- [ ] Un défi ne sert qu'une fois ; je ne peux pas accepter mon propre défi ; un défi non accepté expire après
      7 jours, et je peux l'annuler avant.
- [ ] Tests de l'écran et parcours e2e à deux navigateurs (créer le défi, l'accepter) ; audit axe-core au vert.

## Notes

- Le lien porte l'identifiant du duel en attente (UUID non devinable).

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
