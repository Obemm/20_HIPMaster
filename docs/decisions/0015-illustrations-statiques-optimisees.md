# 0015 — Illustrations des cartes : fichiers statiques optimisés, originaux hors du dépôt

- **Date** : 2026-10-18
- **Statut** : Acceptée
- **Référence Elis** : ADR-012 (Azure Storage Account pour stocker les fichiers, jamais en base) — retenu pour la mise
  en ligne, adapté en développement ; ADR-030 (Azure seul cloud public), déjà traduit par l'ADR
  [0008](0008-hebergement-azure.md)

## Contexte

EPIC-05 donne une illustration à chacune des 71 cartes du set 1, avec une cible : des images optimisées en WebP ou
AVIF, de moins de 100 Ko, avec un texte alternatif. Les originaux produits par un générateur (Recraft ou autre) pèsent
plusieurs mégaoctets chacun ; la carte s'affiche à environ 170 px de large dans la grille d'un téléphone, et jusqu'à
300 px environ dans le détail.

## Décision

- **Originaux** : un PNG par carte, au format **4:3**, déposé dans `packages/illustrations/sources/set-1/<numero>.png`.
  Ce dossier est **ignoré par Git** : 71 originaux de plusieurs mégaoctets alourdiraient le dépôt pour toujours.
- **Déclinaisons** : le script `npm run illustrations` (paquet `@hipmaster/illustrations`, avec `sharp`) produit pour
  chaque carte **deux largeurs (320 et 640 px) × deux formats (AVIF et WebP)** dans
  `apps/web/public/cartes/set-1/`. Ces fichiers sont **versionnés** : ce sont eux que le jeu sert. Un test refuse tout
  fichier de 100 Ko ou plus.
- **Métadonnées** : `packages/illustrations/set-1.json` décrit chaque illustration : numéro de carte, texte
  alternatif, consigne de génération (_prompt_) et provenance (outil, date). Le script en tire un manifeste typé,
  `apps/web/src/app/cartes/illustrations.generated.ts`, que le front importe : il sait sans requête quelles cartes ont
  une image.
- **Affichage** : un élément `<picture>` (AVIF puis WebP, `srcset` sur les deux largeurs, dimensions fixées, chargement
  paresseux). Une carte sans illustration garde son fond et son pictogramme de famille (US-009).
- **Mise en ligne** (ADR 0008) : les déclinaisons partent dans un **Azure Storage Account** derrière un CDN, et les
  originaux y sont archivés dans un conteneur privé. D'ici là, les originaux restent sur le poste du porteur du projet
  et dans l'historique du générateur.

## Alternatives envisagées

- **Originaux dans Git** (ou Git LFS) : simple à restaurer, mais environ 150 Mo d'historique ajoutés au dépôt, et
  LFS demande un quota GitHub.
- **Optimisation à la volée** (Angular `NgOptimizedImage` avec un service d'images, ou un CDN qui redimensionne) :
  dépend d'un service en ligne qui n'existe pas encore.
- **Une seule taille en WebP** : plus simple, mais l'image est floue dans le détail sur un écran haute densité, ou
  trop lourde dans la grille.
- **Images en base** : écarté par ADR-012 Elis.

## Conséquences

- Le jeu n'appelle aucun service d'images : tout est statique, servi par le front.
- Régénérer les déclinaisons demande les originaux : il faut les archiver avant de changer de poste.
- Le paquet `@hipmaster/illustrations` ne dépend ni d'Angular ni de l'API ; le domaine du jeu n'est pas touché.
