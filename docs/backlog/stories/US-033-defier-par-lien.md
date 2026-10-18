# US-033 — Défier un collègue par lien

- **Epic** : EPIC-06
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-033-defier-par-lien`

## Récit

En tant que **joueur connecté**, je veux **envoyer un lien de défi à un collègue** afin de **jouer contre lui sans
chercher son pseudo**.

## Critères d'acceptation

- [x] Depuis « Jouer », je choisis « Défier un collègue » et mon deck ; j'obtiens un lien à copier (bouton
      « Copier le lien »).
- [x] **Étant donné** le lien, **quand** mon collègue l'ouvre, **alors** il voit qui le défie, choisit son deck
      et accepte ; sans compte, il est invité à en créer un, puis revient au défi.
- [x] Un défi ne sert qu'une fois ; je ne peux pas accepter mon propre défi ; un défi non accepté expire après
      7 jours, et je peux l'annuler avant.
- [x] Tests de l'écran et parcours e2e à deux navigateurs (créer le défi, l'accepter) ; audit axe-core au vert.

## Notes

- Le lien porte l'identifiant du duel en attente (UUID non devinable).

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
- 2026-10-19 — API : `DELETE /duels/{id}` (annulation par le créateur, tant que le défi n'est pas relevé) et
  expiration des défis après 7 jours, évaluée à la lecture (410). Front : « Défier un collègue » depuis « Jouer »
  (`/duels/nouveau`), page `/duels/:id` (lien à copier et annulation pour le créateur, qui voit le défi relevé
  sans recharger ; invitation à relever le défi pour un collègue ; invitation à créer un compte puis retour au
  défi via `?retour=`, limité aux chemins internes). En attendant l'écran de duel (US-034), la page annonce à qui
  est le tour. Tests : API (3 de plus), écrans (6), e2e (4, à deux et trois navigateurs, axe en clair et en
  sombre).
- 2026-10-19 — livrée : Défier un collègue par lien : défi à partager, invitation, annulation, expiration
