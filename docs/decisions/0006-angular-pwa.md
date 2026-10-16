# 0006 — Angular pour le front, livré en PWA

- **Date** : 2026-10-16
- **Statut** : Acceptée
- **Référence Elis** : ADR-005 (Angular pour les front-ends web), ADR-016 v1 (PWA pour une application mobile externe)
- **Remplace** : [0001](0001-nextjs-tailwind.md)

## Contexte

L'ADR 0001 avait retenu Next.js (React). Le référentiel Elis ([0005](0005-referentiel-adr-elis.md)) recommande
**Angular** pour tout nouveau front-end web et **écarte React** ; pour une application mobile destinée au grand public,
il recommande une **PWA** plutôt qu'une application native.

## Décision

- **Angular 22** : composants autonomes (standalone), signals, détection de changement sans zone.js, Angular CLI
  (`@angular/build`), tests unitaires Vitest intégrés au CLI.
- Application monopage (pas de SSR : un jeu n'a pas besoin de référencement page par page) ; rendue installable
  en **PWA** (manifeste + service worker) dans une story dédiée.
- **Tailwind CSS 4** pour les styles (Elis ne prescrit pas de framework CSS).
- Code dans `apps/web/`.

## Alternatives envisagées

- **Garder Next.js en dérogation** (exception « forte performance » d'ADR-005) : écarté, rien ne le justifie au démarrage.
- **Application native Android/iOS** : ADR-016 la réserve aux applications internes avec lecteurs ou hors ligne.

## Conséquences

- Le front ne contient **aucune règle de jeu** : il affiche et appelle l'API ([0007](0007-api-rest-monorepo.md)).
- Écosystème Angular : RxJS disponible, mais les signals sont préférés pour l'état d'interface.
- Mise à jour d'Angular au moins tous les six mois (bonne pratique, proposée côté Elis sans être encore décidée).
