# 0023 — PostgreSQL en production : migrations avant le déploiement, connexions courtes

- **Date** : 2026-10-22
- **Statut** : Acceptée
- **Complète** : [0018](0018-pglite-developpement.md) (choix de la base par configuration, migrations au démarrage)
- **Référence Elis** : aucune (le référentiel ne traite ni des migrations de schéma ni des pools de connexions) ;
  ADR-006 (journaux) est déjà adapté par l'ADR [0021](0021-hebergement-gcp.md)

## Contexte

L'ADR 0018 choisit la base par configuration (`DATABASE_URL` → PostgreSQL, sinon PGlite) et applique les migrations au
démarrage de l'API, quelle que soit la base. L'ADR 0021 place l'API sur Cloud Run (0 ou 1 instance, processeur alloué
pendant les requêtes) et la base chez Neon Free, qui se met en veille après 5 minutes sans connexion et compte son
quota en heures de calcul. La revue du 2026-10-22 et US-046 ont relevé :

- sans `DATABASE_URL`, l'API se rabat en silence sur PGlite : en production, chaque instance aurait sa base éphémère ;
- les migrations s'exécutent au démarrage, sans verrou : deux instances qui démarrent ensemble les appliquent en double
  (vérifié sur PostgreSQL 18 : la seconde échoue sur la création de la table des migrations), et chaque démarrage à
  froid toucherait la base ;
- le pool postgres.js par défaut ouvre jusqu'à 10 connexions et ne les ferme jamais : la base ne dormirait plus ;
- avec une URL de Neon (`?sslmode=require&channel_binding=require`), postgres.js accepte n'importe quel certificat, et
  transmet `channel_binding` au serveur, qui refuse alors la connexion (« unrecognized configuration parameter »).

## Décision

- **La production n'utilise que PostgreSQL** : avec `NODE_ENV=production` et sans `DATABASE_URL`, l'API refuse de
  démarrer, avec un message clair. PGlite n'est chargé qu'à la demande, en développement et en tests ; l'image Docker
  ne l'embarque pas.
- **Les migrations passent par une commande dédiée**, `node apps/api/src/migrer.ts` (`npm run db:migrate`) : le
  déploiement l'exécute dans un Cloud Run Job, avec l'image de l'API, avant de lui envoyer le trafic (US-050). En
  production, l'API ne migre plus au démarrage et ne touche pas la base pour démarrer. Le développement et les tests
  gardent la migration au démarrage (ADR 0018).
- **Un verrou empêche deux migrations simultanées** : la migration se fait sur une seule connexion, sous verrou
  consultatif PostgreSQL (`pg_advisory_lock`), qui tombe avec la connexion, même en cas d'échec. La commande dit
  combien de migrations elle a appliquées.
- **Le pool est petit et ferme vite ses connexions** : 5 connexions au plus, fermeture d'une connexion inactive après
  30 s, 10 s pour se connecter (réveil de Neon compris), réglables par `BASE_CONNEXIONS_MAX`,
  `BASE_INACTIVITE_SECONDES` et `BASE_DELAI_CONNEXION_SECONDES`. Il ne se connecte qu'à la première requête qui en a
  besoin, et se ferme à l'arrêt de l'API (SIGTERM). Chaque fermeture de connexion est journalisée.
- **L'API se connecte au point d'accès direct de Neon**, jamais au point d'accès mutualisé (`ep-…-pooler`, PgBouncer
  en mode transaction) : notre pool suffit à une instance, et PgBouncer casserait le verrou de session et imposerait
  des précautions sur les requêtes préparées de postgres.js. L'API refuse une URL `-pooler`.
- **Le certificat de la base est vérifié** : `sslmode=require` devient `verify-full` (certificat et nom d'hôte, avec
  les autorités de Node ; vérifié auprès de Neon à Francfort le 2026-10-22), et `channel_binding` est retiré de l'URL.

## Alternatives envisagées

- **Migrer au démarrage sous verrou** : plus de doublon, mais chaque démarrage à froid réveillerait la base Neon, même
  pour une simple sonde de disponibilité, et une migration ratée se découvrirait sur le trafic réel.
- **`drizzle-kit migrate` dans le job** : un outil de développement, absent de l'image de production ; la commande
  retenue utilise le migrateur de `drizzle-orm`, déjà en production, et y ajoute le verrou.
- **Point d'accès mutualisé de Neon** (`prepare: false`) : utile avec beaucoup d'instances ou de connexions ; inutile
  pour une instance au pool de 5, et incompatible avec le verrou de session.
- **Pilote HTTP de Neon** (`@neondatabase/serverless`) : aucune connexion persistante, donc aucune connexion oubliée ;
  mais pas de transaction interactive en HTTP (`FOR UPDATE` des boosters, concurrence des duels), un second pilote à
  maintenir et du code propre à Neon. Gardé en réserve si la mesure en production montre des connexions qui restent
  ouvertes.
- **Garder PGlite en repli en production** : écarté par la revue (bases éphémères et divergentes).

## Conséquences

- Le déploiement (US-050) exécute le job de migration **avant** de déployer la révision ; une migration doit rester
  compatible avec la version encore en ligne (ajouter, déployer, puis retirer). Si le job échoue, le déploiement
  s'arrête et l'ancienne révision continue de servir.
- La veille de Neon repose sur le minuteur d'inactivité de postgres.js, alors que Cloud Run n'alloue le processeur
  que pendant les requêtes : à mesurer en production (procédure dans US-046). À défaut, l'arrêt de l'instance inactive
  ferme le pool, mais plus tard.
- Après une pause, la première requête paie l'ouverture d'une connexion TLS (et le réveil de Neon) ; les suivantes
  réutilisent la connexion tant qu'elle sert.
- Passer à Cloud SQL (ADR 0021) ne demande que de changer `DATABASE_URL` : rien n'est propre à Neon dans le code, hormis
  le refus d'une URL `-pooler`.
