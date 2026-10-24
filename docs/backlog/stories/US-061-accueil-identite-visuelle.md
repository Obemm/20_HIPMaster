# US-061 — Une identité visuelle et un accueil qui donnent envie

- **Epic** : EPIC-10
- **Statut** : Faite
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

Demande du porteur du projet (2026-10-23) : « le redesign du site pour en faire un vrai site app de jeux en ligne
avec un design attrayant ». Travail mené de nuit, sans lui : chaque choix est noté ici, dans l'ADR 0037 et dans la
description de la PR, pour qu'il le valide ou le corrige au réveil.

### Ce qui fait « application de gestion » (relevé du 2026-10-24, toutes les pages, téléphone et bureau, deux thèmes)

| Constat                                                                                        | Où                         | Traité par           |
| ---------------------------------------------------------------------------------------------- | -------------------------- | -------------------- |
| Palette en niveaux de gris, boutons noirs (clair) ou blancs (sombre), aucune couleur de marque | partout                    | US-061 (jetons)      |
| Police du système partout, titres sans caractère                                               | partout                    | US-061 (Exo 2)       |
| « HIPMaster » en texte simple, icône d'onglet d'Angular                                        | bandeau, onglet            | US-061 (logo)        |
| Fond blanc ou noir uni, aucun décor                                                            | partout                    | US-061 (nuit, halos) |
| Accueil sans carte : titre, deux boutons, tableau de pourcentages, « en construction »         | accueil                    | US-061               |
| Lien partagé sans aperçu (ni titre, ni image)                                                  | messageries                | US-061 (Open Graph)  |
| Arrivée d'un invité sur un formulaire nu « Mon compte »                                        | compte (lien d'invitation) | US-061               |
| Listes de boîtes grises (duels, decks), longs paragraphes avant de pouvoir jouer               | jouer, duels               | US-068               |
| Filtres en listes déroulantes de formulaire                                                    | catalogue, collection      | US-068               |
| Progression en barre et tuiles de statistiques                                                 | collection                 | US-068               |
| Boosters : une phrase et un bouton, aucun paquet                                               | boosters                   | US-062               |
| Écrans de texte (confidentialité, inviter) sans hiérarchie visuelle                            | confidentialité, inviter   | US-068               |

## Critères d'acceptation

- [x] **Étant donné** les jetons de couleur (ADR 0012), **alors** une couleur d'accent de marque et sa variante
      sombre sont définies et utilisées par les actions principales, avec un contraste AA vérifié dans les deux
      thèmes.
- [x] **Étant donné** la typographie, **alors** une échelle de tailles et une police de titres sont choisies,
      auto-hébergées (aucun appel à un service tiers), sans dégrader le temps d'affichage.
- [x] **Étant donné** l'en-tête, **alors** un logo (SVG) remplace le texte « HIPMaster », et le site a sa propre
      icône d'onglet et d'écran d'accueil (voir US-063) : `public/favicon.ico` est aujourd'hui celui d'Angular par
      défaut.
- [x] **Étant donné** l'accueil, **quand** un visiteur arrive, **alors** il voit quelques cartes du set, la promesse
      du jeu en une phrase, et une action principale adaptée (« Créer mon compte » s'il a une invitation, « Jouer »
      sinon) ; « Projet en cours de construction » disparaît ; les chances par booster vont dans l'écran des
      boosters.
- [x] **Étant donné** un lien vers le jeu partagé dans une messagerie, **alors** l'aperçu affiche un titre, une
      description et une image (balises Open Graph).
- [x] **Étant donné** un téléphone de 375 × 667, **quand** un visiteur ouvre l'accueil, **alors** les cartes et
      l'appel à jouer tiennent dans le premier écran, et le plateau de partie tient toujours sans défilement.
- [x] **Étant donné** un invité qui suit son lien (`/compte?invitation=…`), **alors** la page l'accueille avec les
      cartes du jeu avant le formulaire.
- [x] **Étant donné** la préférence « réduire les animations », **alors** aucune des nouvelles animations n'est
      jouée.

## Décisions (ADR 0037)

- **Ambiance « nuit électrique »** : le bleu nuit et les halos des illustrations ; la coquille (bandeau, onglets)
  reste de nuit dans les deux thèmes.
- **Indigo électrique** pour l'interactif, **or** réservé à l'action principale d'un écran (l'énergie, comme le
  Débit), rose pour les pastilles.
- **Exo 2** pour les titres, boutons et chiffres, un fichier de 41 Ko servi par le site ; texte courant en police du
  système.
- **Accueil** : sur téléphone, les trois cartes en éventail d'abord (Apigee API Gateway, Solace Agent Mesh, FTP : du
  FTP aux agents d'IA), puis le nom du jeu, la promesse et « Jouer contre le bot » en or ; un visiteur voit
  « Comment on joue » en trois étapes, un joueur connecté retrouve ses duels, boosters et collection en tuiles ; les
  huit familles en puces. L'accueil accepte aussi `?invitation=` : l'action principale devient « Créer mon compte ».
- **Libellés** : « Jouer contre le bot » plutôt que « Jouer » (on sait qu'on peut jouer tout de suite, sans compte) ;
  « Découvrir les cartes » plutôt que « Voir le catalogue des cartes ». L'accroche garde le tutoiement de l'ancien
  accueil ; les écrans restent au vouvoiement.

- **Poids** : l'accueil enrichi faisait passer le bundle initial à 504 Ko (budget d'avertissement : 500 Ko) ; le
  plateau (partie et duel) et la page « Inviter » sont désormais chargés à la demande : 438 Ko (110 Ko transférés).

## Captures avant / après

- [Accueil sur téléphone](../../produit/captures/us-061-accueil-tel-avant-apres.jpg),
  [au bureau](../../produit/captures/us-061-accueil-bureau-avant-apres.jpg),
  [joueur connecté](../../produit/captures/us-061-accueil-connecte-avant-apres.jpg)
- [Arrivée d'un invité](../../produit/captures/us-061-invitation-tel-avant-apres.jpg)
- [Plateau sur téléphone](../../produit/captures/us-061-partie-tel-avant-apres.jpg) : il tient toujours dans 375 × 667.

## Notes

- S'appuyer sur la direction artistique d'US-016 (fond bleu nuit et halos du style « Sunlit Sketches ») pour que
  l'interface et les futures illustrations parlent la même langue.
- ADR-019 Elis (Figma) : pas de maquette cette nuit ; les captures avant et après de la PR en tiennent lieu.
- L'image d'aperçu des liens (`apercu-lien.jpg`) est tirée du rendu de l'accueil : à régénérer avec les
  illustrations définitives (US-017).

## Journal

- 2026-10-22 — création, issue de la revue du design avant mise en ligne.
- 2026-10-24 — affinée et commencée (session de nuit) : relevé de ce qui fait « application de gestion » sur toutes
  les pages, ADR 0037, charte graphique.
- 2026-10-24 — livrée : Identité « nuit électrique » (jetons, Exo 2, logo, icônes, Open Graph), accueil avec cartes en éventail et appel à jouer, arrivée des invités, chances par booster sur l'écran des boosters (ADR 0037).
