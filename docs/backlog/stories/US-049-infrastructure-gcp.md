# US-049 — Infrastructure gratuite et reproductible

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-049-infrastructure-gcp`

## Récit

En tant que **porteur du projet**, je veux **que l'infrastructure décrite par l'ADR 0021 soit créée par un script
versionné, que Claude peut exécuter et relancer** afin de **ne rien payer, ne rien configurer à la main et pouvoir
tout recréer**.

## Critères d'acceptation

- [x] **Étant donné** le compte Google personnel du porteur du projet, **quand** le script s'exécute, **alors** il
      utilise une configuration `gcloud` dédiée (`hipmaster`), vérifie le compte et le projet avant toute écriture, et
      ne touche jamais la configuration professionnelle du poste.
- [x] **Étant donné** cette configuration, **alors** le script crée le projet `hipmaster` (ou le réutilise), le relie
      au compte de facturation personnel, active les API nécessaires et crée, à Francfort (`europe-west3`) :
  - un dépôt Docker **Artifact Registry** qui ne garde que les 2 dernières images ;
  - un bucket **Cloud Storage** pour les sauvegardes, qui supprime les fichiers de plus de 30 jours ;
  - le compte de service de l'API (lecture de son seul secret) ;
  - le compte de service de déploiement, relié au dépôt GitHub par **Workload Identity Federation** et limité à la
    branche `main` (aucune clé JSON créée) ;
  - un **budget** avec alerte dès 1 €.
- [x] **Étant donné** la CLI `neonctl` autorisée par le porteur du projet, **alors** le script crée (ou réutilise)
      le projet Neon (AWS `eu-central-1`, Francfort, PostgreSQL 18 comme PGlite, ADR 0024), plafonne le calcul à
      0,25 CU, crée la base et son rôle, et range l'URL de connexion dans **Secret Manager** sans jamais l'afficher
      ni l'écrire sur le disque.
- [x] **Étant donné** la configuration `gcloud` dédiée, **alors** le script ajoute Firebase au projet et crée le site
      Hosting (`hipmaster` s'il est libre), par l'API Firebase avec le jeton de cette configuration (ADR 0024).
- [x] **Étant donné** le script relancé sur une infrastructure existante, **alors** il ne casse rien et dit ce qu'il a
      fait.
- [x] Un guide d'exploitation (`docs/exploitation/`) décrit les seules étapes manuelles : créer le compte Neon
      gratuit, et autoriser les CLI (`gcloud`, `neonctl` ; `firebase` pour les opérations à la main d'US-050) par une
      connexion dans le navigateur.
- [x] Aucun secret ni adresse e-mail n'est écrit en dur dans le dépôt : ils sont passés en paramètres ou en
      variables.

## Notes

- Outil : un **script `gcloud`** idempotent suffit à cette échelle (rien à installer de plus) ; Terraform resterait
  possible plus tard. Choix noté dans l'[ADR 0024](../../decisions/0024-infrastructure-script-gcloud.md) :
  [`scripts/gcp/infrastructure.sh`](../../../scripts/gcp/infrastructure.sh), mode `--simulation` pour le plan et la
  vérification, guide dans [`docs/exploitation/`](../../exploitation/README.md).
- **PostgreSQL 18** sur Neon, et non 17 : c'est la version de PGlite (18.6) et de `docker-compose.yml`, et le projet
  Neon « HIPMaster » créé à l'inscription du porteur du projet l'utilise déjà. Neon ne change pas la version majeure
  d'un projet : la CI d'US-056 suit (ADR 0024).
- **Firebase** passe par son API REST, avec le jeton de la configuration `gcloud` vérifiée : une seule identité. La
  connexion de la CLI Firebase avait expiré (erreur 401 le 2026-10-22) ; elle ne sert plus qu'aux opérations à la
  main.
- **URL de la base** : point d'accès direct, `sslmode=verify-full` (avec postgres.js, `require` ne vérifie pas le
  certificat) et sans `channel_binding`, que `neonctl` ajoute et que postgres.js 3.4 enverrait au serveur comme un
  paramètre inconnu.
- **Droits du déploiement** : `run.admin` plutôt que `run.developer`, car rendre l'API joignable par Firebase Hosting
  (`allUsers` invocateur) demande `run.services.setIamPolicy`.
- Le nombre de projets reliables à un compte de facturation est limité : si la liaison échoue, réutiliser un projet
  existant ou demander une hausse de quota.
- Option de qualité, reportée à US-050 qui crée le job de migration : deux rôles PostgreSQL, l'un propriétaire du
  schéma pour les migrations, l'autre limité aux lectures et écritures pour l'API. Sur Neon, un rôle créé par l'API
  hérite de `neon_superuser` : le rôle limité devra être créé en SQL.
- Le service Cloud Run et le job de migration sont créés par le premier déploiement (US-050).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0021).
- 2026-10-22 — revue pour une infrastructure gratuite (Neon au lieu de Cloud SQL), à la demande du porteur du projet.
- 2026-10-22 — en cours : script `scripts/gcp/infrastructure.sh`, guide d'exploitation et ADR 0024 ; simulation sur le
  compte personnel (rien d'écrit) ; projet Neon « HIPMaster » (PostgreSQL 18) trouvé, créé à l'inscription.
- 2026-10-22 — infrastructure créée sur le compte personnel, avec l'accord du porteur du projet (PostgreSQL 18 retenu) :
  projet `hipmaster` (n° 307763122401) relié à la facturation, dépôt `images`, bucket `hipmaster-sauvegardes`,
  comptes `hipmaster-api` et `hipmaster-deploiement`, pool `github` et fournisseur `github-actions`, secret
  `database-url`, budget de 1 EUR, Firebase et site `hipmaster` ; projet Neon « HIPMaster » réutilisé, calcul fixé à
  0,25 CU, rôle et base `hipmaster`. La première exécution s'est arrêtée à l'étape 5 : Artifact Registry, tout juste
  activé, avait créé le dépôt malgré une erreur. « Existe déjà » vaut désormais succès lors d'un nouvel essai, et la
  relance a repris là. Chaque ressource relue ; connexion vérifiée avec postgres.js depuis le secret, sans l'afficher
  (PostgreSQL 18.6, `verify-full`).
- 2026-10-22 — idempotence : la première relance a remis à la cible le fournisseur WIF déjà conforme (la variable
  attendue, en lecture seule, n'arrivait pas à la vérification) ; corrigé. Relance suivante : 0 créé, 0 modifié,
  29 déjà en place, URL du secret à jour ; configuration `gcloud` active du poste inchangée à chaque passage.
- 2026-10-22 — livrée : infrastructure Google Cloud, Firebase et Neon créée par scripts/gcp/infrastructure.sh (idempotent, --simulation), relancée sans écart ; guide d'exploitation ; ADR 0024 (script plutôt que Terraform, PostgreSQL 18, Firebase par son API REST)
