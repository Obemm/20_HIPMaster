# US-046 — Une API prête pour Cloud Run

- **Epic** : EPIC-09
- **Statut** : Faite
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

- [x] **Étant donné** la variable `PORT`, **quand** l'API démarre dans un conteneur, **alors** elle écoute
      `0.0.0.0:$PORT` (le développement garde `127.0.0.1:3000`).
- [x] **Étant donné** le `Dockerfile` multi-étapes construit depuis la racine du monorepo, **alors** l'image contient
      seulement l'API, `packages/domain` (lien du workspace préservé, Node refusant le TypeScript sous
      `node_modules`), les migrations et les dépendances de production ; elle lance `node apps/api/src/server.ts`
      sans `npm`, sous un utilisateur non root ; `.dockerignore` exclut `.env`, `.donnees`, les rapports de tests et
      `.claude`.
- [x] **Étant donné** l'URL de la base Neon fournie par Secret Manager, **alors** l'API s'y connecte en TLS
      (`sslmode=require`), de préférence sur le point d'accès direct : le point d'accès mutualisé de Neon (PgBouncer
      en mode transaction) impose des précautions sur les requêtes préparées de postgres.js, à vérifier s'il est
      retenu.
- [x] **Étant donné** la production, **quand** la connexion à PostgreSQL n'est pas configurée, **alors** l'API refuse
      de démarrer avec un message clair ; PGlite n'est chargé qu'en développement et en tests.
- [x] **Étant donné** une erreur 500, **alors** elle est journalisée avec son message et sa pile d'appels (test à
      l'appui), sans jeton, code ni corps de requête.
- [x] **Étant donné** un `SIGTERM`, **alors** l'API refuse les nouvelles requêtes, termine celles en cours, ferme le
      pool et s'arrête avant le délai de Cloud Run.
