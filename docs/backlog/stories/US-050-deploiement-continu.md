# US-050 — Déploiement continu vers Cloud Run et Firebase Hosting

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-050-deploiement-continu`

## Récit

En tant que **porteur du projet**, je veux **qu'un merge sur `main` qui passe la CI soit mis en ligne
automatiquement** afin de **livrer souvent, sans manipulation à la main ni secret sur mon poste**.

## Critères d'acceptation

- [x] **Étant donné** un merge sur `main` dont la CI est verte, **quand** le workflow de déploiement s'exécute,
      **alors** il s'authentifie par Workload Identity Federation (US-049), construit l'image de l'API (étiquetée
      par le SHA du commit), la pousse dans Artifact Registry, **exécute le job de migration** avec cette image,
      déploie le service Cloud Run, vérifie `/api/v1/sante`, puis publie le front sur Firebase Hosting.
- [x] **Étant donné** une migration ou une sonde de santé en échec, **alors** le déploiement s'arrête et l'ancienne
      révision continue de servir le trafic.
- [x] **Étant donné** `firebase.json`, **alors** il publie le build Angular, relaie `/api/**` vers le service Cloud
      Run, renvoie `index.html` pour les routes Angular, sert les fichiers à empreinte avec un cache long
      (`immutable`), les illustrations avec un cache d'un jour (leur nom n'a pas encore d'empreinte, US-057) et
      `index.html` sans cache, et pose les en-têtes de sécurité : CSP, HSTS, `X-Content-Type-Options`,
      `Referrer-Policy`, `Permissions-Policy`, interdiction d'intégration en cadre.
- [x] **Étant donné** la CSP stricte (`script-src 'self'; style-src 'self'`, sans `unsafe-inline`), **alors** le site
      s'affiche normalement : le build de production désactive l'insertion du CSS critique en ligne
      (`inlineCritical: false` dans `angular.json`), qui ajoute aujourd'hui un `<style>` et un script en ligne que
      la CSP bloquerait (site sans styles, vérifié le 2026-10-22). Aucune violation de CSP sur les parcours e2e.
- [x] **Étant donné** un robot d'indexation, **quand** il visite le site, **alors** `robots.txt` et
      `<meta name="robots" content="noindex">` lui demandent de ne rien indexer (site réservé aux invités).
- [x] **Étant donné** le service Cloud Run, **alors** il tourne à Francfort (`europe-west3`, près de la base Neon)
      avec le compte de service de l'API, 1 vCPU, 512 Mio, 0 instance minimum, 1 maximum (gardé après l'ADR 0030, voir le journal),
      l'accélération au démarrage, et reçoit l'URL de la base par Secret Manager.
- [x] **Étant donné** une version défectueuse en ligne, **alors** le guide d'exploitation décrit le retour arrière
      (révision Cloud Run précédente, version Firebase précédente) et il a été essayé une fois.
- [x] La règle des migrations compatibles est écrite : une migration ne casse jamais la version encore en ligne
      (ajouter, déployer, puis retirer), puisqu'elle s'exécute avant la bascule du trafic.
- [x] **Étant donné** le service en ligne, **quand** plus aucune requête n'arrive, **alors** la base Neon se met en
      veille en moins de 10 minutes, mesuré selon la procédure d'US-046 (processeur de Cloud Run alloué pendant les
      requêtes seulement).

## Notes

- Dépend de US-046 (image de l'API, commande de migration) et de US-049 (infrastructure).
- Ce qu'attend l'image de l'API (US-046, ADR 0023) : `DATABASE_URL` (Secret Manager, point d'accès direct de Neon,
  `sslmode=require` accepté), `GOOGLE_CLOUD_PROJECT` (relie les journaux aux traces) ; `NODE_ENV=production` et `PORT`
  viennent de l'image et de Cloud Run ; `LOG_LEVEL` et `BASE_*` sont facultatifs (`.env.example`). Le job de migration
  utilise la même image avec la commande `node apps/api/src/migrer.ts`.
- La CI actuelle (`.github/workflows/ci.yml`) reste la porte d'entrée : le déploiement ne démarre qu'après elle.
- Firebase Hosting ne relaie aucun cookie sauf `__session` : l'authentification par en-tête `Authorization`
  (ADR 0017) n'est pas concernée.
- Infrastructure prête (US-049, [guide d'exploitation](../../exploitation/README.md)) :
  - authentification : fournisseur
    `projects/307763122401/locations/global/workloadIdentityPools/github/providers/github-actions`, avec le compte
    `hipmaster-deploiement@hipmaster.iam.gserviceaccount.com`. Le jeton n'est délivré qu'à `refs/heads/main` ;
  - images : `europe-west3-docker.pkg.dev/hipmaster/images`. Les pousser sans attestation
    (`--provenance=false`), sinon celle-ci compte parmi les 2 versions gardées ;
  - API et job de migration : ils tournent sous `hipmaster-api@hipmaster.iam.gserviceaccount.com`, avec le secret
    `database-url` dans `DATABASE_URL` ;
  - droit manquant : l'ajouter au script `scripts/gcp/infrastructure.sh`, pas à la main.
- Réalisation ([ADR 0028](../../decisions/0028-deploiement-continu.md), [guide](../../exploitation/README.md#déployer)) :
  - `scripts/gcp/deployer.sh` porte chaque étape, que le workflow `deploy.yml` enchaîne et qu'un poste peut lancer ;
    rien ne devient public sans `--public` ;
  - l'API passe par une révision sans trafic, étiquetée `essai` et sondée, avant la bascule ; la révision quittée
    reçoit l'étiquette `precedente`, cible de `retour-api` ;
  - le front est publié par l'API REST de Firebase Hosting (`scripts/gcp/publier-front.ts`), sans CLI Firebase ;
    `scripts/gcp/hebergement.ts` traduit `firebase.json` et sert aussi au serveur local des parcours e2e ;
  - la CI lance les parcours e2e sur le build de production, servi avec les en-têtes de `firebase.json` : chaque
    violation de la CSP est signalée au serveur local et fait échouer la série ;
  - sous `/api`, Firebase ne pose pas de `Cache-Control` : l'API garde la main (`no-store` d'US-047, cache d'US-057) ;
  - le secret `cle-codes-recuperation` (US-047) est attendu en plus de `database-url` : sans lui, le déploiement
    s'arrête avant toute écriture, avec un message clair. Le compte de déploiement lit pour cela les métadonnées des
    secrets (`roles/secretmanager.viewer`, ajouté au script d'infrastructure et appliqué le 2026-10-23) ;
  - l'API reçoit aussi `PROXYS_DE_CONFIANCE=2` (US-047 : Firebase Hosting, puis le frontal de Cloud Run) ; le job
    de migration reçoit la même configuration que le service ;
  - la sonde passe par l'adresse `run.app` de la révision `essai` : si US-047 désactive l'adresse par défaut
    (`--no-default-url`), la sonde est à revoir.
- À vérifier au premier déploiement réel (après US-047 et US-048) : jeton Workload Identity Federation, publication
  sur Firebase Hosting et en-têtes réels (étape `site`), retour arrière essayé une fois (API et front), veille de
  Neon en moins de 10 minutes.

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0021).
- 2026-10-22 — US-046 : mesure de la veille de Neon en production reprise ici, variables attendues par l'image.
- 2026-10-23 — en cours : workflow `deploy.yml` et script `deployer.sh` (révision sans trafic, sonde, bascule),
  `firebase.json` et publication par l'API REST de Firebase (ADR 0028), CSP vérifiée par les parcours e2e sur le
  build de production (93 parcours, aucune violation ; le CSS critique en ligne en provoque 2, détectées).
- 2026-10-23 — en revue : `prerequis` vérifié sur le projet (les deux secrets présents ; un secret absent arrête
  tout avant la moindre écriture) ; droit `roles/secretmanager.viewer` appliqué par `infrastructure.sh` (1 créé,
  29 déjà en place) ; image construite en local, manifeste simple sans index. Validation sur Google Cloud (image
  poussée, job de migration sur Neon, service privé sondé avec un jeton d'identité) en attente de l'accord du
  porteur du projet.
- 2026-10-24 — vérifié en production : déploiements réels réussis de bout en bout par Workload Identity Federation
  (US-051, US-059, US-065 : image, job de migration, révision « essai » sondée, bascule, front, contrôle du site) ;
  un secret absent arrête tout avant écriture, et chaque étape du workflow s'arrête au premier échec (`set -Eeuo
pipefail`, aucune étape tolérante), la révision en ligne continuant de servir. Configuration lue sur le service :
  Francfort, compte `hipmaster-api`, 1 vCPU, 512 Mio, 0 à 1 instance, processeur pendant les requêtes seulement,
  accélération au démarrage, `DATABASE_URL` et `CLE_CODES_RECUPERATION` tirés de Secret Manager. Retour arrière
  essayé une fois, aller-retour (lancé par le porteur du projet, le mode automatique de Claude Code bloquant les
  écritures sur GCP) : API vers la révision `precedente` en 32 s, front vers la publication d'avant en 42 s, site
  sain (`/api/v1/sante` 200, bundle d'avant servi), puis version du moment rétablie. Veille de Neon mesurée sur
  48 h : calcul suspendu 5 min 36 s à 6 min 20 s après la dernière requête (ex. 21:54:25 → 22:00:45). Le maximum
  d'une instance est gardé malgré l'ADR 0030 : compteurs de limitation de débit et pool de connexions par instance.
- 2026-10-24 — livrée : déploiement continu vérifié en production : chaîne complète, arrêt au premier échec, retour arrière API et front essayé (32 s et 42 s), veille de Neon en 6 min au plus
