# US-013 — Écran de partie contre le bot

- **Epic** : EPIC-04
- **Statut** : En revue
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-013-ecran-partie-pve`

## Récit

En tant que **joueur**, je veux **affronter le bot sur mon téléphone en moins de 5 minutes** afin de **découvrir le
jeu en jouant**.

## Critères d'acceptation

- [x] Depuis l'accueil, « Jouer contre le bot » mène au choix d'un deck prêté, puis à la partie.
- [x] Le plateau montre les deux SI et leur SLA, le Débit, le nombre de cartes en pioche et en main de l'adversaire,
      les composants posés de chaque camp et ma main, avec les cartes d'US-009.
- [x] Je joue au toucher, à la souris et **au clavier** : poser une carte, choisir un attaquant puis sa cible,
      décommissionner, finir mon tour. Seules les actions possibles sont proposées (elles viennent de l'API).
- [x] Les actions du bot s'affichent pas à pas et sont annoncées aux lecteurs d'écran (journal `aria-live`).
- [x] La fin de partie affiche victoire, défaite ou nulle, et propose de rejouer.
- [x] Utilisable sur 375 px sans défilement horizontal, en clair et en sombre, sans violation axe-core ; un parcours
      e2e joue au moins un tour complet ; `npm run check`, `npm run build` et `npm run test:e2e` passent.

## Notes

- Aucune règle de jeu côté front (ADR 0004 et 0006) : l'écran affiche la vue et envoie des actions.
- Le journal défile ligne par ligne (250 ms) pour le tour qui vient de se jouer ; avec `prefers-reduced-motion`, tout
  s'affiche d'un coup. Ce qui restait à afficher est rattrapé à chaque nouvelle réponse : le journal reste dans
  l'ordre et ne prend jamais de retard sur le plateau.
- Sur le plateau, les composants sont des **jetons** compacts (cadre de rareté, nom, attaque et PV du moment) ; la
  main reprend les cartes d'US-009.
- Captures : `docs/produit/captures/us-013-*.png`.

## Journal

- 2026-10-18 — création (découpage d'EPIC-04).
- 2026-10-18 — écrans `/jouer` (choix du deck) et `/jouer/:id` (partie) ; jetons de plateau ; actions au toucher et
  au clavier, issues de `vue.actions` ; journal `role="log"` ; fin de partie avec le focus sur le résultat ;
  12 tests unitaires et 5 parcours e2e (dont une partie complète jusqu'au résultat, audit axe-core en clair et en
  sombre). Un défaut trouvé par l'e2e (journal mélangé quand deux réponses se chevauchaient) est corrigé et couvert.
  En revue.
