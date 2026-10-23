# Changelog

Toutes les évolutions notables du projet sont consignées ici
(format [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions [SemVer](https://semver.org/lang/fr/)).

## [Non publié]

### Ajouté

- Socle de développement : TypeScript strict, ESLint, Prettier, Vitest, Playwright + axe-core, Husky, commitlint,
  CI GitHub Actions, Dependabot (US-001).
- Next.js 16 + Tailwind CSS 4, page d'accueil provisoire en français (US-002, ADR 0001).
- Organisation projet : backlog epics/stories, ADR, vision, inspirations, changelog (US-003, ADR 0002).
- PostgreSQL via Docker et Drizzle ORM : configuration, schéma provisoire `cartes`, première migration (US-004, ADR 0003).
- Premier module de logique de jeu : raretés et tirage d'un booster, testé (ADR 0004).
- Référentiel : les ADR technologiques Elis guident les choix techniques, en inspiration (US-006, ADR 0005).
- Front Angular 22 + Tailwind CSS 4 : page d'accueil qui affiche les chances par booster calculées par l'API
  (US-006, ADR 0006).
- API REST Fastify 5 : `/api/v1/sante`, `/api/v1/raretes`, erreurs au format Problem Details, limites de taille et de
  délai (US-006, ADR 0007).
- Monorepo npm workspaces (`apps/web`, `apps/api`, `packages/domain`) ; règles SonarJS et Angular (accessibilité
  comprise) dans ESLint, quality gate `npm run check` (US-006, ADR 0009).
- Cible d'hébergement Azure documentée (US-006, ADR 0008).
- Univers du jeu : la plateforme d'intégration hybride d'Elis, du FTP à l'IA agentique, avec ses lignées d'évolution
  (webMethods, Apigee, Solace) ; règles du combat sur plateau (Débit, SLA, capacités) et brouillon d'un premier set
  de 64 cartes (US-005, ADR 0010).
- Catalogue du set 1 : 71 cartes et 23 capacités en données typées du domaine (ADR 0011), API
  `GET /api/v1/cartes` et `/api/v1/cartes/{numero}` (contrat OpenAPI), pages Angular du catalogue filtrable par
  famille et rareté et du détail d'une carte, accessibles sur mobile (US-008).
- Cartes au design de carte à jouer : format portrait, cadre par rareté, illustration provisoire et pictogramme par
  famille, Débit, Attaque et PV avec icônes ; catalogue en grille de 2 à 5 colonnes et détail en fenêtre modale qui
  garde les filtres ; thème clair ou sombre selon le système, par jetons de couleur (US-009, ADR 0012).
- Moteur de combat pur et rejouable dans `packages/domain` : création de partie à graine, actions (poser, évoluer,
  décommissionner, attaquer, finir son tour), actions possibles, vue par joueur, 13 capacités et 28 cartes jouables
  (US-010, ADR 0013).
- Bot « Batch de nuit » qui joue sur sa seule vue de la partie, trois decks prêtés (Héritage, Moderne, Hybride)
  équilibrés par simulation, validation des decks et simulation « bot contre bot » (`npm run simuler`) (US-011).
- Parties contre le bot côté API : `GET /api/v1/decks`, création, lecture et actions d'une partie ; le bot joue dans
  la requête, seule la vue du joueur est renvoyée ; parties gardées en mémoire avec expiration (US-012, ADR 0014).
- **Premier jalon jouable** : écran de partie contre le bot (`/jouer`) — choix d'un deck prêté, plateau en jetons,
  main en cartes, actions au toucher et au clavier, journal annoncé aux lecteurs d'écran, fin de partie ; règle
  courte, objectif toujours visible et capacités expliquées en jeu (US-013).
- Sorts et incidents jouables : 12 sorts et 13 incidents avec leurs cibles, statuts (immobilisé, Doublon…), parades
  (Human-in-the-loop, OAuth2, Fichier `.ok` témoin, Vétéran) ; le bot les joue, les decks prêtés en contiennent ;
  « Jouer sur … » à l'écran (US-014).
- Effets propres des composants : pioche ciblée (Designer, API Hub, Event Portal), renfort à la pose (OpenAPI,
  AsyncAPI), CDC, Cron et Base vectorielle ; 63 cartes sur 71 jouables (US-019).
- **Les 71 cartes du set 1 sont jouables** : capacités IA (Autonome, Orchestration, Délégation, Contexte, Outillage,
  Cache sémantique, Routage multi-modèles, Garde-fous, Asynchrone) et Migration ; Solace Agent Mesh et Apigee AI
  Gateway jouables ; le bot et les decks prêtés les utilisent (US-020).
- Trois niveaux de bot au choix : Batch de nuit (facile), Architecte ESB (moyen), Agent autonome (difficile), qui
  évaluent leurs actions avec le moteur sans tricher ; `GET /api/v1/niveaux` et choix de la difficulté à l'écran
  (US-021).
- Compte invité sans mot de passe : un pseudo crée le compte, le navigateur garde la session et un code de
  récupération le retrouve sur un autre appareil ; API `/joueurs`, `/sessions`, `/moi`, page « Mon compte » et
  pseudo dans le bandeau (US-022, ADR 0017).
- Base PGlite (PostgreSQL embarqué) en développement et en tests, sans Docker ; migrations appliquées au démarrage
  de l'API (US-022, ADR 0018).
- Boosters : 5 offerts à la création du compte, puis un toutes les 10 minutes (stock plafonné à 10) ; le serveur
  tire 5 cartes qui rejoignent la collection, l'écran « Mes boosters » les révèle et signale les nouvelles ; la
  table provisoire `cartes` est retirée (US-023, ADR 0019).
- Ma collection : progression du set et par rareté, doubles, cartes manquantes visibles et grisées, filtre
  « possédées / manquantes » ; le détail d'une carte indique les exemplaires possédés ; `GET /api/v1/moi/collection`
  (US-024).
- Un booster pour chaque victoire contre le bot, partie lancée en étant connecté : une seule récompense par partie,
  au plus 3 par jour ; l'écran de fin l'annonce et mène à son ouverture (US-025).
- Duels entre joueurs, côté serveur : créer un duel, le rejoindre, jouer à son tour ; l'état vit en base, chacun
  ne reçoit que sa vue, l'ETag évite de recharger un duel inchangé ; API `/api/v1/duels` (US-032, ADR 0020).
- Défier un collègue par lien : on lance un défi depuis « Jouer » et on partage son lien ; le collègue crée au
  besoin son compte, revient au défi et le relève ; un défi sert une fois, s'annule et expire après 7 jours
  (US-033).
- Écran de duel : le défi relevé, chacun joue sur le plateau habituel, l'adversaire nommé par son pseudo ; pendant
  son tour, l'écran se met à jour seul ; la fin du duel propose une revanche (US-034).
- Mes duels : la liste des duels, ceux qui attendent le joueur en premier ; le bandeau compte les duels « à vous de
  jouer » et le titre de l'onglet le reprend ; `GET /api/v1/moi/duels` (US-035).
- Abandon et forfait des duels : on abandonne après confirmation ; sans coup pendant 72 heures, le joueur actif perd
  par forfait ; l'échéance et la raison de la fin s'affichent sur le plateau et dans « Mes duels » (US-036).
- Adversaire au hasard : on rejoint le plus ancien duel ouvert d'un autre joueur, ou on attend le suivant ; les
  défis par lien restent privés (US-037).
- Un booster pour une victoire en duel, dans le même plafond quotidien que contre le bot ; une victoire par abandon ou
  forfait ne compte pas contre un adversaire déjà affronté le jour même (US-038).
- Les attaques expliquées : les règles disent que rien n'attaque tout seul et détaillent la résolution d'un combat,
  exemples chiffrés à l'appui ; la règle courte du jeu demande de sélectionner l'attaquant puis sa cible, avec un
  exemple de riposte ; avant de finir son tour, le joueur est averti des composants qui peuvent encore attaquer
  (US-039).
- Le détail d'une carte de la main en partie : la toucher l'affiche en grand, avec son effet, ses capacités définies
  sur place et son « En vrai », puis ses actions dessous ; elle se consulte aussi pendant le tour adverse (US-040).
- Le détail des composants du plateau, les miens comme ceux de l'adversaire, et du SI adverse : les toucher les
  affiche en grand avec leur état du moment (attaque, PV restants, statuts) et, pour les miens, pourquoi ils
  n'attaquent pas ; la sélection ne joue jamais, l'attaque se confirme par « Attaquer avec… » sous le détail de la
  cible (US-041).
- Parcours e2e des duels fiables sous charge : le duel est préparé par l'API (comptes, défi lancé puis relevé) sauf
  dans le parcours qui teste le défi par lien, les navigateurs demandent des animations réduites, trois travailleurs
  Playwright en local pour ménager la mémoire, le seul parcours qui enchaîne plusieurs tours est déclaré lent, et
  l'adversaire au hasard attend le nom de l'adversaire avant de lire le titre (US-042).
- La CI fait aussi passer les tests de l'API sur PostgreSQL 18, la version de la base de production, chaque fichier
  dans sa propre base ; de vrais tests concurrents (ouvertures de booster, récompenses, appariement, actions de duel)
  y mettent les verrous à l'épreuve, ce que PGlite ne peut pas faire, et les migrations y sont vérifiées sur une base
  vide puis relancées sans effet (US-056).
- Chaîne des illustrations : un original déposé et décrit devient, en une commande (`npm run illustrations`), quatre
  images AVIF et WebP de moins de 100 Ko et un manifeste ; la carte affiche son illustration, ou son pictogramme de
  famille à défaut. EPIC-05 découpé en US-015 à US-017 (US-015, ADR 0015).
- Illustrations provisoires des 71 cartes, dessinées par le code (`npm run illustrations:provisoires`) : un emblème
  par famille, un motif par type, une intensité par rareté, sans texte ni logo, en attendant de vraies illustrations
  (US-018, ADR 0016).
- API prête pour Cloud Run : image Docker multi-étapes construite depuis la racine (API, domaine et migrations
  seulement, ni PGlite ni `.env`, utilisateur non root), écoute `0.0.0.0:$PORT`, arrêt propre sur SIGTERM ; journaux
  JSON au format Cloud Logging (`severity`, `message`, trace de la requête, `LOG_LEVEL`) qui gardent la trace des
  erreurs 500, sans jeton ni corps de requête ; en production, PostgreSQL obligatoire, pool court qui laisse dormir la
  base Neon, certificat vérifié, et migrations par une commande dédiée sous verrou (`node apps/api/src/migrer.ts`)
  (US-046, ADR 0023).
- Infrastructure de la mise en ligne, créée et vérifiée par un script idempotent qui dit ce qui existait déjà
  (`scripts/gcp/infrastructure.sh`, mode `--simulation`) :
  - un projet Google Cloud `hipmaster` relié à la facturation ;
  - un dépôt d'images qui garde les 2 dernières versions ;
  - un bucket de sauvegardes vidé après 30 jours ;
  - les comptes de service de l'API et du déploiement, sans clé ;
  - Workload Identity Federation, limitée au dépôt et à `main` ;
  - un budget qui alerte dès 1 € ;
  - Firebase et son site Hosting ;
  - une base Neon PostgreSQL 18 plafonnée à 0,25 CU, dont l'URL est rangée dans Secret Manager.

  Le script n'utilise jamais la configuration `gcloud` du poste. Un guide d'exploitation l'accompagne (US-049,
  ADR 0024).

- Un niveau de bot facile, « Stagiaire », présélectionné : il ne pose qu'une carte par tour, la plus chère, et
  attaque le SI dès qu'il peut, sans sort ni calcul ; un joueur débutant le bat plus d'une fois sur deux (54 à 56 %
  en simulation, contre 14 % face à Batch de nuit). `npm run simuler` mesure aussi un profil débutant, la part de
  victoires du joueur qui commence et du second, et chaque niveau contre un débutant et contre un joueur du niveau de
  Batch de nuit (US-064).
- Inscription sur invitation : en production, créer un compte demande un code d'invitation (16 caractères, gardé sous
  HMAC), valable pour un nombre de comptes et jusqu'à une date ; chaque compte retient de quelle invitation il vient.
  Un lien `/compte?invitation=…` remplit le code sur « Mon compte », et un code refusé reçoit un 403 qui ne dit pas
  pourquoi. La commande `npm run invitation` crée une invitation (code affiché une seule fois, avec le lien à envoyer),
  liste les invitations ou en révoque une ; en production, un Cloud Run Job l'exécute (guide d'exploitation). En
  développement et dans les e2e, l'inscription reste libre (US-048, ADR 0027).
