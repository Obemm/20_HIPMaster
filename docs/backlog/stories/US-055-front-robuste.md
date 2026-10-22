# US-055 — Un front robuste au démarrage à froid et aux sessions expirées

- **Epic** : EPIC-09
- **Statut** : À affiner
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

- [ ] **Étant donné** un jeton gardé et `/moi` en échec (hors 401), **alors** l'écran dit « Serveur injoignable »
      avec « Réessayer » (et retente seul quelques fois) ; la création de compte n'est **jamais** proposée tant qu'un
      jeton existe.
- [ ] **Étant donné** un 401 sur une route authentifiée, **alors** la session est oubliée et le joueur est renvoyé
      vers « Mon compte » avec le message « Session expirée », puis ramené à sa page après reconnexion.
- [ ] **Étant donné** un 429, **alors** le message dit d'attendre (durée tirée de `Retry-After`).
- [ ] **Étant donné** une lecture (GET) qui échoue, **alors** elle est retentée deux fois avec un délai croissant ;
      chaque écran en erreur affiche un message compréhensible et un bouton « Réessayer » ; aucun « Chargement… »
      ne reste affiché indéfiniment.
- [ ] **Étant donné** le catalogue non chargé, **alors** « Ouvrir un booster » est désactivé.
- [ ] **Étant donné** un onglet caché, ou aucun geste du joueur depuis 10 minutes, **alors** les interrogations
      périodiques (« Mes duels », écran de duel) s'arrêtent, et reprennent dès que le joueur revient. Sans cela, un
      onglet oublié réveillerait la base gratuite toutes les minutes, jour et nuit, et épuiserait son quota (ADR 0021).
- [ ] **Étant donné** un identifiant de partie ou de duel dans l'URL, **alors** il est vérifié (forme d'un UUID) et
      encodé ; sinon l'écran affiche « Partie introuvable ».
- [ ] **Étant donné** le premier chargement, **alors** `index.html` affiche un texte de chargement, un message
      `<noscript>`, et déclare `<meta name="color-scheme" content="light dark">` (pas d'éclair blanc en thème
      sombre) ; **étant donné** une déconnexion dans un autre onglet, **alors** cet onglet l'apprend (événement
      `storage`).
- [ ] Le message de développeur de l'accueil disparaît. Les navigateurs pris en charge (exigences de Tailwind 4 :
      Safari 16.4, Chrome 111, Firefox 128) sont écrits dans la documentation.
- [ ] Tests unitaires de l'intercepteur et du service de compte ; parcours e2e avec une API qui répond 503 puis 200.

## Journal

- 2026-10-22 — création, issue de la revue du front avant mise en ligne.
