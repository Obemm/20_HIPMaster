# US-041 — Consulter le détail des cartes du plateau

- **Epic** : EPIC-04
- **Statut** : Prête
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-041-detail-cartes-plateau`

## Récit

En tant que **joueur**, je veux **consulter le détail de n'importe quel composant en jeu, le mien ou celui de
l'adversaire** afin de **comprendre ce qu'il fait avant de l'attaquer ou de m'en défendre**.

## Critères d'acceptation

- [ ] **Étant donné** une partie en cours (contre le bot ou en duel), **quand** je touche un composant du plateau
      (mon camp ou celui de l'adversaire), à mon tour ou pendant le tour adverse, **alors** il est sélectionné et sa
      carte s'affiche en grand, comme pour la main (US-040) : nom, type, famille, rareté, coût, effet, capacités avec
      leur définition, évolution, « En vrai ». S'y ajoute son **état du moment** : PV restants sur PV de la carte,
      attaque actuelle (bonus compris) à côté de l'attaque de la carte, et ses statuts en toutes lettres (posé ce
      tour, a déjà attaqué, immobilisé, sans capacités, doublon, attaque nulle, couplé, outillé). Les statuts
      restent ceux que le serveur expose : rien n'est recalculé dans le front (ADR 0004).
- [ ] **Étant donné** mon tour, **quand** je sélectionne un de mes composants qui peut attaquer, **alors** il
      devient l'attaquant (les cibles possibles s'allument, comme aujourd'hui) et son détail dit « Choisissez une
      cible ». Un composant qui ne peut pas attaquer se sélectionne aussi ; son détail dit pourquoi il n'attaque pas
      quand le serveur le sait (posé ce tour, a déjà attaqué, immobilisé, attaque nulle).
- [ ] **Étant donné** un attaquant choisi, **quand** je touche une cible possible (un composant adverse allumé ou le
      SI adverse), **alors** elle est sélectionnée et son détail s'affiche, **sans attaquer** ; sous le détail, un
      bouton « Attaquer avec [attaquant] » lance l'attaque. Regarder et agir restent deux gestes distincts partout :
      la sélection ne joue jamais, les actions sont toujours sous le détail.
- [ ] **Étant donné** une cible sélectionnée, **quand** je touche un autre de mes attaquants possibles, **alors** il
      devient l'attaquant et la cible reste sélectionnée si elle est encore possible pour lui ; sinon, elle est
      désélectionnée.
- [ ] Un seul détail à la fois : sélectionner une carte de la main ferme le détail du plateau, et inversement.
      Toucher de nouveau le composant, le bouton « Fermer » ou la touche Échap referment le détail ; le focus revient
      au jeton. Le détail est lisible sur téléphone, sans défilement horizontal, et ne quitte pas la partie.
- [ ] Le journal et la règle courte restent exacts : la règle courte (US-039) dit désormais « sélectionnez
      l'attaquant, puis sa cible, puis confirmez l'attaque ».
- [ ] Tests de l'écran ; `npm run check` passe ; `npm run test:e2e` passe (les parcours d'attaque ajoutent le
      troisième toucher), audit axe-core compris.

## Notes

- Suite d'US-040, d'après le même principe des jeux de cartes numériques : tout ce qui est visible s'inspecte.
- **Décision du porteur du projet (2026-10-19)** : sélection = détail, attaque confirmée. Trois gestes au lieu de
  deux pour attaquer, mais un seul geste partout pour regarder (main et plateau), les actions toujours sous le
  détail, et plus d'attaque lancée par erreur sur téléphone. Écartés : « toucher une cible allumée attaque tout de
  suite » (incohérent avec la main : la sélection y ne joue jamais) et un bouton ⓘ sur chaque jeton (deux cibles
  tactiles serrées par jeton).
- Le jeton (`hip-jeton-composant`) reste purement visuel ; le bouton qui l'entoure n'est plus désactivé : il est
  toujours cliquable pour regarder, et `aria-pressed` reflète la sélection. « Peut attaquer » et « cible possible »
  restent signalés visuellement et dans le nom accessible.
- Le détail du plateau réutilise le panneau d'US-040 (une seule « carte choisie », main ou plateau) : le composant
  s'affiche avec `hip-vignette-carte`, et un encart « En jeu » porte l'état du moment. Le bouton « Attaquer avec… »
  envoie l'action `attaquer` déjà fournie par `vue.actions` ; aucune règle dans le front.
- Pendant le tour adverse, le détail s'affiche sans action, avec le message d'US-040 (« à votre tour »).

## Journal

- 2026-10-19 — création, à la demande du porteur du projet, en découpant US-040.
- 2026-10-19 — affinée : geste tranché (sélection = détail, attaque confirmée sous le détail de la cible) ;
  critères détaillés ; statut « Prête ». Branche partie d'`us-040-detail-cartes-main` (PR #34), à rebaser sur
  `main` après sa fusion.