- Déploiement continu : après chaque CI verte sur `main`, le workflow `deploy.yml` s'authentifie sans clé (Workload
  Identity Federation), construit l'image de l'API étiquetée par le commit, exécute le job de migration, déploie une
  révision Cloud Run sans trafic, la sonde (`/api/v1/sante`), lui bascule le trafic, puis publie le front sur
  Firebase Hosting par son API REST et vérifie le site en ligne. Une étape en échec arrête tout ; avant la bascule,
  l'ancienne révision continue de servir. `scripts/gcp/deployer.sh` lance les mêmes étapes depuis un poste, montre
  l'état et fait le retour arrière de l'API et du front en une commande. `firebase.json` relaie `/api/**` vers
  Cloud Run, renvoie `index.html` aux routes Angular, règle le cache (aucun pour `index.html`, un jour pour les
  illustrations, un an pour les fichiers à empreinte) et pose une CSP stricte avec les en-têtes de sécurité ;
  `robots.txt` et `noindex` tiennent les robots à l'écart. Guide d'exploitation complété : déploiement, retour
  arrière, migrations compatibles (US-050, ADR 0028).
- Page « Inviter », réservée au porteur du projet : créer une invitation (pour qui, nombre de comptes, date limite),
  copier son lien en un geste ou le partager par le menu du téléphone, suivre les comptes créés par chaque invitation et
  en révoquer une après confirmation. Les administrateurs sont désignés par le réglage `ADMINISTRATEURS` de l'API
  (identifiants de joueur, variable GitHub `HIPMASTER_ADMINISTRATEURS` au déploiement), jamais par le front ; les
  routes `/api/v1/admin/invitations` (contrat OpenAPI, débit limité) répondent 404 à tout autre appelant, comme une
  route qui n'existe pas. Le lien « Inviter des collègues » n'apparaît dans « Mon compte » que pour un administrateur,
  et « Mon compte » montre l'identifiant du compte. Une invitation révoquée se distingue désormais d'une invitation
  expirée, dans la page comme dans `npm run invitation -- --lister` (US-072, ADR 0029).
