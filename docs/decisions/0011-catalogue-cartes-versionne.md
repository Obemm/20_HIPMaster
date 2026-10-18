# 0011 — Le catalogue des cartes est une donnée versionnée du domaine

- **Date** : 2026-10-18
- **Statut** : Acceptée
- **Référence Elis** : ADR-026 (Semarchy xDM pour les données de référence) — écarté : le catalogue n'est pas une
  donnée de référence partagée entre systèmes de l'entreprise

## Contexte

US-008 publie les 71 cartes du set 1 ([cartes-set-1.md](../produit/cartes-set-1.md)). La base contient une table
provisoire `cartes` (US-004, ADR 0003), créée avant que le modèle de carte soit défini. Les cartes sont des règles du
jeu : leurs statistiques et leurs capacités sont lues par le moteur de combat (ADR 0004), relues en revue de code et
équilibrées par des simulations rejouables. Côté Elis, ADR-026 impose Semarchy xDM dès qu'apparaît un besoin de
données de référence partagées entre systèmes ; ce n'est pas le cas ici, le catalogue n'existe que pour le jeu.

## Décision

- Le catalogue (cartes et capacités) est écrit en **TypeScript typé dans `packages/domain`**, versionné avec le code.
  Il est validé par des tests d'invariants (numéros, raretés, évolutions, statistiques).
- L'API le **lit dans le domaine** et l'expose en lecture seule (`GET /api/v1/cartes`) ; aucune écriture.
- La base ne gardera que **ce qui appartient aux joueurs** (comptes, collection, decks, parties), qui référencera les
  cartes par leur **numéro**. La table provisoire `cartes` sera retirée par une migration dans la première story qui
  touchera à la collection (EPIC-03), pour ne pas mélanger cette story avec un changement de schéma.

## Alternatives envisagées

- **Catalogue en base** (table `cartes` alimentée par un script) : modifiable sans déploiement, mais les règles du
  jeu se retrouveraient hors de la revue de code et hors des tests du domaine, et le moteur dépendrait de la base,
  ce que l'ADR 0004 interdit.
- **Fichier JSON ou YAML** chargé au démarrage : lisible, mais moins sûr que des types TypeScript vérifiés à la
  compilation (capacités inconnues, champs manquants).
- **Semarchy xDM** (ADR-026 Elis) : disproportionné pour des données qui ne sont partagées avec aucun autre système.

## Conséquences

- Changer une carte demande une PR et un déploiement : c'est voulu, les cartes sont des règles.
- Le moteur de combat et le bot lisent le catalogue sans accès réseau ni base, ce qui garde les simulations rapides.
- Les numéros de cartes deviennent un **identifiant stable** : on ne renumérote jamais une carte publiée.
