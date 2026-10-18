# 0016 — Illustrations provisoires vectorielles, générées par le code

- **Date** : 2026-10-18
- **Statut** : Acceptée
- **Référence Elis** : aucune (le référentiel ne couvre pas la production d'images) ; ADR-033 (usage des assistants
  d'IA) respecté : le code est écrit par Claude et relu, aucune donnée d'entreprise n'est utilisée

## Contexte

L'essai d'US-016 a montré que Recraft produit de belles images avec un style personnalisé, mais l'offre gratuite
laisse la **propriété des images à Recraft**, et ses crédits ne suffisent pas pour 71 cartes. Le porteur du projet ne
tranche pas l'offre tout de suite et demande, pour le moment, des images simples. Les cartes doivent pourtant être
reconnaissables dès maintenant (catalogue, futurs boosters et combat).

## Décision

- Un **générateur vectoriel** dans `packages/illustrations/src/vectoriel/` dessine chaque carte en SVG à partir de ses
  données (famille, type, rareté, numéro), selon la [direction artistique](../produit/direction-artistique.md) : un
  emblème par famille, un motif par type, une intensité par rareté, des variations tirées du numéro.
- Le SVG est rendu en PNG 4:3 par `sharp`, puis passe par la chaîne d'US-015 ([ADR 0015](0015-illustrations-statiques-optimisees.md)).
- Le **générateur fait foi** : les images se refont à l'identique à la demande, il n'y a pas d'original à archiver.
- Les illustrations produites sont **versionnées** ; elles seront remplacées carte par carte quand un générateur
  d'images sera retenu (US-016, US-017).

## Alternatives envisagées

- **Garder les pictogrammes de famille d'US-009** : 71 cartes en 8 visuels seulement, impossible de les distinguer.
- **Utiliser les images de l'essai Recraft** : interdit sans offre payante (propriété de Recraft).
- **Bibliothèques d'illustrations libres** (unDraw, Open Peeps…) : style étranger à l'univers et sans lien avec chaque
  carte.

## Conséquences

- Un style géométrique et sobre, cohérent sur tout le set, sans coût ni question de licence.
- Moins expressif qu'une vraie illustration : c'est un **provisoire assumé**.
- Le générateur est testé comme du code : déterministe, sans texte dans l'image, une image par carte.
