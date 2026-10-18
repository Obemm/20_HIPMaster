# US-024 — Ma collection

- **Epic** : EPIC-03
- **Statut** : En revue
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-024-ma-collection`

## Récit

En tant que **joueur connecté**, je veux **voir les cartes que je possède et celles qui me manquent** afin de
**suivre ma progression dans le set**.

## Critères d'acceptation

- [x] La page collection affiche la **progression du set** (ex. « 37 / 71 ») et, par rareté, le nombre de cartes
      obtenues.
- [x] Chaque carte possédée montre son nombre d'exemplaires (doubles) ; les cartes manquantes restent visibles,
      grisées, avec leur nom, pour donner envie.
- [x] Les filtres du catalogue (famille, rareté) s'appliquent, plus un filtre « possédées / manquantes ».
- [x] Le détail d'une carte (US-009) indique le nombre d'exemplaires possédés.
- [x] Tests de l'API et de l'écran ; parcours e2e et audit axe-core au vert.

## Journal

- 2026-10-18 — création.
- 2026-10-18 — contrat `openapi/collection.yaml` et route `GET /moi/collection` (cartes possédées et exemplaires).
  Front : `CollectionService` (chargée à la connexion, rechargée après chaque booster), page « Ma collection »
  (progression du set et par rareté, barre de progression, doubles « × n », manquantes grisées, filtres possession,
  famille et rareté), détail en fenêtre modale au-dessus de la collection (`/collection/:numero`, donnée de route
  `retour`) qui indique les exemplaires possédés ; lien « Collection » dans le bandeau. Tests : API (collection),
  écran (3), détail (2 de plus), e2e (3, axe en clair et en sombre compris).