- [x] **Étant donné** le pool postgres.js, **alors** sa taille (petite), son délai d'inactivité (court) et son délai
      de connexion sont réglables ; **quand** plus aucune requête n'arrive, **alors** toutes les connexions se ferment
      et la base Neon se met en veille en moins de 10 minutes (mesuré en production, y compris avec le processeur de
      Cloud Run alloué seulement pendant les requêtes). Si les connexions restaient ouvertes, une piste est le pilote
      HTTP de Neon pour les lectures, à évaluer dans la story. _Vérifié en local (connexion fermée au terme du délai
      d'inactivité) ; la mesure en production, impossible avant le premier déploiement, est reprise par US-050 selon
      la procédure ci-dessous._
- [x] **Étant donné** une commande de migration dédiée (exécutée par un Cloud Run Job, US-050), **alors** la
      production ne migre plus au démarrage ; le développement et les tests gardent la migration au démarrage
      (ADR 0018).
- [x] **Étant donné** les journaux en production, **alors** ce sont des lignes JSON avec `severity`, `message` et la
      trace de la requête (`X-Cloud-Trace-Context`) ; le niveau est réglable (`LOG_LEVEL`).
- [x] L'image démarre en local contre le PostgreSQL de `docker-compose.yml` et passe la sonde `/api/v1/sante`.

## Notes

- Décision : [ADR 0023](../../decisions/0023-postgresql-production.md) (complète l'ADR 0018) — production sur
  PostgreSQL seulement, migrations par une commande dédiée sous verrou, pool court, point d'accès direct de Neon,
  certificat vérifié.
- La dépendance `"@hipmaster/domain": "*"` ne se résout que dans le workspace : toujours construire l'image depuis la
  racine du dépôt.
- `node --watch` en développement : voir US-045.

## Réalisation

- `config.ts` : `lireConfig()` lit et valide l'environnement (`PORT`, `NODE_ENV`, `LOG_LEVEL`, pool,
  `GOOGLE_CLOUD_PROJECT`) et lève une erreur explicite ; `chargerEnv()` ne lit `.env` qu'hors production.
- `journaux.ts` : journal pino au format Cloud Logging (`severity`, `message`, heure ISO), pile d'appels dans
  `stack_trace` (Error Reporting, US-051), erreurs réduites à leur type, message, code et cause (jamais les
  paramètres d'une requête SQL), champs de trace tirés de `X-Cloud-Trace-Context`.
- `app.ts` : journal et trace par requête ; le gestionnaire d'erreurs journalise les 500 (message et pile) et ne garde
  que le code d'une requête refusée.
- `arret.ts` : arrêt propre sur SIGTERM et SIGINT ; pendant l'arrêt, chaque réponse ferme sa connexion, sans quoi une
  connexion keep-alive (72 s chez Fastify) retenait l'arrêt jusqu'au délai de garde, sans fermer le pool (défaut
  trouvé par le test).
- `db/index.ts` : PGlite importé à la demande (et passé en dépendance de développement) ; pool réglable qui journalise
  chaque connexion fermée ; `urlPostgres()` (TLS vérifié, `channel_binding` retiré) ; `migrerPostgres()` sous verrou
  consultatif. `migrer.ts` : la commande de migration, aussi `npm run db:migrate`.
- `Dockerfile` multi-étapes et `.dockerignore` par liste blanche ; Dependabot surveille l'image de base.

## Vérifications

Faites le 2026-10-22, image construite sur le poste (Docker 29.1.3) contre le PostgreSQL 18 de `docker-compose.yml` :

- image de 294 Mo, dont 43 Mo de dépendances : l'API, `packages/domain`, les migrations ; ni PGlite (il faut
  `--omit=optional`, sinon il entre comme pair optionnel de drizzle-orm : 77 Mo), ni `.env`, ni tests ; utilisateur
  `node` ;
- sans `DATABASE_URL` : une ligne `CRITICAL` « Configuration invalide … obligatoire en production », code de sortie 1 ;
- `node apps/api/src/migrer.ts` sur une base vide : « 8 appliquée(s), 8 au total », puis « 0 appliquée(s) » ;
- l'API écoute `0.0.0.0:8080` ; aucune connexion à la base au démarrage ni pour `/api/v1/sante` ; une création de
  compte ouvre une connexion, refermée 5 s après la dernière requête avec `BASE_INACTIVITE_SECONDES=5` (journal
  « Connexion PostgreSQL fermée ») ;
- `docker stop` (SIGTERM) avec une connexion keep-alive ouverte : arrêt en 0,8 s, pool fermé, code de sortie 0 ;
- auprès de Neon (Francfort), avec un point d'accès fictif : la vérification du certificat réussit, seule
  l'authentification échoue ;
- deux migrations simultanées sur PostgreSQL : l'une applique tout, l'autre rien ; sans le verrou, la seconde échoue
  (test `db/index.test.ts`, qui tourne quand `DATABASE_URL` est posée, voir US-056).

## Vérifier la mise en veille de Neon en production

Cloud Run n'alloue le processeur que pendant les requêtes : le minuteur qui ferme une connexion inactive peut prendre
du retard. À mesurer au premier déploiement (US-050) :

1. Jouer quelques actions, puis noter l'heure de la dernière requête et ne plus rien envoyer (ni onglet ouvert, ni
   test de disponibilité qui toucherait la base : `/api/v1/sante` ne la touche pas).
2. Dans Cloud Logging, chercher `jsonPayload.message="Connexion PostgreSQL fermée"` : la dernière fermeture doit
   suivre la dernière requête d'environ 30 s (`BASE_INACTIVITE_SECONDES`).
3. Dix minutes après la dernière requête, `neonctl operations list --project-id <projet> --output json` doit montrer
   une opération `suspend_compute` postérieure à la dernière fermeture (ou la console Neon, onglet Monitoring : calcul
   suspendu).
4. Si une connexion reste ouverte plus de 5 minutes : la fermer quand plus aucune requête n'est en cours, ou passer
   les lectures au pilote HTTP de Neon (ADR 0023, alternatives).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0021).
- 2026-10-22 — prise en charge (lot 1, session API) ; ADR 0023 écrit ; image vérifiée contre le PostgreSQL local et
  TLS vérifié auprès de Neon ; la mesure de la veille de Neon en production est reprise par US-050.
- 2026-10-22 — livrée : image Docker de l'API (sans PGlite ni .env, non root), écoute 0.0.0.0:$PORT, journaux JSON Cloud Logging avec trace et erreurs 500 journalisées sans données sensibles, arrêt propre sur SIGTERM, pool court et certificat vérifié, migrations par une commande dédiée sous verrou (ADR 0023) ; image vérifiée contre le PostgreSQL local, mesure de la veille de Neon en production reprise par US-050
