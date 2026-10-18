# US-020 — Capacités IA et Migration

- **Epic** : EPIC-04
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-020-capacites-ia`

## Récit

En tant que **joueur**, je veux **jouer les agents et les évolutions IA** afin de **profiter de Solace Agent Mesh,
d'Apigee AI Gateway et de toute l'IA agentique du set**.

## Critères d'acceptation

- [x] Les capacités IA sont appliquées : Autonome (attaque au hasard en début de tour), Orchestration, Outillage,
      Délégation, Contexte, Garde-fous, Asynchrone, Cache sémantique, Routage multi-modèles.
- [x] Migration (SFTP) est appliquée.
- [x] Les évolutions Solace Agent Mesh et Apigee AI Gateway, et les cartes Agent, Orchestrateur multi-agents,
      Serveur MCP, Agent Card (A2A), RAG et SFTP rejoignent `CARTES_PRISES_EN_CHARGE` : **les 71 cartes** sont
      jouables.
- [x] Le bot sait jouer ces cartes ; la simulation « bot contre bot » tourne avec le set complet.
- [x] Chaque capacité a son test ; le hasard (Autonome) passe par le générateur à graine.

## Notes

- Issue du découpage d'[US-014](US-014-effets-cartes.md) le 2026-10-18.
- Trois capacités demandent un choix du joueur et deviennent des actions explicites (ADR 0013) : `outiller`,
  `router`, `migrer`. Les agents Autonomes attaquent au début du tour de leur propriétaire, juste après sa pioche.
- Les decks prêtés intègrent les cartes IA (Moderne : AI Gateway et Agent Mesh ; Hybride : SFTP, Agent, RAG, Serveur
  MCP) ; duels entre 44 et 56 % sur 400 parties.

## Journal

- 2026-10-18 — création (découpage d'US-014).
- 2026-10-18 — `ia.ts` (Autonome, Outillage, Cache sémantique, Routage, Migration), Orchestration, Délégation et
  Contexte dans les outils du moteur ; actions `outiller`, `router`, `migrer` ; bot (Migration, Outillage) ; decks
  prêtés et simulation ; API (contrat, schémas) et écran (boutons, statuts, journal) ; 13 tests du domaine, 2 tests
  de l'écran. **Les 71 cartes sont jouables.** En revue.
- 2026-10-18 — livrée : capacités IA et Migration : les 71 cartes du set 1 sont jouables, bot et decks prêtés équilibrés (44 à 56 %)
