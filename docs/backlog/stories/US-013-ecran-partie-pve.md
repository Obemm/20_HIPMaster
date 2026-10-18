# US-013 — Écran de partie contre le bot

- **Epic** : EPIC-04
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-013-ecran-partie-pve`

## Récit

En tant que **joueur**, je veux **affronter le bot sur mon téléphone en moins de 5 minutes** afin de **découvrir le
jeu en jouant**.

## Critères d'acceptation

- [ ] Depuis l'accueil, « Jouer contre le bot » mène au choix d'un deck prêté, puis à la partie.
- [ ] Le plateau montre les deux SI et leur SLA, le Débit, le nombre de cartes en pioche et en main de l'adversaire,
      les composants posés de chaque camp et ma main, avec les cartes d'US-009.
- [ ] Je joue au toucher, à la souris et **au clavier** : poser une carte, choisir un attaquant puis sa cible,
      décommissionner, finir mon tour. Seules les actions possibles sont proposées (elles viennent de l'API).
- [ ] Les actions du bot s'affichent pas à pas et sont annoncées aux lecteurs d'écran (journal `aria-live`).
- [ ] La fin de partie affiche victoire, défaite ou nulle, et propose de rejouer.
- [ ] Utilisable sur 375 px sans défilement horizontal, en clair et en sombre, sans violation axe-core ; un parcours
      e2e joue au moins un tour complet ; `npm run check`, `npm run build` et `npm run test:e2e` passent.

## Notes

- Aucune règle de jeu côté front (ADR 0004 et 0006) : l'écran affiche la vue et envoie des actions.
- Les animations respectent `prefers-reduced-motion`.

## Journal

- 2026-10-18 — création (découpage d'EPIC-04).
