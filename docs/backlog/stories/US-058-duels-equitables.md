# US-058 — Des duels équitables : hasard imprévisible et appariement sûr

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-058-duels-equitables`

## Récit

En tant que **joueur de duel**, je veux **être sûr que mon adversaire ne peut ni prévoir mes cartes ni contourner les
règles** afin que **le jeu reste juste, comme le promet la vision produit**.

## Contexte

Revue de l'API du 2026-10-22 :

- **hasard prévisible** : le moteur utilise mulberry32, un générateur dont l'état tient sur 32 bits, et la graine
  d'un duel est tirée sur 31 bits (`apps/api/src/duels/duels.ts`). Les decks prêtés sont publics. Un joueur qui
  connaît l'algorithme (le dépôt est public) peut retrouver la graine à partir de sa main et de ses premières
  pioches, en essayant les 2³¹ graines, puis voir la main adverse et toutes les pioches à venir. Un duel asynchrone
  lui laisse des jours pour le faire ;
- **appariement** : quand la file « adversaire au hasard » est vide, deux joueurs qui cherchent à quelques
  millisecondes d'écart créent chacun un duel ouvert et s'attendent mutuellement ; un double clic peut placer un
  joueur dans deux duels ;
- la règle « pas de booster contre un adversaire déjà affronté le jour même » n'est évaluée qu'à la première lecture
  par le vainqueur : lire le résultat le lendemain la contourne (le plafond quotidien de 3 boosters tient).

## Critères d'acceptation

- [ ] **Étant donné** un nouveau duel, **alors** son hasard vient d'un générateur dont l'état ne peut pas être
      retrouvé à partir de ce qu'un joueur voit (état d'au moins 128 bits, graine tirée par `node:crypto`) ; les
      parties restent rejouables à partir de leur état (ADR 0013, révisé par un nouvel ADR).
- [ ] **Étant donné** deux recherches simultanées d'adversaire, **alors** elles aboutissent à un seul duel entre
      les deux joueurs ; un joueur ne peut pas avoir deux duels ouverts en attente.
- [ ] **Étant donné** un duel terminé, **alors** la règle de l'adversaire déjà affronté est évaluée à la date de fin
      du duel, quelle que soit la date de lecture.
- [ ] Les duels en cours créés avec l'ancien générateur se terminent normalement. Tests sur PostgreSQL (US-056).

## Journal

- 2026-10-22 — création, issue de la revue de l'API avant mise en ligne.
