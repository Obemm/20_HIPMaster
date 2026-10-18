# US-035 — Mes duels et « à vous de jouer »

- **Epic** : EPIC-06
- **Statut** : En revue
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-035-mes-duels`

## Récit

En tant que **joueur connecté**, je veux **voir mes duels et savoir lesquels attendent mon tour** afin de **ne pas
faire attendre mes adversaires**.

## Critères d'acceptation

- [x] Une page « Mes duels » liste les duels à mon tour (en premier), au tour de l'adversaire, en attente
      d'adversaire et terminés, avec l'adversaire, le tour et l'heure du dernier coup (« il y a 3 min ») ; le
      temps restant avant l'échéance s'ajoutera avec le forfait (US-036).
- [x] Le bandeau affiche un compteur « à vous de jouer » (mis à jour à la navigation et toutes les minutes).
- [x] Le titre de l'onglet le reprend (« (2) HIPMaster ») pour le voir depuis un autre onglet.
- [x] `GET /moi/duels` (contrat OpenAPI) ; tests de l'API et de l'écran ; audit axe-core au vert.

## Notes

- Une notification poussée (Server-Sent Events, courriel) reste une amélioration possible (ADR 0020).

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
- 2026-10-19 — `GET /moi/duels` (contrat dans `duels.yaml`) : les duels du joueur triés par groupe (à mon tour, au
  tour de l'adversaire, en attente, puis les 20 derniers terminés), le plus récent d'abord ; seuls le joueur actif,
  le tour et le gagnant sont lus dans l'état (extraction JSON en base). Front : `MesDuelsService` (mis à jour à la
  connexion, à chaque navigation et toutes les minutes), page `/duels`, lien « Duels » avec compteur dans le
  bandeau (« 1 à vous de jouer » pour les lecteurs d'écran) et titre d'onglet « (n) … » par une `TitleStrategy`.
  Piège évité : le service n'injecte pas le routeur (dépendance circulaire avec la stratégie de titre), c'est le
  bandeau qui écoute les navigations. Tests : API (3), écran et titre (2), e2e (3, à deux navigateurs, axe en clair
  et en sombre).
