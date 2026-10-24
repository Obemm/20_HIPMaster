# US-057 — Des requêtes légères : index, lectures bornées, cache et chargement à la demande

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-057-requetes-legeres`

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

Affinage du 2026-10-24, sur mesures (voir « Mesures ») : le plateau, le duel et la page « Inviter » étaient déjà
chargés à la demande (US-061, US-072), et l'arrêt des interrogations onglet caché est livré (US-055). Les
illustrations à empreinte passent dans une story à elles, [US-078](US-078-illustrations-empreinte-cache.md) : leur
chaîne (US-015) est en plein travail avec US-017, et leur nom de fichier change avec elle. La liste des decks en
composant unique est écartée : l'intercepteur du catalogue supprime déjà les lectures répétées, et ce composant
toucherait l'écran de jeu, en chantier (US-066, US-067).

## Critères d'acceptation

- [x] **Étant donné** les requêtes de duels, de récompenses et de sessions, **alors** des index les servent
      (`duels` par créateur et par adversaire, file des duels ouverts, récompenses du jour, sessions et parties par
      joueur) ; « Mes duels » est borné en SQL et ne décompresse l'état que des duels renvoyés.
- [x] **Étant donné** une interrogation d'un duel qui n'a pas changé, **alors** l'API répond 304 après une lecture
      légère de la version, sans charger l'état ; une échéance passée fait toujours appliquer le forfait.
- [x] **Étant donné** le catalogue, les decks, les niveaux et les raretés, **alors** l'API les envoie compressés,
      avec `Cache-Control: public, max-age=300` et un `ETag` (304 sans corps à qui le connaît) ; les réponses
      personnelles et les erreurs restent `no-store`.
- [x] **Étant donné** le front, **alors** le catalogue (cartes, détail, decks, niveaux, raretés) n'est demandé
      qu'une fois par session, même par plusieurs écrans à la fois.
- [x] **Étant donné** les routes Angular, **alors** toutes les pages sauf l'accueil sont chargées à la demande
      (`loadComponent`) et les budgets du bundle initial sont resserrés.
- [x] **Étant donné** une requête de l'API, **alors** sa mesure (`EXPLAIN ANALYZE` sur PostgreSQL 18) se rejoue
      avec `npm run mesurer -w @hipmaster/api`, et chaque gain est prouvé par un test ou une mesure.

## Conception

ADR [0039](../../decisions/0039-requetes-legeres-cache-compression.md).

- **Migration `0013_index_requetes`** (index seulement, compatible avec la version en ligne) : `duels_createur`
  et `duels_adversaire` (joueur, `maj_le`), `duels_attente` (partiel, `cree_le` des défis en attente),
  `recompenses_joueur` (joueur, `accordee_le`), `sessions_joueur`, `parties_joueur`, `parties_session`.
- **« Mes duels »** (`lireMesDuels`) : deux requêtes, chacune choisit ses duels par une sous-requête sans l'état
  (pas terminés : 200 au plus, garde-fou ; terminés : les 20 derniers), puis n'extrait les champs JSON que pour eux.
- **Duel inchangé** (`duelInchange`) : lit statut, version, joueurs et dates ; 304 si la version est connue, que le
  joueur voit le duel, que le défi n'a pas expiré et qu'aucun forfait n'est dû. Sinon, lecture complète.
- **Catalogue** (`cache-catalogue.ts`) : un `ETag` commun, empreinte SHA-256 de tout ce que servent `/cartes`,
  `/cartes/{numero}`, `/decks`, `/niveaux` et `/raretes`, calculée au démarrage ; 304 dès `onRequest`.
- **Compression** : `@fastify/compress`, au-delà de 1 Ko, Brotli qualité 5 ou gzip.
- **Front** : `intercepteurCatalogue` (`reseau/catalogue.ts`) garde en mémoire la réponse de chaque lecture du
  catalogue et la partage (`shareReplay`) ; aucun écran n'a changé. Toutes les routes en `loadComponent`, sauf
  l'accueil ; budget initial : alerte à 420 Ko, erreur à 500 Ko (au lieu de 500 Ko et 1 Mo).
- **Session expirée** (US-055) : avec des pages chargées à la demande, le 401 du démarrage arrive avant la fin de la
  première navigation ; le retour après reconnexion vise donc la page en cours de navigation
  (`router.currentNavigation()`), plus seulement la page affichée (trouvé par l'e2e `robustesse.spec.ts`).

## Mesures

Base de mesure (`npm run mesurer -w @hipmaster/api`, PostgreSQL 18 en local) : 300 joueurs, 6 000 duels dont 400
pour un joueur assidu, état de 9,9 Ko par duel (une vraie partie de 40 coups), 20 000 récompenses, 1 000 parties
contre le bot. Second passage (cache chaud), temps d'exécution et blocs lus :

| Requête                                | Avant                       | Après                             |
| -------------------------------------- | --------------------------- | --------------------------------- |
| « Mes duels » : la liste               | 40,2 ms, 4 821 blocs (séq.) | 2,6 ms, 531 blocs (2 requêtes)    |
| Duels en retard (forfait)              | 0,26 ms, 110 blocs (séq.)   | 0,31 ms, 11 blocs (index)         |
| Adversaire déjà affronté ce jour       | 0,67 ms, 110 blocs (séq.)   | 0,13 ms, 7 blocs (index)          |
| Hasard : déjà dans la file             | 0,22 ms, 110 blocs (séq.)   | 0,08 ms, 5 blocs (index)          |
| Hasard : dernier adversaire            | 0,30 ms, 110 blocs (séq.)   | 0,19 ms, 15 blocs (index)         |
| Hasard : file des duels ouverts        | 0,28 ms, 130 blocs (séq.)   | 0,06 ms, 22 blocs (index partiel) |
| Récompense : victoires du jour         | 0,56 ms, 187 blocs (séq.)   | 0,08 ms, 4 blocs (index)          |
| Fermer ses autres sessions             | 0,24 ms, 16 blocs (séq.)    | 0,27 ms, 9 blocs (index)          |
| Purge : défis expirés                  | 0,26 ms, 124 blocs (séq.)   | 0,13 ms, 1 bloc (index partiel)   |
| Session, lecture d'un duel, collection | déjà par clé primaire       | inchangé                          |

À ce volume, les index gagnent peu en temps (tout tient en mémoire) mais lisent 5 à 40 fois moins de blocs, et ne
croissent plus avec l'historique. Le vrai gain en base est « Mes duels » : 15 fois plus rapide, 9 fois moins de blocs.

Réseau et front :

- **Catalogue compressé** : `/api/v1/cartes` 21 541 → 5 014 octets en Brotli (gzip : 5 110), 0,7 ms de calcul ;
  avant, le site en ligne l'envoyait brut (mesuré sur `hipmaster.web.app` le 2026-10-24) ;
- **Catalogue en cache** : 5 minutes au navigateur et au relais de Firebase Hosting, puis 304 sans corps ; dans le
  front, une seule lecture par session au lieu d'une par écran (9 écrans le lisent) ;
- **Interrogation d'un duel inchangé** : 2 requêtes en base (session, version) au lieu de 3 à 5 (session, duel
  complet, pseudos, récompense), sans décompresser les 10 Ko de l'état ni calculer la vue ;
- **Bundle initial** : 457,6 → 380,5 Ko (117,8 → 100,7 Ko transférés), chaque page chargée à sa première ouverture
  (de 1,7 à 4,2 Ko transférés).

Tests : `cache-catalogue.test.ts` (en-têtes, 304, `no-store` des réponses d'un joueur et des erreurs, compression),
`duels.test.ts` (20 derniers terminés après les duels en cours ; 304 refusé à un tiers ; forfait appliqué malgré une
version connue), `reseau/catalogue.spec.ts` (une lecture par session, partagée, retentée après un échec, jamais pour
les données d'un joueur). E2e sur le build de production : 139 parcours verts, sans violation de la CSP.

## Décision : surveiller avant d'allonger l'intervalle

Un écran visible interroge l'API toutes les 60 s (« Mes duels ») et chaque requête d'un joueur lit sa session en
base : tant qu'un écran est ouvert, Neon ne s'endort pas (veille après 5 minutes sans requête).

Décision du porteur du projet (2026-10-24) : **ne rien changer pour l'instant et surveiller la consommation** avec le
job `hipmaster-consommation` (US-051), qui alerte par e-mail dès 70 % du quota. Si l'alerte tombe à cause des
interrogations, la réponse prévue est d'allonger l'intervalle à 10 minutes (`RAFRAICHISSEMENT_MS` de
`mes-duels.service.ts`) : au-delà de 5 minutes, la base s'endort entre deux interrogations ; en dessous, allonger ne
sert à rien. Écartées pour l'instant : n'interroger que sur l'accueil et « Mes duels », ou combiner les deux.

## Journal

- 2026-10-22 — création, issue de la revue de l'API et du front avant mise en ligne.
- 2026-10-24 — affinage sur mesures (PostgreSQL 18 et site en ligne) ; illustrations à empreinte reportées en US-078.
- 2026-10-24 — livrée : index mesurés, « Mes duels » borné (40 → 2,6 ms), 304 léger des duels, catalogue compressé
  et en cache public avec ETag, gardé en mémoire par le front, pages à la demande (bundle initial 457 → 380 Ko)
  (ADR 0039).
- 2026-10-24 — décision : surveiller la consommation de Neon avant d'allonger l'intervalle des interrogations.
