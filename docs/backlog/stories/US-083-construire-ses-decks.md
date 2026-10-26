# US-083 — Construire, nommer et garder ses decks à partir de sa collection

- **Epic** : EPIC-15
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-083-construire-ses-decks`

## Récit

En tant que **joueur**, je veux **composer mes propres decks avec les cartes de ma collection** afin de **jouer
avec ma stratégie et mes cartes préférées**.

## Critères d'acceptation

- [ ] **Étant donné** un joueur connecté, **quand** il crée un deck, **alors** il choisit ses cartes parmi celles
      qu'il possède (filtres par famille, rareté et coût, courbe de coût et répartition par famille visibles), le
      nomme, et l'enregistre ; il peut en garder **5 au plus**, les modifier, les dupliquer et les supprimer.
- [ ] **Étant donné** les règles du deck (20 cartes, 2 exemplaires au plus, 1 pour une légendaire), **alors**
      l'écran dit ce qui manque ou dépasse pendant la construction, et le serveur refuse un deck invalide ou qui
      contient une carte non possédée (`validerDeck` du domaine, ADR 0004).
- [ ] **Étant donné** un deck enregistré, **alors** il est gardé en base avec le compte (contrat OpenAPI d'abord,
      migration compatible, ADR 0028), retrouvé sur un autre appareil, et supprimé avec le compte (US-053).
- [ ] **Étant donné** une carte supprimée, **alors** sa place se libère dans les decks qui la contenaient ; ces
      decks sont signalés incomplets et ne se proposent plus pour jouer tant qu'ils ne sont pas complétés.
- [ ] Un deck prêté peut servir de point de départ (« copier ce deck »), limité aux cartes possédées.
- [ ] Écran pensé pour le téléphone, accessible, traduit en anglais (EPIC-14).

## Notes

- Demande du porteur du projet (2026-10-26).
- Décisions du porteur du projet (2026-10-26) : **5 decks au plus par joueur** ; si une carte est supprimée (de la
  collection du joueur ou du catalogue), **sa place se libère** dans chaque deck qui la contenait : le deck redevient
  incomplet, il est signalé comme tel et ne peut plus servir à jouer tant qu'il n'est pas complété.

## Journal

- 2026-10-26 — création, à la demande du porteur du projet (EPIC-15).
- 2026-10-26 — décisions du porteur : 5 decks au plus ; une carte supprimée libère sa place dans les decks.
