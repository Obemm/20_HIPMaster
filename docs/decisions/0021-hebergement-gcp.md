# 0021 — Hébergement à coût quasi nul : Firebase Hosting, Cloud Run et PostgreSQL Neon

- **Date** : 2026-10-22
- **Statut** : Acceptée (par le porteur du projet, le 2026-10-22)
- **Remplace** : [0008](0008-hebergement-azure.md) (Azure)
- **Référence Elis** : ADR-030 (Azure seul cloud public) — écarté ; ADR-006 (Application Insights / Log Analytics) —
  adapté ; ADR-012 (Storage Account pour les fichiers) — adapté ; ADR-004 (préfixes d'URL hors production) — retenu ;
  ADR-043 (DAST) — adapté

## Contexte

Le porteur du projet veut mettre HIPMaster en ligne dans **son espace Google Cloud personnel**, pour l'équipe
d'intégration et des collègues **sur invitation** : quelques dizaines de joueurs, peu de trafic, aucun enjeu financier.
Une première version de cet ADR proposait Cloud SQL (≈ 10 à 12 € par mois) ; le porteur du projet l'a jugée **trop
chère pour un exercice personnel** et a demandé une solution moins coûteuse que Claude puisse **gérer de bout en
bout** (2026-10-22). L'ADR 0008 visait Azure, sans que rien n'y ait été déployé.

Ce que l'application demande :

- un front Angular **statique** qui appelle l'API en relatif (`/api/v1/…`) ;
- une API Fastify (Node 24, TypeScript natif) sans état, sauf les parties contre le bot gardées en mémoire (ADR 0014,
  une seule instance) ;
- une base **PostgreSQL** (ADR 0003, 0018), de quelques mégaoctets ;
- 2,5 Mo d'illustrations statiques (ADR 0015, 0016).

Le poste du porteur du projet a déjà `gcloud`, la CLI Firebase et Docker ; son compte Google personnel a un compte de
facturation ouvert. Quotas gratuits relevés le 2026-10-22 (par mois) :

- **Cloud Run** : 2 millions de requêtes, 180 000 vCPU-s, 360 000 Gio-s ;
- **Firebase Hosting** : 10 Go stockés et 360 Mo transférés par jour ;
- **Neon Free** : 1 Go de stockage et 100 heures-CU par projet, mise en veille après 5 minutes d'inactivité,
  historique de restauration de 6 heures, sans carte bancaire ;
- **Artifact Registry** 0,5 Go, **Secret Manager** 6 versions, **Cloud Logging** 50 Gio, **Cloud Scheduler**
  3 tâches.

## Décision

Un **projet Google Cloud dédié** (`hipmaster`) sur le compte personnel du porteur du projet, et une base Neon gratuite.
L'API et la base sont à **Francfort**, au plus près l'une de l'autre, car chaque requête de l'API interroge la base
plusieurs fois.

| Besoin                   | Service                                                        | Réglages principaux                                                                                                                                                                             | Coût  |
| ------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Front, adresse, TLS, CDN | **Firebase Hosting**                                           | build Angular ; réécriture `/api/**` → Cloud Run ; repli `index.html` ; en-têtes de sécurité (CSP, HSTS…) ; cache long sur les fichiers à empreinte ; adresse `hipmaster.web.app`               | 0 €   |
| API                      | **Cloud Run** (`europe-west3`, Francfort)                      | image Docker Node 24 ; 1 vCPU, 512 Mio ; facturation à la requête ; 0 instance minimum ; **1 instance maximum** tant que l'ADR 0014 tient ; écoute `0.0.0.0:$PORT` ; arrêt propre sur `SIGTERM` | 0 €   |
| Base de données          | **Neon Free** (PostgreSQL géré, AWS `eu-central-1`, Francfort) | calcul plafonné à 0,25 CU ; connexion TLS ; mise en veille après 5 minutes sans connexion ouverte                                                                                               | 0 €   |
| Migrations, sauvegardes  | **Cloud Run Jobs** et **Cloud Scheduler**                      | migrations exécutées par le déploiement avant la bascule du trafic ; `pg_dump` chaque nuit vers **Cloud Storage** (30 jours gardés)                                                             | ≈ 0 € |
| Images, secrets          | **Artifact Registry**, **Secret Manager**                      | 2 dernières images gardées ; l'URL de la base est un secret, jamais dans le dépôt                                                                                                               | 0 €   |
| Journaux, alertes        | **Cloud Logging**, **Error Reporting**, **Monitoring**         | journaux JSON avec `severity` ; test de disponibilité et alerte par e-mail ; suivi de la consommation Neon                                                                                      | 0 €   |
| Déploiement              | **GitHub Actions** + **Workload Identity Federation**          | au merge sur `main`, après la CI ; aucune clé de compte de service stockée                                                                                                                      | 0 €   |
| Garde-fous               | **Budget de facturation**                                      | alerte dès 1 € ; plafond d'instances Cloud Run                                                                                                                                                  | 0 €   |

Coût visé : **0 €**, à quelques centimes près (stockage des sauvegardes, trafic sortant). Tout se pilote en ligne de
commande (`gcloud`, CLI Firebase, `neonctl`) : Claude peut tout installer, déployer et maintenir. Seule étape
manuelle : la création du compte Neon (gratuit) et l'autorisation de la CLI par le porteur du projet.

## Alternatives envisagées

- **Cloud SQL pour PostgreSQL** (db-f1-micro, ≈ 10 à 12 € par mois) : base gérée dans GCP, sans quota d'heures, mais
  trop chère pour un exercice personnel (décision du porteur du projet, 2026-10-22). Reste la cible si le jeu grandit :
  seule la variable de connexion change.
- **PostgreSQL sur une VM e2-micro gratuite** : 0 € et tout dans GCP, mais la gratuité n'existe qu'aux États-Unis
  (données hors UE, ≈ 100 ms de plus par requête), avec 1 Go de mémoire, et le système, PostgreSQL, les correctifs et
  les sauvegardes restent à maintenir. Écartée : plus de travail et de risque pour le même prix.
- **Firestore** : gratuit à petite échelle, mais il faudrait réécrire toute la persistance (contraire aux ADR 0003 et
  0018). Écartée.
- **PGlite dans le conteneur, sauvegardé dans Cloud Storage** : gratuit, mais une seule instance, des pertes possibles
  entre deux sauvegardes et aucun verrou contre deux instances simultanées. Écartée.
- **Cloud Run seul, qui servirait aussi le front** : un déploiement de moins, mais pas de CDN, un premier affichage qui
  attend le démarrage du conteneur, et une adresse en `run.app` peu lisible. Écartée.
- **Équilibreur de charge et Cloud CDN** : ≈ 18 $ par mois rien que pour la règle de transfert. Écartée.
- **Azure (ADR 0008)** : le porteur du projet dispose d'un espace GCP. Écartée.

## Conséquences

- **Garder la base en veille quand personne ne joue** : le quota Neon gratuit (100 heures-CU par mois, soit environ
  13 heures d'activité par jour à 0,25 CU) est dépassé si la base ne dort jamais. Une connexion ouverte l'empêche de se
  mettre en veille : l'API ferme vite ses connexions inutilisées, et le front cesse ses interrogations périodiques quand
  l'onglet est caché ou que le joueur est inactif. Si le quota était épuisé, la base serait suspendue jusqu'au mois
  suivant : la consommation est suivie et déclenche une alerte bien avant.
- **Temps de réveil** : après une pause, la première requête attend le démarrage de Cloud Run (1 à 3 s) et le réveil de
  la base (quelques centaines de millisecondes). Le front l'annonce (« Chargement… », nouvel essai).
- **Sauvegardes** : l'historique de 6 heures de Neon ne suffit pas ; une sauvegarde `pg_dump` part chaque nuit vers
  Cloud Storage, et sa restauration est testée.
- **Un second fournisseur** (Neon) en plus de Google : compte gratuit, sans carte bancaire. Le code reste du PostgreSQL
  standard, et passer à Cloud SQL ne demande que de changer la variable de connexion.
- **Projet isolé** : le projet `hipmaster` vit sur le compte personnel du porteur du projet, administré par une
  configuration `gcloud` dédiée. La configuration `gcloud` professionnelle du poste n'est jamais utilisée pour ce projet.
- **Écart assumé avec ADR-030 Elis** (Azure seul cloud) : sans objet pour un projet personnel hors du SI Elis. ADR-006
  adapté (Cloud Logging et Error Reporting), ADR-012 adapté (illustrations servies en fichiers statiques par Firebase
  Hosting), ADR-043 adapté (scan DAST de base avant l'ouverture).
- **ADR 0014** : tant que les parties contre le bot vivent en mémoire, Cloud Run reste à une instance, et un
  déploiement ou un arrêt à zéro les efface ; les persister en base lève cette limite (EPIC-09).
- **Firebase Hosting** relaie l'en-tête `Authorization` (ADR 0017) mais aucun cookie sauf `__session`, et coupe une
  requête relayée au bout de 60 s, très au-delà des 3 s d'ADR-020. Sa **CSP** (sans `unsafe-inline`) impose de
  désactiver l'insertion du CSS critique en ligne dans le build Angular (`inlineCritical: false`).
- L'ADR [0008](0008-hebergement-azure.md) (Azure) est remplacé par celui-ci.
