# US-014 — Effets des sorts, des incidents et des cartes IA

- **Epic** : EPIC-04
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-014-effets-cartes`

## Récit

En tant que **joueur**, je veux **jouer toutes les cartes du set 1** afin de **profiter des Patterns, du Bestiaire et
de l'IA agentique**.

## Critères d'acceptation

- [ ] Les sorts et les incidents se jouent avec leur cible éventuelle, et leurs effets sont appliqués.
- [ ] Les effets propres des composants (« quand il est posé », effets permanents) sont appliqués.
- [ ] Les capacités restantes sont appliquées : Autonome, Orchestration, Outillage, Délégation, Contexte,
      Garde-fous, Asynchrone, Cache sémantique, Routage multi-modèles, Migration et Vétéran.
- [ ] `CARTES_PRISES_EN_CHARGE` couvre les 71 cartes ; les decks prêtés et le bot peuvent les utiliser.
- [ ] Chaque effet a son test ; la simulation « bot contre bot » tourne avec le set complet.

## Notes

- Le hasard des effets (Hallucination, Autonome) passe par le générateur à graine du moteur.
- Pourra être découpée par famille si elle s'avère trop grosse.

## Journal

- 2026-10-18 — création (découpage d'EPIC-04).
