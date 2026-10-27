# US-031 — Créditer les contributeurs dans le jeu

- **Epic** : EPIC-08
- **Statut** : À affiner
- **Priorité** : Could
- **Taille** : S
- **Branche** : `us-031-crediter-contributeurs`

## Récit

En tant que **contributeur**, je veux **voir mon nom sur les cartes que j'ai proposées** afin d'**être reconnu et
d'avoir envie d'en proposer d'autres**.

## Critères d'acceptation

- [ ] Le détail d'une carte qui a un auteur (US-030) affiche « Proposée par … » ; le texte est traduit (ADR 0042).
- [ ] Le catalogue peut se filtrer sur les cartes de la communauté.
- [ ] Une page « Contributeurs » liste les auteurs et leurs cartes publiées.
- [ ] Tests de l'écran ; parcours e2e et audit axe-core au vert.

## Notes

- Le nom affiché vient de la PR (choisi par l'auteur) : il n'est lié à aucun compte du jeu (ADR 0050). Le plan
  initial offrait un exemplaire de la carte dans la collection de l'auteur : écarté, faute de lien entre l'auteur et
  un compte.

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard).
- 2026-10-27 — affinage (ADR 0050) : crédit tiré du champ auteur du catalogue.
