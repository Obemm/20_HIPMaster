# US-020 — Capacités IA et Migration

- **Epic** : EPIC-04
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-020-capacites-ia`

## Récit

En tant que **joueur**, je veux **jouer les agents et les évolutions IA** afin de **profiter de Solace Agent Mesh,
d'Apigee AI Gateway et de toute l'IA agentique du set**.

## Critères d'acceptation

- [ ] Les capacités IA sont appliquées : Autonome (attaque au hasard en début de tour), Orchestration, Outillage,
      Délégation, Contexte, Garde-fous, Asynchrone, Cache sémantique, Routage multi-modèles.
- [ ] Migration (SFTP) est appliquée.
- [ ] Les évolutions Solace Agent Mesh et Apigee AI Gateway, et les cartes Agent, Orchestrateur multi-agents,
      Serveur MCP, Agent Card (A2A), RAG et SFTP rejoignent `CARTES_PRISES_EN_CHARGE` : **les 71 cartes** sont
      jouables.
- [ ] Le bot sait jouer ces cartes ; la simulation « bot contre bot » tourne avec le set complet.
- [ ] Chaque capacité a son test ; le hasard (Autonome) passe par le générateur à graine.

## Notes

- Issue du découpage d'[US-014](US-014-effets-cartes.md) le 2026-10-18.

## Journal

- 2026-10-18 — création (découpage d'US-014).
