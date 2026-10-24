# EPIC-10 — Identité visuelle et confort sur téléphone

- **Statut** : En cours
- **Priorité** : Should

## Objectif

Donner au jeu une identité visuelle et une ergonomie de vrai jeu mobile avant d'y inviter des collègues. Aujourd'hui,
le jeu fonctionne mais ressemble à un prototype : interface en niveaux de gris, accueil sans carte, plateau de
partie qui ne tient pas dans un écran de téléphone, navigation par petits liens (revue du design du 2026-10-22, voir
la [revue avant mise en ligne](../../revues/2026-10-22-revue-mise-en-ligne.md)).

## Indicateur de réussite

- Sur un téléphone de 375 × 667 px, une partie entière se joue sans faire défiler la page.
- Un collègue qui découvre l'accueil comprend en 5 secondes qu'il s'agit d'un jeu de cartes sur l'intégration.
- Aucune régression d'accessibilité (audit axe des parcours e2e, contrastes AA dans les deux thèmes).

## Stories

- [x] US-059 — Un plateau de partie qui tient dans un écran de téléphone
- [x] US-060 — Une navigation pensée pour le téléphone
- [x] US-061 — Une identité visuelle et un accueil qui donnent envie
- [x] US-062 — Ouvrir un booster, un vrai moment
- [ ] US-063 — Installer le jeu sur son téléphone (PWA)
- [x] US-068 — Une revue visuelle de tout le site

Ordre suggéré : US-059 et US-060 avant d'envoyer les invitations (EPIC-09, lot 2), puis US-061, US-063 et US-062.

## Hors périmètre

- Les illustrations définitives des 71 cartes (EPIC-05, US-016 et US-017).
- Les animations de combat.