- Page « À propos et confidentialité », à laquelle mène un lien en pied de chaque page : qui édite et héberge le jeu
  (Firebase Hosting, Cloud Run et Neon à Francfort), ce qu'il garde et pourquoi (pseudo, collection, duels, sessions,
  adresses IP des journaux), combien de temps, et comment exercer ses droits ; le seul stockage du navigateur est le
  jeton de session, strictement nécessaire : ni bandeau de consentement, ni traceur, ni mesure d'audience. Comptes, collections,
  récompenses et résultats sont gardés sans limite, sauf suppression par le joueur ; seules des données techniques
  expirent (sessions inutilisées 90 jours, journaux et sauvegardes 30 jours, parties abandonnées, défis jamais
  acceptés) ; celles que la purge d'US-054 appliquera sont marquées « bientôt ». « Mon compte » permet de supprimer son
  compte après confirmation (`DELETE /api/v1/moi`, contrat `comptes.yaml` 1.4.0) : compte, sessions sur tous les
  appareils, collection, récompenses et parties disparaissent en une transaction ; ses duels en cours se terminent
  par forfait au lieu de disparaître pour l'adversaire, qui garde ses duels terminés face à « Compte supprimé »
  (`duels.yaml` 1.3.0) (US-053, ADR 0031).
- Supervision du jeu en ligne : test de disponibilité de `/api/v1/sante` toutes les 15 minutes (sans réveiller la
  base) et e-mail quand le site tombe ; sauvegarde de chaque nuit de la base Neon (`pg_dump` vérifié, 30 jours dans
  Cloud Storage) et relevé quotidien de sa consommation, avec un e-mail au moindre échec ou au-delà de 70 % du quota ;
  restauration essayée dans une branche Neon temporaire (`scripts/gcp/restaurer.sh`). Les erreurs JavaScript des
  joueurs partent vers Error Reporting par `POST /api/v1/erreurs` (contrat OpenAPI, débit limité), sans jeton ni
  paramètres d'adresse. Scan OWASP ZAP de base : aucune alerte élevée ni moyenne (US-051, ADR 0033).
