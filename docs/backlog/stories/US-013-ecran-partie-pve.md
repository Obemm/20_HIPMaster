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
- [x] Une **règle courte** explique comment gagner et le déroulement d'un tour : l'objectif reste visible pendant la
      partie, et l'aide « Comment jouer ? » est ouverte au début et consultable à tout moment (retour du porteur du
      projet après sa première partie, 2026-10-18).
- [x] Les **capacités** sont expliquées en jeu : définition de chaque capacité des cartes visibles (« Capacités en
      jeu »), et aide contextuelle quand une Garde adverse bloque l'attaque (« on ne sait pas ce qu'est une carte avec
      Garde », retour du porteur du projet, 2026-10-18).
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
- 2026-10-18 — retour du porteur du projet après une partie : « je ne comprends pas comment gagner ». Ajout d'une
  règle courte (critère ajouté).
- 2026-10-18 — composant `hip-regle-courte` (comment gagner, les 4 temps d'un tour, Garde et décommission) sur
  l'écran de choix du deck et dans « Comment jouer ? », ouvert au début de la partie ; objectif toujours visible ;
  SLA affichés « sur 20 ». En revue.
- 2026-10-18 — deuxième retour (« on ne sait pas ce qu'est une carte avec Garde ») : Garde expliquée avec un exemple
  dans la règle courte, encadré « Capacités en jeu » (définitions des capacités visibles), aide qui nomme la Garde
  adverse au moment d'attaquer. En revue.
