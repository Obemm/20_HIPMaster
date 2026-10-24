# Charte graphique de l'interface

> Identité « nuit électrique » posée par US-061 ([ADR 0037](../decisions/0037-identite-visuelle-nuit-electrique.md)).
> Les illustrations des cartes ont leur propre document : [direction artistique](direction-artistique.md).

## Principes

1. **Un jeu, pas un formulaire** : on voit des cartes avant de lire, chaque écran a une action principale, en or.
2. **La nuit des illustrations** : bleu nuit, halos violet et cyan, trame de points ; la coquille (bandeau, logo,
   barre d'onglets) reste de nuit même en thème clair, comme le dos d'une carte.
3. **Une seule action en or par écran** ; le reste en indigo (liens, sélection) ou en contour.
4. **Lisible d'abord** : contrastes AA dans les deux thèmes, vérifiés par un test ; cibles d'au moins 44 px ; le texte
   courant reste dans la police du système.
5. **Du mouvement sobre** : court, jamais en boucle, et rien du tout si le système demande de réduire les animations.

## Couleurs (jetons de `apps/web/src/styles.css`)

Toute couleur d'interface est un jeton `--hip-*`, exposé à Tailwind (`bg-surface`, `text-texte-doux`…). Une nouvelle
couleur se déclare dans les deux thèmes et rejoint les paires vérifiées par `apps/web/contrastes.test.ts`.

| Jeton           | Clair     | Sombre    | Rôle                                                            |
| --------------- | --------- | --------- | --------------------------------------------------------------- |
| `fond`          | `#f3f4fb` | `#0b1029` | Fond de page (sous les halos et la trame)                       |
| `surface`       | `#ffffff` | `#151c3d` | Panneaux, tuiles, champs                                        |
| `surface-haute` | `#e9ebf8` | `#1f2852` | Puces, survol, zone en retrait                                  |
| `texte`         | `#151a36` | `#eef1ff` | Texte principal                                                 |
| `texte-doux`    | `#474f72` | `#b8c0e0` | Texte secondaire                                                |
| `bordure`       | `#d6daee` | `#2c3768` | Séparations décoratives                                         |
| `bordure-forte` | `#7a82aa` | `#6b76ad` | Contour des champs (3:1)                                        |
| `accent`        | `#4f46e5` | `#a5b4fc` | Liens, sélection, focus, bouton secondaire plein                |
| `sur-accent`    | `#ffffff` | `#0b1029` | Texte sur l'accent                                              |
| `action`        | `#fbbf24` | `#fbbf24` | L'action principale (bouton en or), la gemme de Débit           |
| `sur-action`    | `#1f1400` | `#1f1400` | Texte sur l'or                                                  |
| `or`            | `#b45309` | `#fbbf24` | Texte doré (grand titre seulement en clair)                     |
| `alerte`        | `#b91c1c` | `#fca5a5` | Erreurs                                                         |
| `succes`        | `#15803d` | `#86efac` | Réussites                                                       |
| Coquille        | —         | —         | Jetons du thème sombre, quel que soit le thème (`.coquille`)    |
| Pastille        | `#e11d48` | `#e11d48` | Compteur de notification d'un onglet, texte blanc               |
| Rareté          | —         | —         | `.cadre-commune` à `.cadre-legendaire` : cadre, fond, halo      |
| Famille         | —         | —         | Dégradés `ILLUSTRATIONS_FAMILLE` (`carte.ts`), toujours décrits |

## Typographie

- **Titres, boutons, chiffres, onglets** : Exo 2 (OFL), servie par le site (`public/polices/exo-2-latin.woff2`,
  41 Ko, préchargée) — classe `font-titre`, appliquée d'office aux `h1`, `h2`, `h3`.
- **Texte courant** : la police du système (`system-ui`), qui s'affiche sans attendre.

| Rôle                       | Classe              | Taille                          | Graisse |
| -------------------------- | ------------------- | ------------------------------- | ------- |
| Nom du jeu (accueil)       | `titre-hero`        | 3,25 → 5,5 rem selon l'écran    | 900     |
| Titre de page (`h1`)       | `titre-page`        | 1,875 → 2,625 rem selon l'écran | 800     |
| Surtitre (au-dessus du h1) | `surtitre`          | 0,8125 rem, capitales espacées  | 700     |
| Titre de section (`h2`)    | `text-2xl` ou `-lg` | 1,5 rem (1,125 dans un panneau) | 800     |
| Texte                      | —                   | 1 rem                           | 400     |
| Texte secondaire           | `text-sm`           | 0,875 rem                       | 400     |

## Formes et espacements

- Rayons : bouton `0.875rem`, panneau et tuile `1.25rem`, puce en pilule ; les cartes gardent leurs proportions
  (`cqw`, US-009).
- Pages : `px-4` sur téléphone, `px-6` au-delà ; largeur `max-w-6xl` pour les grilles de cartes, `max-w-3xl` pour
  les écrans de texte ; `gap-6` entre les blocs d'une page, `gap-12` entre les sections de l'accueil.
- Ombres : `--hip-ombre` (douce en clair, profonde en sombre, avec un filet de lumière en haut).

## Composants communs (classes de `styles.css`)

| Classe                                 | Usage                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `bouton bouton-jeu`                    | L'action principale de l'écran, en or et en relief ; `bouton-large` en vedette |
| `bouton bouton-plein`                  | Action secondaire affirmée (indigo)                                            |
| `bouton bouton-contour`                | Action secondaire, à côté d'une action en or                                   |
| `lien`                                 | Lien dans un texte (indigo, souligné)                                          |
| `panneau`                              | Bloc posé sur le fond : surface, bordure, ombre                                |
| `tuile` (+ `tuile-icone`, `-titre`)    | Raccourci vers un écran, avec son état (« 3 en stock »)                        |
| `puce`                                 | Étiquette ronde (famille, statut)                                              |
| `surtitre`, `titre-page`, `titre-hero` | Hiérarchie des titres                                                          |
| `etape`                                | Numéro d'étape                                                                 |
| `hip-dos-carte` (`.dos-carte`)         | Dos de carte : chargement, paquet                                              |
| `hip-eventail-cartes`                  | Trois cartes en éventail (accueil, arrivée d'un invité)                        |
| `gemme-debit`                          | Coût en Débit sur une carte                                                    |

Les composants Angular n'ont pas de styles propres : la CSP refuse les feuilles qu'ils injecteraient.

### Composants d'écran (US-068)

| Classe ou composant                                              | Usage                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `bouton-petit`                                                   | Bouton secondaire dans une liste ou une barre serrée (36 px de haut au moins)  |
| `bouton-danger`                                                  | Action qui détruit ou attaque : contour et texte rouge d'alerte                |
| `etiquette`, `champ`                                             | Libellé et champ de formulaire (texte, liste déroulante, date)                 |
| `choix`                                                          | Bouton radio présenté en tuile ; la tuile choisie prend l'anneau de l'accent   |
| `hip-boite-deck` (`.mini-eventail`)                              | Un deck en boîte de jeu : trois cartes phares, nom, description, bouton fourni |
| `statut` + `statut-a-jouer`, `-attente`, `-victoire`, `-defaite` | État en pastille, toujours un mot (« À vous », « Victoire »)                   |
| `avatar`                                                         | Initiale d'un joueur dans un rond (décorative)                                 |
| `jauge`                                                          | Progression (collection) : piste et remplissage doré                           |

## Gabarits d'écran

- **En-tête de page** : un `surtitre` (le contexte : « Entre joueurs », « Set 1 · De FTP aux agents »), le `h1` en
  `titre-page`, une phrase en `text-texte-doux` qui dit quoi faire.
- **Sections** : un `h2` en `text-xl font-extrabold` ; les blocs posés sur le fond sont des `panneau` (`p-4`).
- **Listes d'objets du jeu** (decks, duels, invitations) : des tuiles ou des panneaux, jamais des lignes de tableau ;
  l'état en `statut`, l'action à droite au bureau, en pleine largeur sur téléphone.
- **Filtres** : un panneau en grille (une colonne sur téléphone, deux ou trois au-delà), `etiquette` + `champ`.
- **États vides** : une phrase qui dit pourquoi et un lien vers l'action qui remplit (« ouvrez un booster ») ;
  **erreurs** : `hip-erreur-chargement` (la cause en mots de joueur, « Réessayer »).
- **Retour** : la barre d'onglets suffit ; un lien « ← … » seulement pour un écran sans onglet (« Inviter »).

## Icônes et images

- Icônes : `hip-icone` (grille 24 × 24, trait de 2, dessinées pour le projet), toujours accompagnées d'un texte.
- Logo : `public/logo.svg` (deux cartes en éventail, moyeu de connexions doré). Dérivés : `favicon.ico` (16, 32,
  48 px), `apple-touch-icon.png` (180 px, sur la nuit), `apercu-lien.jpg` (aperçu Open Graph 1200 × 630, tiré du
  rendu réel de l'éventail de l'accueil en thème sombre : à régénérer avec les illustrations définitives).

## Mouvement

Toutes les animations sont sous `@media (prefers-reduced-motion: no-preference)` :

- page qui s'ouvre : fondu de 200 ms (opacité seule : un `transform` sur `<main>` décalerait les éléments fixes) ;
- éventail de l'accueil : les cartes se déploient une fois (700 ms, décalées de 90 ms) ;
- bouton en relief : il s'enfonce de 3 px à l'appui ; tuile et carte cliquable : elles se soulèvent au survol ;
- révélation des cartes d'un booster (US-023).

## Accessibilité

- Contrastes : `apps/web/contrastes.test.ts` vérifie chaque paire de jetons dans les deux thèmes, les cartes de
  chaque rareté, la coquille et le texte posé sur les halos ; les parcours e2e passent l'audit axe (WCAG 2.2 AA).
- Focus : anneau de 3 px de la couleur d'accent, décollé de 3 px, sur tout élément interactif.
- Pas de dégradé derrière du texte (axe ne saurait plus mesurer le contraste) : le relief vient des ombres.
