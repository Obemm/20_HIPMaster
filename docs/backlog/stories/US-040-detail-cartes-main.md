# US-040 — Consulter le détail des cartes de sa main

- **Epic** : EPIC-04
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-040-detail-cartes-main`

## Récit

En tant que **joueur**, je veux **consulter le détail d'une carte de ma main pendant la partie** afin de **lire son
effet et ses capacités en entier avant de décider de la jouer**.

## Critères d'acceptation

- [x] **Étant donné** une partie en cours (contre le bot ou en duel), **quand** je touche une carte de ma main,
      **alors** elle est sélectionnée et s'affiche en grand, avec son nom, son type, sa famille, sa rareté, son coût,
      son attaque et ses PV (composant), son effet (sort, incident), chacune de ses capacités avec sa définition, la
      carte dont elle est l'évolution le cas échéant, et son « En vrai ».
- [x] **Étant donné** que c'est mon tour, **alors** les actions possibles de la carte (poser, décommissionner…) sont
      proposées sous son détail. La sélection ne joue rien : regarder et agir restent deux gestes distincts.
- [x] **Étant donné** que ce n'est pas mon tour, **quand** je touche une carte de ma main, **alors** son détail
      s'affiche quand même, sans actions, avec un message qui dit que je pourrai la jouer à mon tour.
- [x] Toucher de nouveau la carte, le bouton « Fermer » ou la touche Échap referment le détail ; le focus revient à
      la carte de la main. Le détail est lisible sur téléphone, sans défilement horizontal, et ne quitte pas la
      partie.
- [x] Aucune règle calculée dans le front (ADR 0004) : le détail affiche les données du catalogue
      (`/api/v1/cartes`), déjà chargées par l'écran ; les actions restent celles de `vue.actions`.
- [x] Tests de l'écran ; `npm run check` passe ; `npm run test:e2e` passe, audit axe-core compris.

## Notes

- Constat : dans la main, les vignettes (`hip-vignette-carte` sans titre, 7 à 8 rem de large) rendent l'effet et les
  capacités peu lisibles, et les boutons de la main sont désactivés pendant le tour adverse : on ne peut alors même
  plus sélectionner une carte.
- Décision du porteur du projet (2026-10-19), d'après la pratique des jeux de cartes numériques (Marvel Snap,
  Hearthstone, MTG Arena, Legends of Runeterra) : regarder une carte est toujours possible, y compris pendant le tour
  adverse ; regarder et agir sont séparés ; les capacités sont définies là où on les lit. Toucher une carte la
  sélectionne et l'affiche en grand, avec ses actions dessous, plutôt qu'un bouton « Détail » en plus. L'appui long
  et le survol pourront venir plus tard comme raccourcis, jamais comme seul moyen (ni découvrables, ni accessibles
  au clavier).
- Le détail s'affiche dans la page, sous la main, et non dans une fenêtre modale : les actions restent à portée et
  la partie reste visible.
- Le plateau (mes composants et ceux de l'adversaire, avec leurs PV actuels) fait l'objet d'US-041.

## Journal

- 2026-10-19 — création, à la demande du porteur du projet.
- 2026-10-19 — affinée : sélection = détail + actions, consultable pendant le tour adverse (décision du porteur du
  projet, d'après les jeux de cartes numériques). Branche partie d'`us-039-expliquer-attaques`, pas encore fusionnée,
  pour éviter les conflits sur l'écran de partie.
- 2026-10-19 — livrée : Toucher une carte de la main l'affiche en grand sous la main (effet, capacités définies sur place, évolution, « En vrai »), avec ses actions dessous à son tour ; consultable pendant le tour adverse ; fermeture par la carte, Fermer ou Échap avec retour du focus.
