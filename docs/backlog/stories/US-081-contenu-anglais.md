# US-081 — Les cartes, les capacités, les fiches et la règle en anglais

- **Epic** : EPIC-14
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-081-contenu-anglais`

## Récit

En tant que **joueur anglophone**, je veux **lire les cartes, leurs capacités et leurs fiches « Learn more » en
anglais** afin d'**apprendre en jouant, comme les francophones**.

## Critères d'acceptation

- [ ] Le domaine porte les textes des 71 cartes, des capacités, des fiches « En savoir plus » et de la règle en
      français (référence) et en anglais ; un test vérifie qu'aucune carte ne manque de traduction.
- [ ] L'API sert la langue demandée (contrat OpenAPI d'abord), avec repli sur le français ; le cache HTTP du
      catalogue (US-057) distingue les langues.
- [ ] Les noms de produits ne se traduisent pas ; les liens externes des fiches pointent vers une ressource anglaise
      quand elle existe.
- [ ] Les textes alternatifs des illustrations existent dans les deux langues.

## Journal

- 2026-10-24 — création, à la demande du porteur du projet (EPIC-14).
