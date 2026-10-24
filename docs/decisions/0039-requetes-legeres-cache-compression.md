# 0039 — Requêtes légères : index mesurés, catalogue en cache public, réponses compressées

- **Date** : 2026-10-24
- **Statut** : Acceptée
- **Complète** : [0023](0023-postgresql-production.md) (connexions courtes), [0038](0038-pwa-service-worker-angular.md)
  (l'API jamais dans le cache du service worker)
- **Référence Elis** : ADR-020 (API REST : réponse en moins de 3 s pour une API front) — retenu ; le référentiel ne
  traite ni du cache HTTP ni de la compression

## Contexte

Le jeu tourne sur des quotas gratuits (ADR 0021) : Cloud Run facture le temps de requête, Neon les heures de calcul
d'une base qui ne s'endort qu'après 5 minutes sans connexion. La revue du 2026-10-22 et les mesures d'US-057 (sur
PostgreSQL 18, avec un joueur assidu et ses 400 duels parmi 6 000, et sur le site en ligne) ont relevé :

- **aucun index secondaire** : chaque requête sur les duels, les récompenses ou les sessions d'un joueur balaie sa
  table ; à ce volume, cela reste sous la milliseconde, mais croît avec l'historique, gardé sans limite ;
- **« Mes duels »**, appelé par chaque client connecté toutes les 60 s, lisait tous les duels du joueur et
  décompressait l'état de chacun (10 Ko) pour en extraire quatre champs : 40 ms et 4 821 blocs, avant de n'en garder
  que 20 terminés ;
- **l'écran de duel** interroge toutes les 3 à 5 s ; un 304 n'était décidé qu'après avoir lu l'état, les pseudos et
  la récompense ;
- **le catalogue** (cartes, decks, niveaux, raretés) est relu à chaque écran, 9 fois dans le front ; ses 21,5 Ko
  partent **non compressés** : ni Cloud Run ni Firebase Hosting ne compressent les réponses de l'API (mesuré sur
  `hipmaster.web.app`), et tout est en `no-store` (US-047).

## Décision

- **Des index là où une requête les sert**, et seulement là (mesuré par `apps/api/src/mesurer-requetes.ts`) : duels
  par créateur et par adversaire avec leur date de mise à jour, défis en attente (index partiel, file des duels
  ouverts et purge), récompenses d'un joueur par date, sessions et parties d'un joueur (suppressions en cascade).
  Une migration qui n'ajoute que des index reste compatible avec la version en ligne (ADR 0028).
- **Les listes sont bornées en base** : « Mes duels » choisit d'abord ses duels sans leur état (ceux qui ne sont pas
  terminés, 200 au plus, puis les 20 derniers terminés) et ne décompresse l'état que de ceux-là.
- **Un duel inchangé répond 304 après la seule lecture de sa version** (et des champs qui décident de sa visibilité,
  de l'expiration d'un défi et du forfait) ; dès qu'une règle demande l'état, la lecture complète reprend la main.
- **Le catalogue part en cache public de 5 minutes** (`Cache-Control: public, max-age=300`) avec un **`ETag` commun**
  à toutes ses routes, empreinte de tout ce qu'elles servent, calculée au démarrage ; un `If-None-Match` connu
  répond 304 dès la réception de la requête. Le relais de Firebase Hosting le garde aussi : la plupart des lectures
  n'atteignent plus Cloud Run. Une erreur (carte inconnue) et **toute donnée d'un joueur restent en `no-store`**.
- **Les réponses de plus de 1 Ko sont compressées** (`@fastify/compress`), Brotli à qualité 5 ou gzip selon
  `Accept-Encoding` : 21,5 Ko → 5 Ko pour le catalogue, en 0,7 ms.
- **Le front garde le catalogue en mémoire le temps de la session** (intercepteur HTTP) : une lecture par session et
  par route, même demandée par plusieurs écrans à la fois ; une lecture en échec est oubliée, pour être retentée.
  Le service worker ne met toujours **aucune réponse de l'API en cache** (ADR 0038 inchangé).

## Alternatives envisagées

- **Cache long du catalogue (un an, `immutable`) avec la version dans l'URL** : idéal pour des fichiers à empreinte,
  mais les routes de l'API sont stables et le front ne connaît pas la version du catalogue avant de l'avoir lu ;
  5 minutes et un `ETag` suffisent à éviter presque toutes les lectures, et une nouvelle version arrive en 5 minutes
  au plus.
- **Copier dans des colonnes le joueur actif, le tour et l'issue des duels**, pour ne plus jamais lire l'état dans
  « Mes duels » : plus rapide encore, mais chaque écriture devrait les tenir à jour, et la version encore en ligne
  pendant un déploiement ne le ferait pas (ADR 0028). Borner la lecture suffit : 2,6 ms au lieu de 40.
- **Brotli à qualité 11** (défaut de Node) : 10 % plus petit, mais 21 ms de calcul par réponse ; **ne rien
  compresser** et compter sur le relais : Firebase Hosting ne compresse pas les réponses de Cloud Run.
- **Mettre le catalogue dans le cache du service worker** : écarté par l'ADR 0038 (état périmé), et inutile avec le
  cache HTTP et la mémoire du front.
- **Pagination de « Mes duels »** : le front n'affiche que les 20 derniers duels terminés ; une pagination viendra
  avec un historique complet, s'il est demandé.

## Conséquences

- À volume égal, « Mes duels » passe de 40 ms et 4 821 blocs à 2,6 ms et 531 blocs ; les recherches de duels, de
  récompenses et de sessions passent d'un parcours de table à un index (de 110 à 187 blocs à moins de 25). Le détail
  est dans US-057 ; la mesure se rejoue avec `npm run mesurer -w @hipmaster/api`, à tenir à jour avec le SQL.
- Une interrogation de duel inchangé fait deux requêtes en base (session, version) au lieu de trois à cinq.
- Après un déploiement qui change le catalogue, un navigateur ou le relais peut servir l'ancien pendant 5 minutes ; un
  onglet resté ouvert le garde jusqu'au prochain rechargement, que le service worker propose à chaque nouvelle
  version.
- Les réponses sont compressées au-delà de 1 Ko : celles qui portent un jeton ou un code (création de compte,
  connexion) restent en dessous, ce qui écarte les attaques par mesure de taille (BREACH).
- Un client connecté qui garde un écran visible interroge encore l'API toutes les 60 s, et chaque requête d'un joueur
  lit sa session en base : tant qu'un écran est ouvert, Neon ne s'endort pas. L'arrêt des interrogations onglet
  caché (US-055) en limite l'effet ; allonger l'intervalle est une décision de produit, pas prise ici.
