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
- Chaîne des illustrations : un original déposé et décrit devient, en une commande (`npm run illustrations`), quatre
  images AVIF et WebP de moins de 100 Ko et un manifeste ; la carte affiche son illustration, ou son pictogramme de
  famille à défaut. EPIC-05 découpé en US-015 à US-017 (US-015, ADR 0015).
- Illustrations provisoires des 71 cartes, dessinées par le code (`npm run illustrations:provisoires`) : un emblème
  par famille, un motif par type, une intensité par rareté, sans texte ni logo, en attendant de vraies illustrations
  (US-018, ADR 0016).

### Modifié

- Dependabot ne propose plus TypeScript 6.1 ou plus (incompatible avec Angular 22) ni de version majeure de
  `@types/node` (qui suit Node 24) (US-007).

- Next.js remplacé par Angular (ADR 0001 remplacé par 0006) ; la logique de jeu passe de `src/domain` à
  `packages/domain` ; Node 24.15 minimum (exigé par Angular 22) (US-006).
- Base locale : US-004 close, satisfaite par PGlite (US-022, ADR 0018) ; le README précise que `db:up`,
  `db:migrate` et `db:studio` concernent un vrai PostgreSQL (`DATABASE_URL`) (US-004).

### Corrigé

- La vue de partie renvoyée par l'API perdait le bonus d'attaque des composants et les marqueurs du joueur : un bot
  du domaine joué depuis l'API (Agent autonome) évaluait tout à `NaN` et ne gagnait plus aucune partie. Le schéma et
  le contrat OpenAPI les exposent ; la vue de l'API suffit désormais à reconstituer la partie (US-026).