- Fiche « En savoir plus » des cartes : un bouton déplie, sous le texte « En vrai », ce qu'est la technologie, à quoi
  elle sert (ou comment survient l'incident), un exemple, le piège à éviter, le lien avec Elis quand il est public, et
  de 1 à 3 ressources externes (Wikipédia, éditeurs, standards) qui s'ouvrent dans un nouvel onglet, site et langue
  annoncés. Depuis le détail d'une carte (catalogue, collection, booster) et le panneau de la carte choisie en partie.
  Fiches versionnées dans le domaine, format validé par les tests ; `GET /api/v1/cartes/{numero}` les renvoie
  (`cartes.yaml` 1.1.0), la liste reste légère. Huit cartes pilotes, une par famille (US-073, ADR 0034).

### Modifié

- Les parties contre le bot sont gardées en base au lieu de la mémoire de l'API : elles survivent aux déploiements,
  aux arrêts à zéro et aux redémarrages, et expirent après 24 heures sans coup joué (une lecture ne compte pas), ce
  que dit désormais l'écran de partie. Chaque action, tour du bot compris, s'écrit en une seule fois à condition que
  la partie n'ait pas changé : de deux actions simultanées, une seule passe, l'autre reçoit 409. Chaque partie porte
  sa `version` (en-tête `ETag`), que `If-Match` peut exiger (contrat `parties.yaml` 1.3.0). Les parties expirées
  sont purgées à chaque création ; au-delà de 1 000, la partie anonyme la moins récemment jouée part la première.
  Fermer sa session supprime ses parties. Plus rien dans les parties n'impose une seule instance Cloud Run
  (US-052, ADR 0030, qui remplace l'ADR 0014).
- Navigation pensée pour le téléphone : sous 768 px, une barre d'onglets fixée en bas (Jouer, Duels avec la pastille
  « à vous de jouer », Boosters avec le stock, Collection, Compte), au-delà les mêmes onglets dans le bandeau. Onglets
  d'au moins 44 px, onglet courant signalé (trait, gras, `aria-current`), zone de sécurité des téléphones à encoche
  respectée ; la barre s'efface pendant une partie sur téléphone. À chaque changement de page, le focus passe sur son
  titre. Les liens « ← Accueil » disparaissent. L'audit axe des parcours e2e vérifie aussi WCAG 2.1 et 2.2 AA ; les
  cartes de la main et les jetons du plateau respectent « Libellé dans le nom » (US-060).
- L'écran de partie et de duel tient dans un écran de téléphone (375 × 667) sans faire défiler la page : en-tête
  compact, camps et main en rangées qui défilent horizontalement, journal en bandeau de deux lignes qui se déplie à la
  demande, détail d'une carte ou d'un composant en feuille au bas de l'écran, « Finir mon tour » collé au bas.
  L'aide « Comment jouer ? » (objectif, règle, capacités en jeu) devient une fenêtre qui s'ouvre d'elle-même à la
  première partie dans le navigateur, puis depuis le bouton « ? ». Au bureau, l'objectif, les capacités en jeu et le
  journal passent sur le côté du plateau. Le texte des cartes et des jetons suit la taille de texte choisie sur le
  téléphone (tailles en `rem`) (US-059, ADR 0032).
- Les parcours e2e de la CI tournent sur le build de production, servi avec les en-têtes de `firebase.json` : la
  moindre violation de la CSP fait échouer la série (`npm run test:e2e:production`). Le build de production
  n'insère plus de CSS critique en ligne, que la CSP bloquerait. Le compte de déploiement lit les métadonnées des
  secrets, jamais leur valeur (US-050).
- `npm run db:migrate` passe par la commande de migration de l'API (verrou, bilan des migrations appliquées) au lieu de
  `drizzle-kit migrate` ; PGlite devient une dépendance de développement ; Dependabot surveille l'image de base de
  l'API (US-046).
- Le joueur qui joue en second reçoit 1 Débit de plus à son premier tour (2 au lieu de 1), contre le bot comme en
  duel : chacun contre lui-même, le joueur qui commençait gagnait de 62 à 73 % des parties ; le premier et le second
  en gagnent désormais chacun entre 46 et 54 %. Le journal de partie l'annonce, les règles et l'aide « Comment
  jouer ? » l'expliquent (US-064, ADR 0026).
- Niveaux du bot : Batch de nuit devient Moyen, Architecte ESB Difficile et Agent autonome Expert, avec des
  descriptions à jour ; Architecte ESB étudie 4 actions candidates au lieu de 3, sans quoi le joueur qui commence
  gardait 56 % des parties en miroir (US-064).
- Dependabot ne propose plus TypeScript 6.1 ou plus (incompatible avec Angular 22) ni de version majeure de
  `@types/node` (qui suit Node 24) (US-007).

- Next.js remplacé par Angular (ADR 0001 remplacé par 0006) ; la logique de jeu passe de `src/domain` à
  `packages/domain` ; Node 24.15 minimum (exigé par Angular 22) (US-006).
- Base locale : US-004 close, satisfaite par PGlite (US-022, ADR 0018) ; le README précise que `db:up`,
  `db:migrate` et `db:studio` concernent un vrai PostgreSQL (`DATABASE_URL`) (US-004).

### Corrigé

- Scripts d'exploitation sous Windows : les corps JSON envoyés aux API Google passent par un fichier, car un argument
  de `curl` y perdait ses lettres accentuées (message du retour arrière du front, noms des objets de supervision)
  (US-051).
- L'écran de partie et de duel dit pourquoi une carte de la main ne se joue pas, avec les mots du serveur : une
  évolution sans sa carte d'origine (« Évolution d’Apigee API Gateway : posez d’abord Apigee API Gateway, puis
  faites-la évoluer. »), le Débit qui manque (coût effectif, Cache sémantique compris), le plateau plein, un sort ou
  un incident sans cible, une carte pas encore prise en charge, le tour de l'adversaire. Le message générique, qui
  ne s'affichait même pas tant que « Décommissionner » restait proposé, disparaît. Une carte injouable reste lisible,
  avec la mention « Pas jouable » sous sa vignette et la raison dans sa description accessible. La vue de l'API porte
  `injouable` sur chaque carte de la main (contrats `parties.yaml` et `duels.yaml`, version 1.2.0) (US-071).
