# US-035 — Mes duels et « à vous de jouer »

- **Epic** : EPIC-06
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-035-mes-duels`

## Récit

En tant que **joueur connecté**, je veux **voir mes duels et savoir lesquels attendent mon tour** afin de **ne pas
faire attendre mes adversaires**.

## Critères d'acceptation

- [ ] Une page « Mes duels » liste les duels à mon tour (en premier), au tour de l'adversaire, en attente
      d'adversaire et terminés, avec l'adversaire, le tour et le temps restant avant l'échéance.
- [ ] Le bandeau affiche un compteur « à vous de jouer » (mis à jour à la navigation et toutes les minutes).
- [ ] Le titre de l'onglet le reprend (« (2) HIPMaster ») pour le voir depuis un autre onglet.
- [ ] `GET /moi/duels` (contrat OpenAPI) ; tests de l'API et de l'écran ; audit axe-core au vert.

## Notes

- Une notification poussée (Server-Sent Events, courriel) reste une amélioration possible (ADR 0020).

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
