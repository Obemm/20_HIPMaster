# US-073 — Une fiche « En savoir plus » et des liens externes pour chaque carte

- **Epic** : EPIC-12
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-073-fiche-en-savoir-plus`

## Récit

En tant que **joueur curieux**, je veux **ouvrir, depuis n'importe quelle carte, une fiche qui m'explique vraiment de
quoi il s'agit et où en apprendre plus** afin d'**apprendre l'intégration en jouant, sans que la carte elle-même
devienne un pavé**.

## Critères d'acceptation

- [ ] **Étant donné** le modèle de carte du domaine (ADR 0011), **alors** une carte peut porter une fiche : définition
      en une phrase, à quoi ça sert, un exemple concret, un piège ou une bonne pratique, et une liste de liens externes
      (titre, adresse, langue). Ces données sont versionnées avec le catalogue et validées par les tests du domaine
      (adresses `https`, champs obligatoires).
- [ ] **Étant donné** une carte affichée (catalogue, collection, détail en partie, ouverture de booster), **alors** un
      bouton « En savoir plus » ouvre la fiche. Le texte visible sur la carte reste court et ludique.
- [ ] **Étant donné** un lien externe, **alors** il s'ouvre dans un nouvel onglet (`rel="noopener noreferrer"`) et
      signale qu'on quitte le jeu ; la CSP du site n'a pas à changer.
- [ ] **Étant donné** quelques cartes pilotes (au moins une par famille), **alors** leur fiche est rédigée et relue,
      pour valider le format avant US-074.
- [ ] L'API du catalogue renvoie la fiche (contrat OpenAPI mis à jour d'abord) ; accessibilité (clavier, lecteur
      d'écran, 375 px).

## Notes

- Ton : apprendre sans ennuyer. Une fiche se lit en moins d'une minute ; l'humour d'équipe a sa place dans le texte
  d'ambiance de la carte, la fiche reste exacte.
- Ressources externes possibles : Wikipédia, documentation des éditeurs (Apigee, Solace, webMethods…), standards
  (RFC, OpenAPI, AsyncAPI), _Enterprise Integration Patterns_. Préférer des sources publiques et stables.
- Demande du porteur du projet (2026-10-23) : « l'objectif du jeu est avant tout l'acculturation […] mais elles
  doivent quand même rester ludiques ».

## Journal

- 2026-10-23 — création, à la demande du porteur du projet.
