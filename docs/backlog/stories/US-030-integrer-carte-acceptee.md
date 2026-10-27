# US-030 — L'auteur d'une carte dans le catalogue, et une première carte de la communauté

- **Epic** : EPIC-08
- **Statut** : En cours
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-030-auteur-carte`

## Récit

En tant que **mainteneur du jeu**, je veux **qu'une carte du catalogue puisse porter son auteur** et **éprouver le kit
avec un premier collègue** afin de **publier les cartes de la communauté sans ressaisie, avec leur crédit**.

## Critères d'acceptation

- [x] Une carte du domaine peut porter un **auteur** facultatif (nom affiché choisi par le contributeur) ; les cartes
      existantes n'en ont pas ; l'API du catalogue l'expose (contrat OpenAPI mis à jour avant le code).
- [x] Les tests d'invariants du catalogue acceptent les cartes avec auteur, à la suite des numéros existants.
- [x] La consigne de carte (US-028) renseigne ce champ.
- [ ] **Étant donné** un collègue architecte et le kit, **quand** il ouvre sa PR depuis un fork, **alors** elle est
      relue, fusionnée et mise en ligne ; ce qui a coincé est corrigé dans le guide ou la consigne.

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md). Remplace la commande d'intégration du plan
  initial (`npm run carte:integrer`), devenue inutile : la PR du contributeur est l'intégration.
- L'illustration suit la chaîne de l'ADR 0047 ; à défaut, l'illustration provisoire (ADR 0016).

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard), sous le titre « Intégrer une carte acceptée au catalogue ».
- 2026-10-27 — affinage (ADR 0050) : un champ auteur et un premier essai avec un collègue, plus de commande.
- 2026-10-27 — champ `auteur` facultatif (40 caractères au plus, non traduit) dans le domaine, le contrat OpenAPI,
  l'API et le modèle du front ; invariant du catalogue (aucun auteur sur les cartes 1 à 74, nom court sans blanc
  superflu) ; consigne et gabarit le renseignent. Reste le premier essai avec un collègue : la story reste en cours.
