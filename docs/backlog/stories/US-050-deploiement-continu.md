# US-050 — Déploiement continu vers Cloud Run et Firebase Hosting

- **Epic** : EPIC-09
- **Statut** : En cours
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-050-deploiement-continu`

## Récit

En tant que **porteur du projet**, je veux **qu'un merge sur `main` qui passe la CI soit mis en ligne
automatiquement** afin de **livrer souvent, sans manipulation à la main ni secret sur mon poste**.

## Critères d'acceptation

- [ ] **Étant donné** un merge sur `main` dont la CI est verte, **quand** le workflow de déploiement s'exécute,
      **alors** il s'authentifie par Workload Identity Federation (US-049), construit l'image de l'API (étiquetée
      par le SHA du commit), la pousse dans Artifact Registry, **exécute le job de migration** avec cette image,
      déploie le service Cloud Run, vérifie `/api/v1/sante`, puis publie le front sur Firebase Hosting.
- [ ] **Étant donné** une migration ou une sonde de santé en échec, **alors** le déploiement s'arrête et l'ancienne
      révision continue de servir le trafic.
- [ ] **Étant donné** `firebase.json`, **alors** il publie le build Angular, relaie `/api/**` vers le service Cloud
      Run, renvoie `index.html` pour les routes Angular, sert les fichiers à empreinte avec un cache long
      (`immutable`), les illustrations avec un cache d'un jour (leur nom n'a pas encore d'empreinte, US-057) et
      `index.html` sans cache, et pose les en-têtes de sécurité : CSP, HSTS, `X-Content-Type-Options`,
      `Referrer-Policy`, `Permissions-Policy`, interdiction d'intégration en cadre.
- [ ] **Étant donné** la CSP stricte (`script-src 'self'; style-src 'self'`, sans `unsafe-inline`), **alors** le site
      s'affiche normalement : le build de production désactive l'insertion du CSS critique en ligne
      (`inlineCritical: false` dans `angular.json`), qui ajoute aujourd'hui un `<style>` et un script en ligne que
      la CSP bloquerait (site sans styles, vérifié le 2026-10-22). Aucune violation de CSP sur les parcours e2e.
- [ ] **Étant donné** un robot d'indexation, **quand** il visite le site, **alors** `robots.txt` et
      `<meta name="robots" content="noindex">` lui demandent de ne rien indexer (site réservé aux invités).
- [ ] **Étant donné** le service Cloud Run, **alors** il tourne à Francfort (`europe-west3`, près de la base Neon)
      avec le compte de service de l'API, 1 vCPU, 512 Mio, 0 instance minimum, 1 maximum tant que l'ADR 0014 tient,
      l'accélération au démarrage, et reçoit l'URL de la base par Secret Manager.
- [ ] **Étant donné** une version défectueuse en ligne, **alors** le guide d'exploitation décrit le retour arrière
      (révision Cloud Run précédente, version Firebase précédente) et il a été essayé une fois.
- [ ] La règle des migrations compatibles est écrite : une migration ne casse jamais la version encore en ligne
      (ajouter, déployer, puis retirer), puisqu'elle s'exécute avant la bascule du trafic.
- [ ] **Étant donné** le service en ligne, **quand** plus aucune requête n'arrive, **alors** la base Neon se met en
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

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0021).
- 2026-10-22 — US-046 : mesure de la veille de Neon en production reprise ici, variables attendues par l'image.
- 2026-10-23 — en cours : workflow `deploy.yml` et script `deployer.sh` (révision sans trafic, sonde, bascule),
  `firebase.json` et publication par l'API REST de Firebase (ADR 0028), CSP vérifiée par les parcours e2e sur le
  build de production (93 parcours, aucune violation ; le CSS critique en ligne en provoque 2, détectées).
