# US-055 — Un front robuste au démarrage à froid et aux sessions expirées

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-055-front-robuste`

## Récit

En tant que **joueur**, je veux **que le jeu me dise clairement quand le serveur est lent, indisponible ou que ma
session a expiré, et me laisse réessayer** afin de **ne jamais perdre mon compte ni rester devant « Chargement… »**.

## Contexte

Revue du front du 2026-10-22, constats vérifiés (en ligne, Cloud Run démarre à froid en 1 à 3 s, se redéploie
souvent, et renverra des 429 avec US-047) :

- **risque de perte de compte** : si `GET /api/v1/moi` échoue autrement qu'en 401 (panne passagère, déploiement,
  429), `CompteService.charger()` considère le joueur comme déconnecté ; l'écran propose « Créer un compte », et un
  nouveau compte **écrase le jeton** de l'ancien, qui ne se retrouve plus qu'avec le code de récupération ;
- l'accueil affiche aux joueurs un message de développeur : « L'API ne répond pas : lance-la avec `npm run dev` » ;
- un 401 en cours de session s'affiche comme une panne, sans oublier la session ; plusieurs écrans restent sur
  « Chargement… » pour toujours si une requête échoue (collection, partie, mes duels) ; aucun écran ne propose
  « Réessayer » ;
- si le catalogue n'a pas pu être chargé, ouvrir un booster **consomme le booster sans montrer aucune carte** ;
- les identifiants de partie et de duel tirés de l'URL sont recollés sans encodage dans les URL d'API :
  `/jouer/..%2F..%2Fv1%2Fraretes` fait appeler `GET /api/v1/raretes` avec le jeton du joueur ;
- l'écran reste blanc pendant le chargement du JavaScript ; la session n'est pas synchronisée entre onglets.

## Critères d'acceptation

- [x] **Étant donné** un jeton gardé et `/moi` en échec (hors 401), **alors** l'écran dit « Serveur injoignable »
      avec « Réessayer » (et retente seul quelques fois) ; la création de compte n'est **jamais** proposée tant qu'un
      jeton existe.
- [x] **Étant donné** un 401 sur une route authentifiée, **alors** la session est oubliée et le joueur est renvoyé
      vers « Mon compte » avec le message « Session expirée », puis ramené à sa page après reconnexion.
- [x] **Étant donné** un 429, **alors** le message dit d'attendre (durée tirée de `Retry-After`).
- [x] **Étant donné** une lecture (GET) qui échoue, **alors** elle est retentée deux fois avec un délai croissant ;
      chaque écran en erreur affiche un message compréhensible et un bouton « Réessayer » ; aucun « Chargement… »
      ne reste affiché indéfiniment.
- [x] **Étant donné** le catalogue non chargé, **alors** « Ouvrir un booster » est désactivé.
- [x] **Étant donné** un onglet caché, ou aucun geste du joueur depuis 10 minutes, **alors** les interrogations
      périodiques (« Mes duels », écran de duel) s'arrêtent, et reprennent dès que le joueur revient. Sans cela, un
      onglet oublié réveillerait la base gratuite toutes les minutes, jour et nuit, et épuiserait son quota (ADR 0021).
- [x] **Étant donné** un identifiant de partie ou de duel dans l'URL, **alors** il est vérifié (forme d'un UUID) et
      encodé ; sinon l'écran affiche « Partie introuvable ».
- [x] **Étant donné** le premier chargement, **alors** `index.html` affiche un texte de chargement, un message
      `<noscript>`, et déclare `<meta name="color-scheme" content="light dark">` (pas d'éclair blanc en thème
      sombre) ; **étant donné** une déconnexion dans un autre onglet, **alors** cet onglet l'apprend (événement
      `storage`).
- [x] Le message de développeur de l'accueil disparaît. Les navigateurs pris en charge (exigences de Tailwind 4 :
      Safari 16.4, Chrome 111, Firefox 128) sont écrits dans la documentation.
- [x] Tests unitaires de l'intercepteur et du service de compte ; parcours e2e avec une API qui répond 503 puis 200.

## Notes

Ce qui a été construit (`apps/web/src/app/`) :

- **Réseau** (`reseau/reseau.ts`) : `intercepteurReseau` retente deux fois une lecture de l'API (GET) en panne
  passagère (réseau coupé, délai dépassé, 408, 5xx), après 1 s puis 3 s, et abandonne chaque essai resté 15 s sans
  réponse : au pire, l'écran parle de panne au bout de 49 s, jamais « Chargement… » sans fin. Les écritures ne sont
  jamais rejouées (un booster ouvert deux fois). Un 429 n'est pas retenté : `Retry-After` (secondes ou date HTTP, une
  minute à défaut) met en pause les interrogations de fond. `expliquer()` traduit chaque erreur pour le joueur
  (« Serveur injoignable… », « Trop de demandes en peu de temps : patientez 30 s… »).
- **Session** (`compte/compte.service.ts`) : seul un 401 fait oublier la session. Toute autre erreur de
  `GET /api/v1/moi` laisse le jeton et donne l'état « session non vérifiée » : trois nouvelles vérifications
  automatiques (après 5, 15 et 45 s), puis à chaque navigation, au retour du réseau (`online`) et sur « Réessayer ».
  `creer()` et `recuperer()` refusent de remplacer un jeton gardé, et aucun écran ne propose alors de créer un
  compte (`<hip-etat-session>`). `intercepteurJeton` traite le 401 d'une route authentifiée (sauf `/sessions`, où il
  veut dire « code inconnu » ou « session déjà fermée ») : session oubliée, renvoi vers `/compte?retour=…` avec
  « Session expirée », retour à la page après reconnexion ; un 401 venu d'une ancienne session n'efface pas la
  nouvelle. L'événement `storage` fait suivre à chaque onglet une connexion ou une déconnexion faite dans un autre.
- **Présence** (`presence.ts`) : le joueur est là si l'onglet est visible et s'il a fait un geste (toucher, clic,
  souris, clavier, défilement) depuis moins de 10 minutes. `interroger()` porte les interrogations de « Mes duels »
  (60 s), de l'attente d'un défi (5 s) et du duel (3 s) : rien en son absence, reprise aussitôt à son retour si la
  période est écoulée, jamais deux passages à la fois. La relecture du stock de boosters à la recharge attend aussi
  son retour.
- **Écrans** : `<hip-erreur-chargement>` (ce qui manque, pourquoi, « Réessayer ») sur l'accueil, le catalogue, le
  détail d'une carte, le choix du deck et des niveaux, la partie, le duel, les boosters (stock et catalogue), la
  collection, « Mes duels » et le nouveau défi. « Ouvrir un booster » reste désactivé tant que le catalogue manque.
- **Identifiants** (`identifiant.ts`) : forme d'UUID vérifiée, puis `encodeURIComponent` ; sinon « Partie
  introuvable » ou « Défi introuvable », sans aucune requête.
- **`index.html`** : texte de chargement (masqué sans JavaScript par la variante `noscript:` de Tailwind),
  `<noscript>`, `<meta name="color-scheme" content="light dark">` ; ni style ni script en ligne, que la CSP d'US-050
  interdira.
- Navigateurs pris en charge écrits dans le README.

Pas d'ADR : ces choix appliquent des conséquences déjà actées, celles de l'ADR 0021 (interrogations arrêtées quand
l'onglet est caché ou le joueur inactif, nouvel essai au réveil du serveur) et de l'ADR 0017 (401 : session
inconnue), sans rien changer à l'architecture ; l'interrogation par `GET` conditionnel de l'ADR 0020 est conservée.

## Journal

- 2026-10-22 — création, issue de la revue du front avant mise en ligne.
- 2026-10-22 — en cours (session front du lot 1, branche `us-055-front-robuste`) : intercepteurs, état « session
  non vérifiée », présence du joueur, « Réessayer » sur chaque écran, identifiants vérifiés, `index.html` ; tests
  unitaires du front (106) au vert.
- 2026-10-22 — livrée : seul un 401 fait oublier la session, sinon « session non vérifiée » avec « Réessayer » et nouvelles vérifications ; 401 : « Session expirée » puis retour à la page ; GET retentés deux fois (1 s, 3 s), 15 s au plus par essai, 429 et Retry-After ; « Réessayer » sur chaque écran en erreur ; booster désactivé sans catalogue ; identifiants vérifiés (UUID) et encodés ; interrogations arrêtées onglet caché ou après 10 min sans geste ; index.html (chargement, noscript, color-scheme) ; session suivie entre onglets ; navigateurs dans le README. 106 tests unitaires du front, e2e 93/93
