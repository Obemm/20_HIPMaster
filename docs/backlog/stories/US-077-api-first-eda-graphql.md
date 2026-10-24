# US-077 — Trois nouvelles cartes : API First, EDA et API GraphQL

- **Epic** : EPIC-13
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-077-api-first-eda-graphql`

## Récit

En tant que **joueur**, je veux **trouver dans le jeu les cartes « API First », « EDA » et « API GraphQL »** afin de
**découvrir ces approches qui manquent au catalogue**.

## Critères d'acceptation

- [ ] **Étant donné** le catalogue, **alors** les trois cartes y figurent (famille, rareté, coût, attaque et PV ou
      effet, capacités, texte « En vrai ») : « API First » et « API GraphQL » dans la famille API, « EDA » dans la
      famille Événementiel ; un type (composant, sort) est choisi pour chacune et justifié.
- [ ] **Étant donné** l'équilibre du jeu, **alors** une simulation contre les bots montre qu'aucune des trois ne
      déséquilibre les decks (ADR 0010).
- [ ] **Étant donné** chaque carte, **alors** elle a sa fiche « En savoir plus » (EPIC-12) avec au moins un lien
      vérifié, son prompt d'illustration et son illustration.
- [ ] Elles entrent dans le tirage des boosters ; les collections existantes ne changent pas.

## Notes

- Cartes demandées par le porteur du projet le 2026-10-24.
- À trancher à l'affinage : les ajouter au set 1 (numéros 72 à 74) ou ouvrir le set 2 de l'EPIC-13. « API First »
  et « EDA » sont des façons de concevoir, proches des pistes du set 2 ; « API GraphQL » est une technologie.

## Journal

- 2026-10-24 — création, à la demande du porteur du projet.
