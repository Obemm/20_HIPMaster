# US-061 — Une identité visuelle et un accueil qui donnent envie

- **Epic** : EPIC-10
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-061-accueil-identite-visuelle`

## Récit

En tant que **collègue qui reçoit une invitation**, je veux **comprendre en un coup d'œil que HIPMaster est un jeu
de cartes, et avoir envie d'y jouer** afin de **créer mon compte au lieu de refermer l'onglet**.

## Contexte

Constat de la revue du 2026-10-22 : l'interface est entièrement en niveaux de gris (jetons `--hip-*` de zinc,
l'accent est la couleur du texte), avec la police système et aucun logo. L'accueil montre un titre, deux boutons,
un tableau des chances par booster et la mention « Projet en cours de construction », mais aucune carte. Seules les
cartes ont de la couleur (cadres de rareté, illustrations vectorielles d'US-018).

## Critères d'acceptation

- [ ] **Étant donné** les jetons de couleur (ADR 0012), **alors** une couleur d'accent de marque et sa variante
      sombre sont définies et utilisées par les actions principales, avec un contraste AA vérifié dans les deux
      thèmes.
- [ ] **Étant donné** la typographie, **alors** une échelle de tailles et une police de titres sont choisies,
      auto-hébergées (aucun appel à un service tiers), sans dégrader le temps d'affichage.
- [ ] **Étant donné** l'en-tête, **alors** un logo (SVG) remplace le texte « HIPMaster », et le site a sa propre
      icône d'onglet et d'écran d'accueil (voir US-063) : `public/favicon.ico` est aujourd'hui celui d'Angular par
      défaut.
- [ ] **Étant donné** l'accueil, **quand** un visiteur arrive, **alors** il voit quelques cartes du set, la promesse
      du jeu en une phrase, et une action principale adaptée (« Créer mon compte » s'il a une invitation, « Jouer »
      sinon) ; « Projet en cours de construction » disparaît ; les chances par booster vont dans l'écran des
      boosters.
- [ ] **Étant donné** un lien vers le jeu partagé dans une messagerie, **alors** l'aperçu affiche un titre, une
      description et une image (balises Open Graph).

## Notes

- S'appuyer sur la direction artistique d'US-016 (fond bleu nuit et halos du style « Sunlit Sketches ») pour que
  l'interface et les futures illustrations parlent la même langue.
- ADR-019 Elis (Figma) : une maquette de l'accueil et du plateau avant le code, si le porteur du projet le souhaite.

## Journal

- 2026-10-22 — création, issue de la revue du design avant mise en ligne.
