# US-011 — Bot « Batch de nuit » et decks prêtés

- **Epic** : EPIC-04
- **Statut** : En revue
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-011-bot-decks-pretes`

## Récit

En tant que **joueur débutant**, je veux **un adversaire simple et un deck tout prêt** afin de **jouer ma première
partie sans rien collectionner d'abord**.

## Critères d'acceptation

- [x] `validerDeck(deck)` applique les règles du deck : 20 cartes, au plus 2 exemplaires d'une carte, 1 seul par
      légendaire.
- [x] Deux ou trois **decks prêtés** thématiques (par exemple « Héritage » fichiers et ESB, « Moderne » API et EDA)
      sont valides et ne contiennent que des cartes prises en charge par le moteur (US-010).
- [x] Le bot **Batch de nuit** choisit ses actions à partir de **sa seule vue** de la partie (il ne triche pas) :
      il pose la carte la plus chère qu'il peut payer, attaque d'abord ce qu'il peut détruire, sinon le SI, et
      décommissionne quand il ne peut rien jouer. Le hasard éventuel passe par le générateur à graine.
- [x] Une simulation « bot contre bot » rejoue N parties à partir d'une graine et donne le taux de victoire par deck
      et la durée moyenne (en tours) ; elle se lance par `npm run simuler`.
- [x] Toute partie bot contre bot se termine (20 tours au plus) ; les résultats d'une première simulation sont notés
      dans [cartes-set-1.md](../../produit/cartes-set-1.md) pour l'équilibrage.

## Notes

- D'autres niveaux de bot (Architecte ESB, Architecte EDA, Agent autonome) viendront dans une story suivante.

## Journal

- 2026-10-18 — création (découpage d'EPIC-04).
- 2026-10-18 — `validerDeck` et 3 decks prêtés (Héritage, Moderne, Hybride) ; bot `choisirActionBatchDeNuit`
  (décide sur sa seule vue, sans hasard) ; `jouerPartie` et `simuler` ; script `npm run simuler` ; 11 tests ;
  résultats de la simulation (200 parties par duel) notés dans cartes-set-1.md : Moderne domine, Hybride est le plus
  faible. En revue.
