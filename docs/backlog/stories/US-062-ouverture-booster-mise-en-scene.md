# US-062 — Ouvrir un booster, un vrai moment

- **Epic** : EPIC-10
- **Statut** : À affiner
- **Priorité** : Could
- **Taille** : M
- **Branche** : `us-062-ouverture-booster-mise-en-scene`

## Récit

En tant que **joueur**, je veux **découvrir mes cartes une à une quand j'ouvre un booster** afin de **ressentir le
plaisir de la découverte, surtout pour une carte rare**.

## Contexte

Constat de la revue du 2026-10-22 : l'écran « Mes boosters » est un texte (« 5 boosters en stock ») et un bouton ;
l'ouverture affiche d'un coup la grille des 5 cartes avec une étiquette « Nouvelle ! ». C'est le moment fort d'un
jeu de cartes à collectionner (WikiMasters, voir `docs/produit/inspirations.md`).

## Critères d'acceptation

- [ ] **Étant donné** des boosters en stock, **alors** l'écran les montre comme des paquets (visuel), avec le stock
      et le temps avant le prochain booster gratuit.
- [ ] **Étant donné** un booster ouvert, **quand** les cartes arrivent, **alors** elles se révèlent une à une (geste
      ou appui), la rareté se voit avant le retournement, et une carte épique ou légendaire a un effet plus marqué.
- [ ] **Étant donné** un joueur pressé, **alors** un bouton « Tout révéler » montre les 5 cartes d'un coup.
- [ ] **Étant donné** la préférence système « réduire les animations », **alors** aucune animation n'est jouée.
- [ ] Le tirage reste fait par le serveur (ADR 0004, 0019) : l'animation ne change rien au résultat.

## Journal

- 2026-10-22 — création, issue de la revue du design avant mise en ligne.
