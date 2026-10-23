# US-067 — Une première partie guidée

- **Epic** : EPIC-11
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-067-premiere-partie-guidee`

## Récit

En tant que **collègue qui découvre HIPMaster**, je veux **une première partie guidée pas à pas** afin de
**comprendre les règles en 5 minutes, sans rien lire avant**.

## Critères d'acceptation

- [ ] **Étant donné** un visiteur qui n'a jamais joué, **quand** il arrive sur l'accueil ou l'écran « Jouer »,
      **alors** « Apprendre à jouer (5 min) » lui est proposé. Il reste accessible depuis l'aide « Comment jouer ? ».
- [ ] **Étant donné** la partie guidée, **alors** elle oppose des decks d'initiation fixes au Stagiaire, avec une
      graine fixe : la main de départ et les pioches sont connues d'avance (moteur rejouable, ADR 0013).
- [ ] **Étant donné** chaque étape (le Débit et la pose ; l'attaque du SI ; la riposte entre composants ; la Garde ;
      la défausse pour gagner du Débit ; la fin du tour ; la victoire), **alors** une bulle explique quoi faire, met en
      évidence la zone concernée, attend le bon geste et refuse poliment un autre geste.
- [ ] **Étant donné** la fin de la partie guidée, **alors** l'écran félicite le joueur et propose une partie contre
      Stagiaire avec le conseil activé (US-066). La partie guidée ne rapporte pas de booster.
- [ ] Bulles annoncées aux lecteurs d'écran, utilisables au clavier et en 375 px ; parcours e2e qui suit la partie
      guidée jusqu'au bout.

## Notes

- À faire après US-059 (plateau qui tient dans un écran de téléphone), pour ne pas refaire les bulles.
- Le scénario (decks, graine, étapes) est une donnée versionnée du domaine, comme le catalogue (ADR 0011).

## Journal

- 2026-10-23 — création, à la demande du porteur du projet (« un mode tuto »).
