# US-019 — Effets propres des composants

- **Epic** : EPIC-04
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-019-effets-composants`

## Récit

En tant que **joueur**, je veux **que les composants à effet fassent ce que dit leur carte** afin de **jouer Cron,
Designer ou CDC comme de vrais rouages de la plateforme**.

## Critères d'acceptation

- [ ] Les effets « quand il est posé » sont appliqués : webMethods Designer, Apigee API Hub, OpenAPI, Solace Event
      Portal, CDC, AsyncAPI.
- [ ] Les effets permanents sont appliqués : Cron (un composant Batch peut attaquer deux tours de suite), Base
      vectorielle (vos agents ont +1 PV).
- [ ] Un effet qui demande un choix (OpenAPI, AsyncAPI) se joue avec sa cible ; un effet de pioche ciblée (Designer,
      API Hub, Event Portal) prend la première carte de la famille voulue dans la pioche, sinon rien.
- [ ] Ces 8 cartes rejoignent `CARTES_PRISES_EN_CHARGE` ; chaque effet a son test.

## Notes

- Issue du découpage d'[US-014](US-014-effets-cartes.md) le 2026-10-18.

## Journal

- 2026-10-18 — création (découpage d'US-014).
