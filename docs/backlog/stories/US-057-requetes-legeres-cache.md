# US-057 — Des requêtes légères : index, lectures bornées, cache et chargement à la demande

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-057-requetes-legeres-cache`

## Récit

En tant que **joueur sur téléphone**, je veux **des écrans qui s'affichent vite, même avec un réseau moyen**, et en
tant que **porteur du projet**, je veux **que chaque joueur coûte peu de requêtes** afin de **rester dans les quotas
gratuits, base Neon comprise**.

## Contexte

Revue du 2026-10-22 :

- **base** : aucun index secondaire (PostgreSQL n'indexe pas les clés étrangères). « Mes duels », appelé par chaque
  client connecté toutes les 60 s et à chaque navigation, balaie toute la table `duels`, ramène tous les duels du
  joueur depuis toujours (la coupe à 20 se fait en JavaScript) et relit l'état complet de chacun ; l'écran de duel
  interroge toutes les 3 à 5 s, et le `If-None-Match` n'est comparé qu'après avoir tout chargé ;
- **réseau** : chaque page recharge le catalogue (21,5 Ko, 5 Ko compressé) et les decks ; les réponses ne sont ni
  compressées ni accompagnées de `Cache-Control` ou d'`ETag` ; les interrogations continuent quand l'onglet est
  caché ;
- **front** : les 11 pages sont dans un seul bundle de 382 Ko (98,5 Ko transférés), aucune n'est chargée à la
  demande ; les illustrations n'ont pas d'empreinte dans leur nom, ce qui interdit un cache long, et partagent le
  préfixe `/cartes/` avec une route Angular.

## Critères d'acceptation

- [ ] **Étant donné** les requêtes de duels, de récompenses et de sessions, **alors** des index les servent
      (`duels` par créateur et par adversaire, file des duels ouverts, récompenses du jour, sessions par joueur) ;
      « Mes duels » est borné en SQL, sans relire l'état complet des duels.
- [ ] **Étant donné** une interrogation d'un duel qui n'a pas changé, **alors** l'API répond 304 après une lecture
      légère de la version, sans charger l'état.
- [ ] **Étant donné** le catalogue, les decks, les niveaux et les raretés, **alors** l'API les envoie compressés,
      avec `Cache-Control: public, max-age=300` et un `ETag` ; les réponses personnelles restent `private, no-store`.
- [ ] **Étant donné** le front, **alors** un service partagé charge le catalogue une fois par session ; la liste des
      decks est un composant unique (l'arrêt des interrogations quand l'onglet est caché relève d'US-055).
- [ ] **Étant donné** les routes Angular, **alors** les pages sont chargées à la demande (`loadComponent`) et les
      budgets du bundle initial sont resserrés.
- [ ] **Étant donné** les illustrations, **alors** leur nom porte une empreinte (chaîne d'US-015), elles sont servies
      sous un préfixe propre (`/illustrations/`) avec un cache d'un an, et une image absente répond 404.

## Journal

- 2026-10-22 — création, issue de la revue de l'API et du front avant mise en ligne.
