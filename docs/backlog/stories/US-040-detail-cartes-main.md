# US-040 — Consulter le détail des cartes de sa main

- **Epic** : EPIC-04
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-040-detail-cartes-main`

## Récit

En tant que **joueur**, je veux **consulter le détail d'une carte de ma main pendant la partie** afin de **lire son
effet et ses capacités en entier avant de décider de la jouer**.

## Critères d'acceptation

- [ ] **Étant donné** une partie en cours (contre le bot ou en duel), **quand** je demande le détail d'une carte de ma
      main, **alors** je vois la carte en grand avec son nom, son type, sa famille, sa rareté, son coût, son attaque et
      ses PV (composant), son effet (sort, incident) et chacune de ses capacités avec sa définition.
- [ ] **Étant donné** que ce n'est pas mon tour, **quand** je consulte une carte de ma main, **alors** le détail
      s'affiche quand même (les cartes de la main restent consultables, seules les actions sont indisponibles).
- [ ] **Étant donné** le détail ouvert pendant mon tour, **alors** les actions possibles de cette carte (poser,
      décommissionner…) restent accessibles depuis le détail ou juste à côté, sans perdre la sélection.
- [ ] Le détail se ferme au clavier (Échap) et rend le focus à la carte de la main ; il est lisible sur téléphone
      (pas de défilement horizontal) et ne quitte pas la partie (pas de navigation vers `/cartes/:numero`).
- [ ] Aucune règle calculée dans le front (ADR 0004) : le détail affiche les données du catalogue
      (`/api/v1/cartes`), déjà chargées par l'écran.
- [ ] Tests de l'écran ; `npm run check` passe ; `npm run test:e2e` passe, audit axe-core compris.

## Notes

- Constat : dans la main, les vignettes (`hip-vignette-carte` sans titre, 7 à 8 rem de large) rendent l'effet et les
  capacités peu lisibles, et les boutons de la main sont désactivés pendant le tour adverse : on ne peut alors même
  plus sélectionner une carte.
- Piste : réutiliser la présentation de `hip-detail-carte` (fenêtre `<dialog>` native, focus piégé, Échap) en
  l'extrayant dans un composant d'affichage sans route, utilisable par le catalogue et par la partie. Un bouton
  « Détail » sur chaque carte de la main, ou un appui long ; à trancher en affinant.
- Question ouverte : étendre au plateau (mes composants et ceux de l'adversaire, avec leurs PV et statuts actuels) ?
  Probablement une story à part, une fois celle-ci livrée.
- L'encadré « Capacités en jeu » reste utile pour la vue d'ensemble ; le détail le complète carte par carte.

## Journal

- 2026-10-19 — création, à la demande du porteur du projet.
