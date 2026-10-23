# US-073 — Une fiche « En savoir plus » et des liens externes pour chaque carte

- **Epic** : EPIC-12
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-073-fiche-en-savoir-plus`
- **Décision** : [ADR 0034](../../decisions/0034-fiches-pedagogiques-cartes.md)

## Récit

En tant que **joueur curieux**, je veux **ouvrir, depuis n'importe quelle carte, une fiche qui m'explique vraiment de
quoi il s'agit et où en apprendre plus** afin d'**apprendre l'intégration en jouant, sans que la carte elle-même
devienne un pavé**.

## Conception

- **Modèle** (`packages/domain/src/fiches/`, ADR 0034) : une fiche porte `definition` (ce que c'est, en une phrase),
  `usage` (à quoi ça sert ; pour un incident, comment il survient), `exemple`, `aRetenir` (le piège ou la bonne
  pratique), `chezElis` facultatif (seulement des faits déjà publics dans le dépôt) et de 1 à 3 `liens`
  (`titre`, `url` en `https`, `langue` `fr` ou `en`). Un fichier par famille, indexé par numéro de carte.
- **Validation** : `problemesFiche` borne les longueurs (220 / 360 / 360 / 320 / 240 caractères, 1 300 en tout, soit
  moins d'une minute de lecture) et contrôle les liens ; les tests du domaine l'appliquent à toutes les fiches.
- **API** : `GET /api/v1/cartes/{numero}` renvoie la carte et sa `fiche` (schéma `CarteDetaillee`, contrat OpenAPI
  1.1.0) ; la liste `GET /api/v1/cartes` ne la porte pas, pour rester légère.
- **Front** : composant `hip-en-savoir-plus`, un bouton « En savoir plus » (`aria-expanded`, `aria-controls`) qui
  déplie la fiche sous le texte « En vrai ». Dans le détail d'une carte (catalogue, collection, carte vue depuis un
  booster), il n'apparaît que si la fiche existe ; dans le panneau de la carte choisie en partie, il demande la fiche à
  l'API à la première ouverture, et annonce une fiche encore à écrire.
- **Liens externes** : `target="_blank"`, `rel="noopener noreferrer"`, `hreflang`, « (nouvel onglet) » pour les
  lecteurs d'écran, et sous chaque lien le site et la langue (« en.wikipedia.org · en anglais ») ; une phrase prévient
  que ces liens ouvrent un autre site. Rien n'est chargé depuis ces sites : la CSP ne change pas.
- **Cartes pilotes** (une par famille) : FTP (1), webMethods Integration Server 10.15 (9), Apigee API Gateway (18),
  webMethods.io (26), Solace Event Mesh (31), Serveur MCP (44), Dead Letter Queue (53), Prompt injection (59).

## Critères d'acceptation

- [x] **Étant donné** le modèle de carte du domaine (ADR 0011), **alors** une carte peut porter une fiche : définition
      en une phrase, à quoi ça sert, un exemple concret, un piège ou une bonne pratique, et une liste de liens externes
      (titre, adresse, langue). Ces données sont versionnées avec le catalogue et validées par les tests du domaine
      (adresses `https`, champs obligatoires).
- [x] **Étant donné** une carte affichée (catalogue, collection, détail en partie, ouverture de booster), **alors** un
      bouton « En savoir plus » ouvre la fiche. Le texte visible sur la carte reste court et ludique.
- [x] **Étant donné** un lien externe, **alors** il s'ouvre dans un nouvel onglet (`rel="noopener noreferrer"`) et
      signale qu'on quitte le jeu ; la CSP du site n'a pas à changer.
- [x] **Étant donné** quelques cartes pilotes (au moins une par famille), **alors** leur fiche est rédigée et relue,
      pour valider le format avant US-074.
- [x] L'API du catalogue renvoie la fiche (contrat OpenAPI mis à jour d'abord) ; accessibilité (clavier, lecteur
      d'écran, 375 px).

## Notes

- Ton : apprendre sans ennuyer. Une fiche se lit en moins d'une minute ; l'humour d'équipe a sa place dans le texte
  d'ambiance de la carte, la fiche reste exacte.
- Ressources externes possibles : Wikipédia, documentation des éditeurs (Apigee, Solace, webMethods…), standards
  (RFC, OpenAPI, AsyncAPI), _Enterprise Integration Patterns_. Préférer des sources publiques et stables.
- Demande du porteur du projet (2026-10-23) : « l'objectif du jeu est avant tout l'acculturation […] mais elles
  doivent quand même rester ludiques ».
- Depuis un booster, la fiche s'ouvre par le détail de la carte (chaque carte révélée y mène déjà, US-023).
- Les textes « Chez Elis » des pilotes ne reprennent que l'univers du jeu (`docs/produit/univers.md`) : à confirmer
  par le porteur du projet à la relecture.

## Journal

- 2026-10-23 — création, à la demande du porteur du projet.
- 2026-10-24 — affinage (conception, ADR 0034) et réalisation : modèle et validation dans le domaine, contrat OpenAPI
  1.1.0 puis API, composant « En savoir plus » dans le détail d'une carte et en partie, 8 fiches pilotes aux liens
  vérifiés (réponse 200, bon sujet), tests unitaires et e2e.
- 2026-10-24 — livrée : Fiche « En savoir plus » : modèle validé dans le domaine, API (contrat 1.1.0), dépliant accessible dans le détail et en partie, 8 cartes pilotes
