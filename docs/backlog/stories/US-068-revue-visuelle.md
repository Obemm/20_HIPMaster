# US-068 — Une revue visuelle de tout le site

- **Epic** : EPIC-10
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-068-revue-visuelle`

## Récit

En tant que **porteur du projet**, je veux **une revue visuelle de toutes les pages du site en ligne** afin
d'**obtenir un ensemble cohérent et soigné, au-delà de l'accueil et du plateau**.

## Critères d'acceptation

- [x] **Étant donné** chaque écran (accueil, catalogue, détail de carte, compte, boosters, collection, duels, partie),
      **alors** une capture en 375 px et en bureau, dans les deux thèmes, est relevée avec ses défauts visuels
      (alignements, espacements, hiérarchie des titres, couleurs, états vides et d'erreur).
- [x] **Étant donné** ce relevé, **alors** les corrections sont classées et découpées en stories, ou faites ici si
      elles sont petites.
- [x] Les règles retenues (espacements, tailles, composants communs) sont écrites dans une page de charte.
- [x] **Étant donné** les parcours e2e, **alors** ils passent tous, audit axe compris, et le plateau tient toujours
      dans 375 × 667.

## Relevé (2026-10-24, après l'identité d'US-061)

Captures de 16 écrans, téléphone (375 × 667) et bureau (1280 × 800), clair et sombre : 64 captures avant, 64 après
(script de capture Playwright, sans fenêtre ; planches dans `docs/produit/captures/us-068-*`).

| Écran                   | Défauts relevés                                                                                   | Correction                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Jouer                   | Un mur de règles avant de pouvoir choisir ; decks en boîtes de texte ; « Jouer avec » en indigo   | Difficulté en tuiles, decks en boîtes de jeu (cartes phares), « Jouer avec » en or, règle repliable |
| Mes duels               | Liste de boîtes grises, état du duel noyé dans le texte                                           | Cartes de duel : initiale de l'adversaire, pastille d'état (À vous, Son tour, Victoire…), bord doré |
| Défier / au hasard      | Lien « ← Jouer », decks en texte                                                                  | Surtitre, decks en boîtes de jeu, action en or                                                      |
| Défi reçu, file         | Lien « ← Jouer », champ et boutons au style de formulaire                                         | Titre de page, champ commun, « Copier le lien » et « Relever le défi » en or                        |
| Plateau (partie, duel)  | « Finir mon tour » de la même couleur que le reste ; SI adverse sur le fond ; fin de partie terne | « Finir mon tour » en or ; SI sur une surface ; « Victoire ! » en or, suite logique en or           |
| Boosters                | Une phrase et un bouton                                                                           | Surtitre, « Ouvrir un booster » en or ; le paquet et la révélation viennent avec US-062             |
| Collection              | Barre de progression fine, tuiles grises, filtres de formulaire, « Manquante » en texte gris      | Panneau de progression, jauge dorée, raretés en cadres de carte, filtres en panneau, pastilles      |
| Catalogue               | Titre et description en guillemets, filtres de formulaire                                         | Surtitre, consigne (« touchez une carte »), filtres en panneau                                      |
| Détail d'une carte      | Statistiques en boîtes grises                                                                     | Chiffres en Exo 2 sur fond en retrait, « En vrai » en panneau, « En savoir plus » en bouton commun  |
| Mon compte              | Lien « ← Accueil » (retiré ailleurs par US-060), sections nues, sept styles de boutons            | Sections en panneaux, champs communs, or pour « Créer mon compte » et « C'est noté », rouge à part  |
| Confidentialité         | Lien « ← Accueil », longue page sans repères                                                      | Surtitre, sections en panneaux                                                                      |
| Inviter                 | Formulaire et liste au style d'administration                                                     | Panneaux, champs communs, statut en pastille, « Créer l'invitation » en or                          |
| Pied de page            | Un lien seul                                                                                      | Logo et signature du jeu, lien                                                                      |
| États vides et d'erreur | « Réessayer » au style ancien                                                                     | Bouton commun ; messages inchangés (US-055)                                                         |

Rien n'est assez gros pour une story à part : tout est fait ici, sauf l'ouverture de booster mise en scène (US-062)
et l'installation sur téléphone (US-063), déjà prévues.

## Captures avant / après

- Téléphone : [Jouer et Mes duels](../../produit/captures/us-068-jouer-duels-tel-avant-apres.jpg),
  [Collection et Mon compte](../../produit/captures/us-068-collection-compte-tel-avant-apres.jpg),
  [Défier, plateau et boosters](../../produit/captures/us-068-defi-plateau-tel-avant-apres.jpg)
- Bureau : [Catalogue et détail](../../produit/captures/us-068-bureau-avant-apres.jpg),
  [Inviter et confidentialité](../../produit/captures/us-068-bureau-2-avant-apres.jpg)

## Décisions

- **Une seule action en or par écran** : « Jouer avec… », « Défier avec… », « Relever le défi… », « Finir mon
  tour », « Ouvrir un booster », « Créer mon compte », « Créer l'invitation ». Les actions secondaires sont en
  contour ou en indigo plein, la suppression du compte et l'attaque en rouge.
- **Un deck se présente comme une boîte de jeu** : ses trois cartes phares (les plus rares, puis les plus chères,
  d'après le catalogue) en mini-éventail, son nom, sa description. Le catalogue (21 Ko) est donc lu sur « Jouer »,
  « Défier » et quand on relève un défi.
- **La règle en bref est repliée** sur « Jouer » : l'aide « Comment jouer ? » s'ouvre d'elle-même à la première
  partie (US-059), et le choix du deck passe en premier.
- Les liens « ← Accueil » de « Mon compte » et de la confidentialité disparaissent, comme ailleurs depuis US-060 ;
  « ← Mon compte » reste sur « Inviter », qui n'a pas d'onglet.
- Les listes déroulantes gardent leur flèche du système : une flèche en image de fond empêcherait axe de mesurer le
  contraste de leur texte.

## Notes

- Demande du porteur du projet (2026-10-23), à faire après l'identité visuelle (US-061) pour partir de la nouvelle
  charte.
- Charte : [charte graphique](../../produit/charte-graphique.md), complétée des composants d'écran.

## Journal

- 2026-10-23 — création, notée pour plus tard à la demande du porteur du projet.
- 2026-10-24 — affinée et commencée (session de nuit) : relevé des 16 écrans, corrections, charte complétée.
- 2026-10-24 — livrée : Relevé visuel des 16 écrans (téléphone et bureau, deux thèmes) et corrections : decks en boîtes de jeu, duels en cartes à pastille d'état, actions principales en or, panneaux, champs et jauge communs, charte complétée.
