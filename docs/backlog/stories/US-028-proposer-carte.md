# US-028 — Proposer une carte depuis le jeu

- **Epic** : EPIC-08
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-028-proposer-carte`

## Récit

En tant que **tech lead ou architecte connecté**, je veux **proposer une carte depuis le jeu** afin de **partager ce
que je connais du SI sous une forme ludique**.

## Critères d'acceptation

- [ ] Un ADR tranche l'**identité des contributeurs** (compte invité ou identité vérifiée) et le stockage des
      propositions.
- [ ] Un formulaire reprend le gabarit du guide (US-027) ; un **aperçu** montre la carte telle qu'elle serait
      affichée (composant de carte existant), avec un avertissement si les statistiques sortent des ordres de
      grandeur de sa rareté.
- [ ] **Étant donné** un formulaire valide, **quand** je l'envoie, **alors** la proposition est enregistrée avec le
      statut « proposée », et je la retrouve dans « Mes propositions » avec son statut et les commentaires reçus.
- [ ] Je peux modifier une proposition tant qu'elle n'est pas acceptée, ou la retirer.
- [ ] Une case à cocher confirme que la carte ne contient rien de confidentiel (règles d'US-027).
- [ ] Contrat OpenAPI avant le code ; tests de l'API et de l'écran ; parcours e2e et audit axe-core au vert.

## Notes

- Les propositions sont des données de joueurs (base), pas le catalogue : celui-ci reste du code (ADR 0011).
- Limite de propositions ouvertes par auteur (ex. 5) pour garder la relecture tenable.

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard).
