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

### Modifié

- Dependabot ne propose plus TypeScript 6.1 ou plus (incompatible avec Angular 22) ni de version majeure de
  `@types/node` (qui suit Node 24) (US-007).

- Next.js remplacé par Angular (ADR 0001 remplacé par 0006) ; la logique de jeu passe de `src/domain` à
  `packages/domain` ; Node 24.15 minimum (exigé par Angular 22) (US-006).