- Le front tient au démarrage à froid et aux sessions expirées : une panne du serveur ne fait plus perdre son
  compte (seul un 401 oublie la session, avec « Session expirée » puis retour à sa page après reconnexion, et aucun
  écran ne propose de créer un compte tant qu'un jeton est gardé) ; une lecture en panne passagère est retentée deux
  fois (après 1 s puis 3 s) et aucun « Chargement… » ne dure sans fin ; chaque écran en erreur dit pourquoi aux
  joueurs (serveur injoignable, attente demandée par un 429) et propose « Réessayer », à la place du message de
  développeur de l'accueil ; « Ouvrir un booster » attend le catalogue ; les identifiants de partie et de duel tirés
  de l'URL sont vérifiés (UUID) et encodés ; les interrogations périodiques s'arrêtent quand l'onglet est caché ou
  sans geste depuis 10 minutes ; `index.html` affiche un texte de chargement et un `<noscript>`, et déclare
  `color-scheme` ; une déconnexion dans un autre onglet est suivie ; navigateurs pris en charge écrits dans le README
  (US-055).
- `npm run dev` ne fait plus redémarrer l'API en boucle sur un poste chargé : la surveillance se limite à
  `apps/api/src`, `apps/api/drizzle` et `packages/domain/src` au lieu de tout le graphe des modules,
  `node_modules` compris (3 redémarrages en 45 s sans modification avant, aucun après) (US-045).
- Le quality gate ignore les worktrees Git que l'app Claude Desktop crée sous `.claude/worktrees/` : Prettier et
  ESLint ne parcourent plus cette copie du dépôt (`prettier --check .` échouait sur ses migrations Drizzle, ESLint
  lintait 286 fichiers au lieu de 149), et `.gitignore` l'exclut pour tout clone (US-044).
- Tests de l'API : une seule base PGlite en mémoire par fichier (tables vidées avant chaque test) au lieu d'une
  par test, car chaque ouverture charge ≈ 1,6 s de WASM et occupe ≈ 550 Mo ; fichiers de l'API exécutés l'un
  après l'autre ; délais relevés et justifiés pour ce chargement et pour les deux tests qui simulent une dizaine
  de parties. `npm run check` passe sur un poste saturé (US-043).
- La vue de partie renvoyée par l'API perdait le bonus d'attaque des composants et les marqueurs du joueur : un bot
  du domaine joué depuis l'API (Agent autonome) évaluait tout à `NaN` et ne gagnait plus aucune partie. Le schéma et
  le contrat OpenAPI les exposent ; la vue de l'API suffit désormais à reconstituer la partie (US-026).
- Statut des epics : `scripts/cloturer-story.py` déduit le statut et l'avancement de chaque epic de ses stories et
  les écrit à l'identique dans le fichier de l'epic et le tableau ; `--recompter` les recalcule tous (EPIC-00,
  EPIC-02 et EPIC-04 terminés mais restés « En cours », avancements faux après l'ajout de stories) (US-075).

### Sécurité

- Protections de l'API avant l'ouverture (US-047, ADR 0025) :
  - limitation de débit par adresse (IPv6 : par /64) sur la création de compte (30 par heure), la connexion par code
    (10 par minute), les parties contre le bot (20 créations et 300 actions par minute) et chaque route de duel ;
    au-delà, un 429 Problem Details avec `Retry-After`. Les limites, documentées dans les contrats OpenAPI, se règlent
    par `LIMITES_DEBIT` (actives par défaut en production seulement) ;
  - l'adresse du joueur est lue derrière Firebase Hosting et Cloud Run, sans qu'un `X-Forwarded-For` ajouté puisse la
    fausser (`PROXYS_DE_CONFIANCE`, obligatoire en production) ;
  - codes de récupération gardés sous HMAC-SHA-256, avec une clé tirée au hasard dans Secret Manager
    (`cle-codes-recuperation`, créée par le script d'infrastructure) ; sans elle, l'API refuse de démarrer en
    production ;
  - un nouveau code de récupération ferme les autres sessions du compte, et « Mon compte » propose « Déconnecter mes
    autres appareils » ;
  - une partie contre le bot lancée par un joueur connecté n'est visible que de sa session ; au plafond, le dépôt en
    mémoire évince d'abord les parties anonymes ;
  - toutes les réponses portent `X-Content-Type-Options: nosniff` et, sauf politique propre à une route,
    `Cache-Control: no-store` ; corps de requête limités à 16 Ko (413).
