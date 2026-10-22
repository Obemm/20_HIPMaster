# US-046 — Une API prête pour Cloud Run

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-046-api-prete-cloud-run`

## Récit

En tant que **porteur du projet**, je veux **une image Docker de l'API qui démarre, se connecte à la base Neon,
laisse cette base se mettre en veille, s'arrête proprement et journalise ce qu'il faut** afin de **la déployer sur
Cloud Run sans surprise et sans frais (ADR 0021)**.

## Contexte

Revue du 2026-10-22 ([revue](../../revues/2026-10-22-revue-mise-en-ligne.md)), constats vérifiés dans le code :

- l'API écoute `127.0.0.1` par défaut et ne lit que `API_PORT`, alors que Cloud Run injecte `PORT` (`config.ts`) ;
- aucun `Dockerfile` ni `.dockerignore` ; `config.ts` charge `.env` s'il existe, qu'un `COPY . .` embarquerait ;
- sans `DATABASE_URL`, l'API se rabat **en silence** sur PGlite : en production, chaque instance aurait sa propre base
  éphémère ;
- le gestionnaire d'erreurs personnalisé (`app.ts`) remplace celui de Fastify, le seul qui journalise : **une erreur
  500 ne laisse aucune trace** ;
- aucun écouteur `SIGTERM` : Cloud Run coupe les requêtes en cours et le pool n'est jamais fermé ;
- pool postgres.js par défaut : 10 connexions, **jamais fermées**. Or la base Neon gratuite (ADR 0021) ne se met pas
  en veille tant qu'une connexion reste ouverte, et son quota se compte en heures de calcul : des connexions oubliées
  le consommeraient même quand personne ne joue ;
- migrations appliquées au démarrage, sans verrou : deux instances qui démarrent ensemble les exécutent en double ;
- journaux pino (`level` numérique, `msg`) que Cloud Logging range tous en sévérité « DEFAULT ».

## Critères d'acceptation

- [ ] **Étant donné** la variable `PORT`, **quand** l'API démarre dans un conteneur, **alors** elle écoute
      `0.0.0.0:$PORT` (le développement garde `127.0.0.1:3000`).
- [ ] **Étant donné** le `Dockerfile` multi-étapes construit depuis la racine du monorepo, **alors** l'image contient
      seulement l'API, `packages/domain` (lien du workspace préservé, Node refusant le TypeScript sous
      `node_modules`), les migrations et les dépendances de production ; elle lance `node apps/api/src/server.ts`
      sans `npm`, sous un utilisateur non root ; `.dockerignore` exclut `.env`, `.donnees`, les rapports de tests et
      `.claude`.
- [ ] **Étant donné** l'URL de la base Neon fournie par Secret Manager, **alors** l'API s'y connecte en TLS
      (`sslmode=require`), de préférence sur le point d'accès direct : le point d'accès mutualisé de Neon (PgBouncer
      en mode transaction) impose des précautions sur les requêtes préparées de postgres.js, à vérifier s'il est
      retenu.
- [ ] **Étant donné** la production, **quand** la connexion à PostgreSQL n'est pas configurée, **alors** l'API refuse
      de démarrer avec un message clair ; PGlite n'est chargé qu'en développement et en tests.
- [ ] **Étant donné** une erreur 500, **alors** elle est journalisée avec son message et sa pile d'appels (test à
      l'appui), sans jeton, code ni corps de requête.
- [ ] **Étant donné** un `SIGTERM`, **alors** l'API refuse les nouvelles requêtes, termine celles en cours, ferme le
      pool et s'arrête avant le délai de Cloud Run.
- [ ] **Étant donné** le pool postgres.js, **alors** sa taille (petite), son délai d'inactivité (court) et son délai
      de connexion sont réglables ; **quand** plus aucune requête n'arrive, **alors** toutes les connexions se ferment
      et la base Neon se met en veille en moins de 10 minutes (mesuré en production, y compris avec le processeur de
      Cloud Run alloué seulement pendant les requêtes). Si les connexions restaient ouvertes, une piste est le pilote
      HTTP de Neon pour les lectures, à évaluer dans la story.
- [ ] **Étant donné** une commande de migration dédiée (exécutée par un Cloud Run Job, US-050), **alors** la
      production ne migre plus au démarrage ; le développement et les tests gardent la migration au démarrage
      (ADR 0018).
- [ ] **Étant donné** les journaux en production, **alors** ce sont des lignes JSON avec `severity`, `message` et la
      trace de la requête (`X-Cloud-Trace-Context`) ; le niveau est réglable (`LOG_LEVEL`).
- [ ] L'image démarre en local contre le PostgreSQL de `docker-compose.yml` et passe la sonde `/api/v1/sante`.

## Notes

- ADR à écrire : migrations hors du démarrage en production (complète l'ADR 0018).
- La dépendance `"@hipmaster/domain": "*"` ne se résout que dans le workspace : toujours construire l'image depuis la
  racine du dépôt.
- `node --watch` en développement : voir US-045 (PR en cours).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0021).
