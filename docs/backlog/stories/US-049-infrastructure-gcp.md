# US-049 — Infrastructure gratuite et reproductible

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-049-infrastructure-gcp`

## Récit

En tant que **porteur du projet**, je veux **que l'infrastructure décrite par l'ADR 0021 soit créée par un script
versionné, que Claude peut exécuter et relancer** afin de **ne rien payer, ne rien configurer à la main et pouvoir
tout recréer**.

## Critères d'acceptation

- [ ] **Étant donné** le compte Google personnel du porteur du projet, **quand** le script s'exécute, **alors** il
      utilise une configuration `gcloud` dédiée (`hipmaster`), vérifie le compte et le projet avant toute écriture, et
      ne touche jamais la configuration professionnelle du poste.
- [ ] **Étant donné** cette configuration, **alors** le script crée le projet `hipmaster` (ou le réutilise), le relie
      au compte de facturation personnel, active les API nécessaires et crée, à Francfort (`europe-west3`) :
  - un dépôt Docker **Artifact Registry** qui ne garde que les 2 dernières images ;
  - un bucket **Cloud Storage** pour les sauvegardes, qui supprime les fichiers de plus de 30 jours ;
  - le compte de service de l'API (lecture de son seul secret) ;
  - le compte de service de déploiement, relié au dépôt GitHub par **Workload Identity Federation** et limité à la
    branche `main` (aucune clé JSON créée) ;
  - un **budget** avec alerte dès 1 €.
- [ ] **Étant donné** la CLI `neonctl` autorisée par le porteur du projet, **alors** le script crée le projet Neon
      (AWS `eu-central-1`, Francfort), plafonne le calcul à 0,25 CU, crée la base et son rôle, et range l'URL de
      connexion dans **Secret Manager** sans jamais l'afficher ni l'écrire sur le disque.
- [ ] **Étant donné** la CLI Firebase connectée au compte personnel, **alors** le script ajoute Firebase au projet et
      crée le site Hosting (`hipmaster` s'il est libre).
- [ ] **Étant donné** le script relancé sur une infrastructure existante, **alors** il ne casse rien et dit ce qu'il a
      fait.
- [ ] Un guide d'exploitation (`docs/exploitation/`) décrit les seules étapes manuelles : créer le compte Neon
      gratuit, et autoriser les CLI (`gcloud`, `firebase`, `neonctl`) par une connexion dans le navigateur.
- [ ] Aucun secret ni adresse e-mail n'est écrit en dur dans le dépôt : ils sont passés en paramètres ou en
      variables.

## Notes

- Outil : un **script `gcloud`** idempotent suffit à cette échelle (rien à installer de plus) ; Terraform resterait
  possible plus tard. Choix à noter dans l'ADR de la story.
- Le nombre de projets reliables à un compte de facturation est limité : si la liaison échoue, réutiliser un projet
  existant ou demander une hausse de quota.
- Option de qualité : deux rôles PostgreSQL, l'un propriétaire du schéma pour les migrations, l'autre limité aux
  lectures et écritures pour l'API.
- Le service Cloud Run et le job de migration sont créés par le premier déploiement (US-050).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0021).
- 2026-10-22 — revue pour une infrastructure gratuite (Neon au lieu de Cloud SQL), à la demande du porteur du projet.
