# EPIC-08 — Cartes proposées par la communauté IT

- **Statut** : En cours
- **Priorité** : Should

## Objectif

Faire du jeu un outil d'**acculturation IT** porté par plusieurs voix : les collègues architectes du porteur du projet
proposent leurs propres cartes (une technologie, un pattern, un incident vécu), avec un texte « En vrai » qui explique
ce que la carte représente dans le SI. Demande du porteur du projet, 2026-10-19.

**Affinage du 2026-10-27** (ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md)) : les contributeurs
sont des architectes à l'aise avec GitHub et avec un assistant IA. Plutôt qu'un formulaire et une file de relecture
dans le jeu, **une carte de la communauté est une pull request ouverte depuis un fork**. Le dépôt leur fournit le
matériel : un guide des règles de création, une consigne pour que leur IA écrive la carte, une autre pour qu'elle
dessine l'illustration. La relecture, l'équilibrage et la publication se font dans la PR ; la carte prend le numéro
suivant du catalogue et porte le nom de son auteur.

## Indicateur de réussite

- Au moins 5 contributeurs, en dehors du porteur du projet, ont une carte publiée dans le jeu.
- Une PR de carte reçoit une réponse (fusionnée, à retravailler, refusée) en moins de deux semaines.
- Une PR de carte produite avec le kit passe `npm run check` du premier coup dans la majorité des cas.
- Chaque carte publiée garde un texte « En vrai » relu, compréhensible par un non-spécialiste.

## Stories

- [x] US-027 — Guide du contributeur : les règles de création d'une carte
- [x] US-028 — Kit pour l'IA du contributeur : consignes de carte et d'illustration
- [ ] US-029 — Relire une carte proposée dans sa pull request
- [ ] US-030 — L'auteur d'une carte dans le catalogue, et une première carte de la communauté
- [ ] US-031 — Créditer les contributeurs dans le jeu

Ordre suggéré : US-027 (utile tout de suite, y compris pour des idées reçues par message ou en atelier), US-028 et
US-029 (le kit complet), puis US-030 avec un premier collègue pour éprouver le parcours, et US-031.

## Décisions prises

- **Identité et relecture** : aucun compte ni rôle dans le jeu ; le contributeur est l'auteur de la PR, le relecteur
  est le porteur du projet (`CODEOWNERS`). Pas d'ADR d'identité (ADR 0050).
- **Accès** : fork et PR, sans droit d'écriture sur le dépôt (ADR 0050).
- **Chemin vers le catalogue** : la PR elle-même, avec les tests d'invariants en CI (ADR 0011, 0050).
- **Sets** : pas de set à part ; numéros suivants du catalogue, distingués par le champ auteur (ADR 0050).
- **Confidentialité** : règle écrite dans le guide (US-027), vérifiée par le contributeur avant d'ouvrir la PR (le
  dépôt est public dès l'ouverture), puis par le relecteur (liste de contrôle d'US-029).

## Hors périmètre

- Formulaire de proposition et file de relecture dans le jeu (remplacés par les PR, ADR 0050).
- Droit d'écriture des contributeurs sur le dépôt.
- Nouvelle capacité de combat apportée par une PR de carte : elle fait l'objet de sa propre story.
- Votes publics sur les propositions et classements des contributeurs (EPIC-07, vie sociale, si besoin).
