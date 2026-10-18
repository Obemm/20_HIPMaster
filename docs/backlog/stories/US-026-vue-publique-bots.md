# US-026 — Une vue publique complète, qui suffit à un bot

- **Epic** : EPIC-04
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : XS
- **Branche** : `us-026-vue-publique-bots`

## Récit

En tant que **joueur (ou outil de test) qui joue via l'API**, je veux **recevoir une vue de la partie aussi complète
que celle dont disposent les bots du serveur** afin que **les stratégies du domaine jouent aussi bien depuis l'API
que côté serveur**.

## Critères d'acceptation

- [x] **Étant donné** une vue renvoyée par l'API (schéma de réponse puis JSON), **quand** on la reconstitue avec
      `reconstituer`, **alors** on obtient le même état qu'à partir de la vue complète du domaine, tout au long d'une
      partie.
- [x] L'Agent autonome joué depuis la vue de l'API gagne au moins une partie sur deux contre le Batch de nuit.
- [x] Le contrat OpenAPI décrit les champs ajoutés ; les taux de victoire des niveaux (US-021) sont inchangés.

## Notes

- Anomalie relevée pendant les tests d'US-025 : en jouant j1 via l'API avec `choisirActionAgentAutonome`, on perdait
  toutes les parties contre le Batch de nuit (deck moderne).
- Cause : le schéma Zod `schemaComposant` (`apps/api/src/parties/schemas.ts`) ne déclarait pas `bonusAttaque` ; Zod
  retire les clés inconnues, la vue publique le perdait. `reconstituer` laissait alors `bonusAttaque` indéfini et
  `attaqueEffective` renvoyait `NaN` : toutes les évaluations valaient `NaN`, aucune action ne battait `-Infinity`
  et le bot finissait son tour sans jouer. Les `marqueurs` du joueur (usages « une fois par tour », protections)
  manquaient aussi : le bot les croyait toujours disponibles.
- Aucun impact en production : le serveur fait jouer ses bots sur `vueDe` complète.
- Correction : `bonusAttaque` dans le composant et `marqueurs` dans `moi`, côté Zod et OpenAPI. Le bonus n'apprend
  rien de neuf à l'adversaire (l'attaque effective est déjà publique) ; les marqueurs ne concernent que le joueur.

## Journal

- 2026-10-18 — création, reproduction (0 victoire sur 10) et cause identifiée.
- 2026-10-19 — livrée : bonusAttaque et marqueurs exposés par la vue de l'API ; Agent autonome depuis l'API à 63 % contre Batch de nuit, comme côté serveur ; niveaux US-021 inchangés (55/63/58 %, simuler 100 101)
