# EPIC-08 — Cartes proposées par la communauté IT

- **Statut** : À affiner
- **Priorité** : Should

## Objectif

Faire du jeu un outil d'**acculturation IT** porté par plusieurs voix : des tech leads et des architectes proposent
leurs propres cartes (une technologie, un pattern, un incident vécu), avec un texte « En vrai » qui explique ce que
la carte représente dans le SI. Les propositions sont relues, équilibrées puis intégrées au catalogue, et leur auteur
est crédité. Demande du porteur du projet, 2026-10-19 (à traiter plus tard).

## Indicateur de réussite

- Au moins 5 contributeurs, en dehors du porteur du projet, ont une carte publiée dans le jeu.
- Une proposition reçoit une réponse (acceptée, à retravailler, refusée) en moins de deux semaines.
- Chaque carte publiée garde un texte « En vrai » relu, compréhensible par un non-spécialiste.

## Stories

- [ ] US-027 — Guide du contributeur : comment concevoir une bonne carte
- [ ] US-028 — Proposer une carte depuis le jeu
- [ ] US-029 — Relire et instruire les propositions
- [ ] US-030 — Intégrer une carte acceptée au catalogue
- [ ] US-031 — Créditer les contributeurs

Ordre suggéré : US-027 d'abord (rien à coder, utile tout de suite pour recueillir des idées par message ou en
atelier), puis US-028 à US-031.

## Questions à trancher (ADR à prévoir)

- **Identité des contributeurs** : le compte invité (ADR 0017) suffit-il, ou faut-il une identité vérifiée (OIDC,
  piste déjà ouverte par l'ADR 0017 ; ADR-010 Elis : Okta) pour créditer et joindre un auteur ?
- **Rôle de relecteur** : qui l'accorde, et comment (liste en configuration, rôle en base, groupe d'annuaire) ?
- **Chemin vers le catalogue** : le catalogue est du code versionné (ADR 0011) ; une carte acceptée doit donc passer
  par une PR, avec ses tests d'invariants et une simulation d'équilibrage. Faut-il générer cette PR, ou la faire à
  la main à partir d'un export ?
- **Confidentialité** : une carte ne doit révéler ni nom de serveur, ni adresse, ni client, ni faille non corrigée ;
  qui le vérifie, et avec quelle liste de contrôle ?
- **Sets** : les cartes de la communauté complètent-elles le set 1 ou forment-elles un set 2 « communautaire » ?

## Hors périmètre

- Création d'illustrations par les contributeurs (EPIC-05 garde la direction artistique).
- Votes publics sur les propositions et classements des contributeurs (EPIC-07, vie sociale, si besoin).
- Édition directe du catalogue sans relecture.
