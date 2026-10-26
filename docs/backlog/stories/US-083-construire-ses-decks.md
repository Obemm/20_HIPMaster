# US-083 — Construire, nommer et garder ses decks à partir de sa collection

- **Epic** : EPIC-15
- **Statut** : Faite
- **ADR** : [0048](../../decisions/0048-decks-des-joueurs.md)
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-083-construire-ses-decks`

## Récit

En tant que **joueur**, je veux **composer mes propres decks avec les cartes de ma collection** afin de **jouer
avec ma stratégie et mes cartes préférées**.

## Critères d'acceptation

- [x] **Étant donné** un joueur connecté, **quand** il crée un deck, **alors** il choisit ses cartes parmi celles
      qu'il possède (filtres par famille, rareté et coût, courbe de coût et répartition par famille visibles), le
      nomme, et l'enregistre ; il peut en garder **5 au plus**, les modifier, les dupliquer et les supprimer.
      → « Mes decks » (`/decks`) et l'écran de construction (`/decks/nouveau`, `/decks/{id}`) ; le sixième deck est
      refusé (409 `decks-plafond`), même demandé en même temps que le cinquième (verrou de la ligne du joueur).
- [x] **Étant donné** les règles du deck (20 cartes, 2 exemplaires au plus, 1 pour une légendaire), **alors**
      l'écran dit ce qui manque ou dépasse pendant la construction, et le serveur refuse un deck invalide ou qui
      contient une carte non possédée (`validerDeck` du domaine, ADR 0004).
      → `problemesDeck` du domaine (codes stables), 422 avec le code du premier problème et la liste complète,
      traduite par le front ; un brouillon de moins de 20 cartes s'enregistre, signalé incomplet (ADR 0048).
- [x] **Étant donné** un deck enregistré, **alors** il est gardé en base avec le compte (contrat OpenAPI d'abord,
      migration compatible, ADR 0028), retrouvé sur un autre appareil, et supprimé avec le compte (US-053).
      → `apps/api/openapi/mes-decks.yaml`, table `decks` (migration `0016_decks_joueurs.sql`, une table ajoutée),
      clé étrangère en cascade ; textes de « Mon compte » et de la page de confidentialité complétés.
- [x] **Étant donné** une carte supprimée, **alors** sa place se libère dans les decks qui la contenaient ; ces
      decks sont signalés incomplets et ne se proposent plus pour jouer tant qu'ils ne sont pas complétés.
      → `libererPlaces` du domaine, appliqué à chaque lecture (ADR 0048) : le deck revient sans l'exemplaire disparu,
      `complet: false`, et « Mes decks » dit combien de places se sont libérées. Ne plus le proposer pour jouer :
      US-084.
- [x] Un deck prêté peut servir de point de départ (« copier ce deck »), limité aux cartes possédées.
      → « Partir d'un deck prêté » dans « Mes decks » : la copie ne garde que les exemplaires de la collection.
- [x] Écran pensé pour le téléphone, accessible, traduit en anglais (EPIC-14).
      → Compteur et « Enregistrer » collants en haut de l'écran, lignes de cartes à deux boutons (− / +) ; audit axe
      dans les deux thèmes et parcours anglais sur 375 px (`e2e/decks.spec.ts`, `e2e/parcours-anglais.spec.ts`).

## Conception (2026-10-26)

- **Domaine** (`packages/domain/src/combat/decks.ts`) : `DECKS_MAX = 5`, `problemesDeck(cartes, possedes?,
{ incompletPermis })` (codes `taille`, `carte-inconnue`, `exemplaires`, `non-possedee`), `libererPlaces`,
  `exemplairesMax` ; `validerDeck` garde ses phrases françaises en s'appuyant sur `problemesDeck`.
- **API** : `GET /moi/decks` (règles et decks effectifs), `POST /moi/decks`, `PUT` et `DELETE /moi/decks/{id}` ;
  `no-store`, limite de débit `ecritureDeck` (120 par minute). Codes : `decks-plafond`, `deck-introuvable`,
  `deck-taille`, `deck-exemplaires`, `deck-carte-inconnue`, `deck-carte-non-possedee`.
- **Front** (`apps/web/src/app/decks/`) : `MesDecksService` (chargé à la connexion), « Mes decks » (boîtes de deck
  d'US-068, dupliquer, supprimer après confirmation, copier un deck prêté), écran de construction (filtres famille,
  rareté, coût ; contenu du deck ; courbe de coût de 1 à « 6+ » ; familles ; règles et ce qui manque ou dépasse).
  Accès : tuile « Mes decks » de l'accueil et lien depuis « Ma collection ».
- **Décisions** : ADR 0048 (5 decks, brouillon permis, places libérées à la lecture sans réécriture, règles servies
  avec la liste, dernier enregistrement gagnant).

## Notes

- Demande du porteur du projet (2026-10-26).
- Décisions du porteur du projet (2026-10-26) : **5 decks au plus par joueur** ; si une carte est supprimée (de la
  collection du joueur ou du catalogue), **sa place se libère** dans chaque deck qui la contenait : le deck redevient
  incomplet, il est signalé comme tel et ne peut plus servir à jouer tant qu'il n'est pas complété.

## Journal

- 2026-10-26 — création, à la demande du porteur du projet (EPIC-15).
- 2026-10-26 — décisions du porteur : 5 decks au plus ; une carte supprimée libère sa place dans les decks.
- 2026-10-26 — affinée (conception, ADR 0048), puis codée : domaine, table et migration, contrat et routes
  `/moi/decks`, écrans « Mes decks » et construction, textes anglais, tests unitaires, d'API (PGlite et
  PostgreSQL 18) et e2e.
- 2026-10-26 — livrée : Decks à soi : 5 au plus, construits sur téléphone depuis la collection, vérifiés par le serveur, places libérées à la lecture
