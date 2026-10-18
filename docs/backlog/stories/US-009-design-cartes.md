# US-009 — Design des cartes façon carte à jouer

- **Epic** : EPIC-05
- **Statut** : Prête
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-009-design-cartes`

## Récit

En tant que **joueur de l'équipe d'intégration**, je veux **que les cartes ressemblent à de vraies cartes à
collectionner** afin d'**avoir envie de les parcourir, de les collectionner et de les montrer**.

## Critères d'acceptation

### La carte (composant réutilisable `hip-carte`)

- [ ] **Étant donné** une carte du catalogue, **alors** elle s'affiche au format portrait (rapport proche de 5:7), coins
      arrondis, avec de haut en bas : un bandeau (pastille de rareté et coût en Débit), une **zone d'illustration**, le
      nom en gras, le type et la famille, un texte court (effet ou capacités), puis un pied séparé avec **Attaque**
      (icône d'épée) et **PV** (icône de bouclier) pour les composants et les évolutions.
- [ ] Chaque **rareté** a son propre cadre et son fond (commune, rare, épique, légendaire de plus en plus marqués), et
      se lit aussi par un libellé et un symbole, jamais par la seule couleur.
- [ ] Chaque **famille** a sa couleur d'accent et son pictogramme, repris dans la zone d'illustration tant que les
      vraies illustrations (stories suivantes d'EPIC-05) n'existent pas.
- [ ] Le composant ne dépend que des données de l'API : il servira tel quel au deck, aux boosters et au combat.

### Le catalogue

- [ ] Sur un téléphone (375 px), les cartes s'affichent en **grille de 2 colonnes**, puis 3 à 5 colonnes sur des
      écrans plus larges, sans défilement horizontal.
- [ ] Les filtres par famille et par rareté et le compteur annoncé aux lecteurs d'écran sont conservés.

### Le détail (façon WikiMasters)

- [ ] **Quand** je choisis une carte, **alors** son détail s'ouvre dans une **fenêtre modale** au-dessus du catalogue :
      la carte en grand d'un côté, un panneau de l'autre (empilés sur téléphone) avec le nom, un badge de rareté,
      des tuiles Débit / Attaque / PV, les capacités décrites, l'effet, le texte « En vrai » et, pour une évolution,
      le lien vers sa carte d'origine.
- [ ] L'URL `/cartes/:numero` ouvre directement ce détail et reste partageable ; à la fermeture (bouton, touche
      Échap, clic en dehors), je retrouve le catalogue **avec mes filtres** et le focus revient sur la carte choisie.
- [ ] Dans la modale, le focus reste piégé et le titre est annoncé (rôle `dialog`, `aria-modal`, nom accessible).

### Qualité

- [ ] Les contrastes respectent WCAG AA sur chaque cadre de rareté ; les effets de survol respectent
      `prefers-reduced-motion`.
- [ ] Tests unitaires du composant carte et de la modale ; les parcours e2e du catalogue sont adaptés, sans
      violation axe-core sur mobile et sur bureau ; `npm run check`, `npm run build` et `npm run test:e2e` passent.
- [ ] Une capture de la carte et du détail, sur mobile et sur bureau, est jointe à la PR.

## Notes

- **Référence visuelle** : la fenêtre de détail d'une carte de WikiMasters (capture partagée par le porteur du
  projet le 2026-10-18). On transpose ATK / DEF en Attaque / PV et on ajoute le coût en Débit. On ne reprend ni
  leurs visuels ni leurs icônes : seulement la composition.
- **Hors périmètre** : étiquettes, favoris, marché et enchères, défausse contre de la monnaie (EPIC-03 et EPIC-07) ;
  vraies illustrations et chaîne d'optimisation des images (stories suivantes d'EPIC-05) ; effets holographiques.
- **Icônes** : SVG en ligne dans le projet, sans nouvelle dépendance.
- **Question ouverte, à trancher au début de la story** : WikiMasters est en thème sombre. Faut-il un thème sombre
  pour HIPMaster, le seul thème clair actuel, ou suivre la préférence du système ? Si on retient deux thèmes, le
  choix (jetons de couleur, bascule) sera consigné dans un ADR.

## Journal

- 2026-10-18 — création, à partir de la capture WikiMasters ; US-008 validée par le porteur du projet.
