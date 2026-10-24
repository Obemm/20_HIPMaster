# US-081 — Les cartes, les capacités, les fiches et la règle en anglais

- **Epic** : EPIC-14
- **Statut** : Faite
- **ADR** : [0043](../../decisions/0043-contenu-traduit-domaine-langue-api.md)
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-081-contenu-anglais`

## Récit

En tant que **joueur anglophone**, je veux **lire les cartes, leurs capacités et leurs fiches « Learn more » en
anglais** afin d'**apprendre en jouant, comme les francophones**.

## Critères d'acceptation

- [x] Le domaine porte les textes des 71 cartes, des capacités, des fiches « En savoir plus » et de la règle en
      français (référence) et en anglais ; un test vérifie qu'aucune carte ne manque de traduction.
      → `packages/domain/src/langues/` (cartes, capacités, 71 fiches, decks, niveaux, bulles de la partie guidée,
      phrases du conseil) ; `langues/traductions.test.ts` échoue au moindre texte manquant ou hors des bornes de
      lecture. « La règle » courte est un texte d'interface, traduit dans US-080.
- [x] L'API sert la langue demandée (contrat OpenAPI d'abord), avec repli sur le français ; le cache HTTP du
      catalogue (US-057) distingue les langues.
      → paramètre `langue` dans `cartes.yaml` (1.3.0) et `parties.yaml` (1.6.0) ; un `ETag` par langue ;
      `apps/api/src/langues.test.ts`.
- [x] Les noms de produits ne se traduisent pas ; les liens externes des fiches pointent vers une ressource anglaise
      quand elle existe.
      → noms de produits gardés (test) ; tous les liens des fiches anglaises sont anglais, sauf la page de la CNIL
      sur les mots de passe, qui n'a pas de version anglaise.
- [x] Les textes alternatifs des illustrations existent dans les deux langues.
      → reporté le temps qu'US-017 régénère les 71 images, puis livré : chaque entrée de `set-1.json` porte `alt`
      (français) et `altEn` (anglais, obligatoire, mêmes bornes de 10 à 200 caractères) ; le manifeste généré
      `illustrations.generated.ts` range les textes par langue et `ILLUSTRATIONS_CARTES` prend ceux de la langue du
      site (`LANGUE`). Le générateur des illustrations provisoires (US-018) écrit lui aussi les deux langues.
      Tests : `chaine.test.ts`, `dessin.test.ts`, `versionnees.test.ts` (manifeste à jour), `illustrations.spec.ts`.

## Glossaire et choix à relire

Glossaire commun avec US-080 (voir cette story). Choix propres au contenu, à valider par le porteur :

- exemples traduits pour rester lisibles (`orders.csv`, `/drop/incoming`, topics `sales/order/validated/v1/FR`,
  outil `search_api`) ; le champ source `dateCommande` est gardé pour montrer deux systèmes qui ne parlent pas pareil ;
- fiche 51 : le prompt système d'exemple dit « Answer in English » (adaptation au lecteur) ;
- fiche 60 : le mot de passe d'exemple devient `Summer2012` ;
- decks : Héritage → Legacy, Moderne → Modern, Hybride → Hybrid, Initiation → Starter ;
- textes alternatifs : anglais britannique comme le reste du site (`en-GB` : armoured, colour, organisation),
  « lumineux » rendu par _glowing_, « mécanique » par _mechanical_, sans nom de carte ni de produit.

## Journal

- 2026-10-24 — création, à la demande du porteur du projet (EPIC-14).
- 2026-10-24 — ADR 0043 ; textes anglais du catalogue dans le domaine, API selon `langue`, ETag par langue,
  conseil et partie guidée bilingues ; textes alternatifs reportés (illustrations en cours).
- 2026-10-24 — livrée : Contenu du jeu en anglais dans le domaine (cartes, capacités, fiches, decks, niveaux, partie guidée, conseil), API selon ?langue= avec un ETag par langue, validé par le porteur le 2026-10-24 ; textes alternatifs des illustrations reportés
- 2026-10-24 — critère reporté livré : textes alternatifs des 71 illustrations en anglais (`altEn` dans
  `set-1.json`, manifeste par langue, le front lit celui de la langue du site).
