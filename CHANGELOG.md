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
