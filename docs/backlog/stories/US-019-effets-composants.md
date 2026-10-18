# US-019 — Effets propres des composants

- **Epic** : EPIC-04
- **Statut** : En revue
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-019-effets-composants`

## Récit

En tant que **joueur**, je veux **que les composants à effet fassent ce que dit leur carte** afin de **jouer Cron,
Designer ou CDC comme de vrais rouages de la plateforme**.

## Critères d'acceptation

- [x] Les effets « quand il est posé » sont appliqués : webMethods Designer, Apigee API Hub, OpenAPI, Solace Event
      Portal, CDC, AsyncAPI.
- [x] Les effets permanents sont appliqués : Cron (un composant Batch peut attaquer deux tours de suite), Base
      vectorielle (vos agents ont +1 PV).
- [x] Un effet qui demande un choix (OpenAPI, AsyncAPI) se joue avec sa cible ; un effet de pioche ciblée (Designer,
      API Hub, Event Portal) prend la première carte de la famille voulue dans la pioche, sinon rien.
- [x] Ces 8 cartes rejoignent `CARTES_PRISES_EN_CHARGE` ; chaque effet a son test.

## Notes

- Issue du découpage d'[US-014](US-014-effets-cartes.md) le 2026-10-18.
- `poser` accepte une `cible` facultative (le composant renforcé par OpenAPI ou AsyncAPI) : l'action reste explicite
  (ADR 0013). L'API normalise l'absence de cible pour le domaine.
- Le moteur joue désormais **63 cartes sur 71** ; les 8 restantes sont celles d'[US-020](US-020-capacites-ia.md).

## Journal

- 2026-10-18 — création (découpage d'US-014).
- 2026-10-18 — `effets-composants.ts` (pioche ciblée, renfort, CDC, Base vectorielle), règle Cron dans les outils du
  moteur ; `poser` avec cible ; API (schéma et contrat) et écran (« Poser et renforcer … ») ; 11 tests du domaine,
  1 test de l'écran ; précisions dans regles.md. En revue.
