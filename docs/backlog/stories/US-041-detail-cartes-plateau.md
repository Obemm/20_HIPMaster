# US-041 — Consulter le détail des cartes du plateau

- **Epic** : EPIC-04
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-041-detail-cartes-plateau`

## Récit

En tant que **joueur**, je veux **consulter le détail de n'importe quel composant en jeu, le mien ou celui de
l'adversaire** afin de **comprendre ce qu'il fait avant de l'attaquer ou de m'en défendre**.

## Critères d'acceptation

- [ ] **Étant donné** une partie en cours, **quand** je demande le détail d'un composant du plateau (mon camp ou
      celui de l'adversaire), **alors** je vois sa carte en entier (comme pour la main, US-040), avec en plus son état
      actuel : PV restants, attaque actuelle, statuts (posé ce tour, a déjà attaqué, bloqué…).
- [ ] Consulter un composant ne lance pas d'attaque : regarder et agir restent deux gestes distincts, y compris
      quand le composant est un attaquant ou une cible possible.
- [ ] Le détail reste consultable pendant le tour adverse.
- [ ] Tests de l'écran ; `npm run check` passe ; `npm run test:e2e` passe, audit axe-core compris.

## Notes

- Suite d'US-040, d'après le même principe des jeux de cartes numériques : tout ce qui est visible s'inspecte.
- Question à trancher : sur le plateau, toucher un composant sert déjà à choisir l'attaquant et la cible. Il faut
  donc un second geste pour regarder (bouton ⓘ sur le jeton, ou détail affiché à la sélection de l'attaquant). À
  décider en affinant.

## Journal

- 2026-10-19 — création, à la demande du porteur du projet, en découpant US-040.
