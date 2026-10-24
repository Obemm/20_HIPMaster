# 0037 — Identité visuelle « nuit électrique » : jetons de marque, police auto-hébergée, coquille de nuit

- **Date** : 2026-10-24
- **Statut** : Proposée (choix pris de nuit, sans le porteur du projet : à valider à la relecture de la PR d'US-061)
- **Référence Elis** : ADR-019 (Figma pour le design d'interface et le design system) — adapté, comme pour
  l'ADR 0012 : pas de maquette Figma, la charte vit dans le code (jetons et classes communes) et dans
  [la charte graphique](../produit/charte-graphique.md) ; « Design System Usage » (à l'état de brouillon au
  référentiel) ne s'applique pas encore.

## Contexte

La revue du 2026-10-22 et le porteur du projet le disent : le site « fait application de gestion ». Interface en
niveaux de gris (l'accent était la couleur du texte), police du système, aucun logo, icône d'onglet d'Angular,
accueil sans une seule carte, chances par booster en tableau. Seules les cartes avaient de la couleur. Le porteur
demande « un vrai site de jeu en ligne, avec un design attrayant ».

Contraintes : CSP stricte de `firebase.json` (ni style ni script en ligne, ressources servies par le site, aucun
CDN), contrastes AA dans les deux thèmes (ADR 0012), pensé d'abord pour le téléphone (le plateau tient dans
375 × 667), budget de poids d'un hébergement gratuit, illustrations encore provisoires (fond bleu nuit et halos,
ADR 0016).

## Décision

1. **Une ambiance « nuit électrique »**, celle des illustrations : bleu nuit (`#0b1029`), deux halos (violet en haut
   de la page, cyan en bas) et une trame de points discrète. Le thème clair reste (ADR 0012) : fond lavande pâle,
   mêmes halos atténués, surfaces blanches.
2. **La coquille du jeu reste de nuit dans les deux thèmes** : bandeau, logo et barre d'onglets, comme le dos d'une
   carte. Ses jetons sont redéfinis sur `.coquille` ; la barre du navigateur prend sa couleur (`theme-color`).
3. **Deux couleurs de marque, chacune à son rôle** :
   - l'**indigo électrique** (`--hip-accent` : `#4f46e5` en clair, `#a5b4fc` en sombre) pour les liens, la sélection
     et le focus ;
   - l'**or** de l'énergie, comme le Débit (`--hip-action` `#fbbf24`, texte `#1f1400`), réservé à **l'action
     principale d'un écran** (« Jouer contre le bot », « Ouvrir un booster »…), en bouton en relief ; un or foncé
     (`--hip-or` `#b45309`) pour le texte doré sur fond clair ;
   - le rose `#e11d48` pour les pastilles de notification ; les cadres de rareté gardent leurs teintes (US-009).
4. **Une police de titres auto-hébergée : Exo 2** (licence OFL), un seul fichier variable (graisses 100 à 900) réduit
   aux caractères latins, français compris, 41 Ko, servi depuis `public/polices` et préchargé. Elle sert aux titres,
   aux boutons, aux chiffres des cartes et aux onglets au bureau ; le texte courant garde la police du système.
5. **Des composants communs en classes CSS globales** (`bouton`, `bouton-jeu`, `bouton-plein`, `bouton-contour`,
   `panneau`, `tuile`, `puce`, `titre-page`, `surtitre`, `lien`, `dos-carte`, `gemme-debit`) dans `styles.css` : la
   CSP interdit les feuilles de style que les composants Angular injectent dans la page.
6. **Un logo SVG** : deux cartes en éventail, la face porte un moyeu de connexions doré (l'intégration). Il sert de
   favicon (SVG, et ICO 16/32/48 pour les navigateurs qui l'exigent), d'icône d'écran d'accueil (180 px) et d'image
   d'aperçu des liens partagés (Open Graph, 1200 × 630 en JPEG, tirée du rendu réel de l'accueil).
7. **Des micro-animations sobres**, toutes sous `prefers-reduced-motion: no-preference` : fondu d'entrée de page
   (200 ms, opacité seule pour ne pas décaler les éléments fixes de la partie), éventail de l'accueil qui se déploie,
   bouton qui s'enfonce, tuile qui se soulève.
8. **Les contrastes sont vérifiés par un test** (`apps/web/contrastes.test.ts`), y compris sur les halos : axe ne
   mesure pas le texte posé sur un dégradé. Pour la même raison, boutons et cadres de carte prennent leur relief
   d'ombres, jamais d'un dégradé derrière du texte.

## Alternatives envisagées

- **Thème sombre seul** (WikiMasters, la plupart des jeux) : plus spectaculaire, mais l'ADR 0012 garde le choix du
  système ; la coquille de nuit donne l'identité sans imposer le sombre aux pages.
- **Une police ronde de jeu mobile** (Lilita One, Baloo 2, Fredoka) : très « jeu », mais enfantine pour un outil
  d'acculturation et moins lisible en petit ; **Oxanium** (techno, 16 Ko) : proche, plus froide. Exo 2 tient les deux
  registres, technique et jeu.
- **La police par un paquet npm** (`@fontsource`) : provenance suivie par les dépendances, mais l'import passe par la
  chaîne Tailwind puis esbuild et copie toutes les variantes ; un fichier commité, sa licence à côté, est plus simple.
- **Une bibliothèque de composants** (Angular Material…) : du poids, et justement l'allure d'une application de
  gestion.
- **Une maquette Figma d'abord** (ADR-019 Elis) : impossible cette nuit ; les captures avant et après jointes aux PR
  en tiennent lieu, et une maquette reste possible pour les évolutions.
- **Des dégradés sur les boutons et les cadres** : plus brillants, mais axe ne vérifierait plus le contraste du texte
  posé dessus.

## Conséquences

- Nouveaux jetons (`surface-haute`, `bordure-forte`, `action`, `sur-action`, `or`, `succes`, halos, trame, ombre) :
  toute couleur d'interface reste un jeton, dans les deux thèmes, et passe le test de contraste.
- 41 Ko de police au premier chargement (préchargés, puis en cache) ; le logo et les icônes pèsent moins de 20 Ko.
- Pour rester sous le budget de 500 Ko du bundle initial (504 Ko avec l'accueil enrichi), le plateau de partie,
  le duel et la page « Inviter » sont chargés à la demande : 438 Ko au premier chargement (110 Ko transférés).
- Les écrans adoptent les classes communes au fil d'US-068 ; la charte graphique les décrit.
- L'audit axe classe « incomplet » le contraste du texte posé directement sur le décor : le test des jetons le couvre.
- L'image d'aperçu montre de vraies cartes : à régénérer quand les illustrations définitives arriveront (US-017).
