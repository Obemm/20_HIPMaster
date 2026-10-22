# 0028 — Déploiement continu : révision vérifiée avant la bascule, front publié par l'API REST de Firebase

- **Date** : 2026-10-23
- **Statut** : Acceptée
- **Complète** : [0021](0021-hebergement-gcp.md) (hébergement), [0023](0023-postgresql-production.md) (migrations
  avant le déploiement) et [0024](0024-infrastructure-script-gcloud.md) (infrastructure par script)
- **Référence Elis** : ADR-011 (Azure Repo et Azure DevOps comme usine logicielle) — écarté, comme dans l'ADR
  [0022](0022-depot-public.md) : GitHub Actions ; ADR-039 (quality gate) — retenu : rien ne part en production sans
  une CI verte ; ADR-032 (ConfigCat, déploiements progressifs) — écarté : une révision vérifiée, puis basculée en
  entier ; ADR-033 (assistants de code IA) — retenu : ni clé ni secret dans le dépôt, les journaux ou les échanges

## Contexte

L'ADR 0021 met le front sur Firebase Hosting et l'API sur Cloud Run, déployés par GitHub Actions après la CI, sans
clé (Workload Identity Federation). L'ADR 0023 impose d'exécuter les migrations dans un Cloud Run Job avant
d'envoyer le trafic à la nouvelle version. L'ADR 0024 laisse au premier déploiement la création du service et du job.
US-049 a créé le reste : dépôt d'images, secrets, comptes de service, et un jeton Google délivré à la seule branche
`main`.

Contraintes relevées par US-050 :

- **une instance au plus** tant que les parties contre le bot vivent en mémoire (ADR 0014) : pas de déploiement
  progressif possible ;
- une étape en échec ne doit pas toucher la version en ligne ;
- une CSP stricte (`script-src 'self'; style-src 'self'`, sans `unsafe-inline`) bloque le CSS critique qu'Angular
  insère dans `index.html` : site sans styles, vérifié le 2026-10-22 ;
- la connexion de la CLI Firebase du poste expire (constaté le 2026-10-22), et c'est une seconde identité, que les
  vérifications de la configuration `gcloud` ne couvrent pas ;
- le dépôt est public (ADR 0022) : aucune clé, aucun secret.

## Décision

- **Déclenchement** : le workflow `deploy.yml` démarre à la fin de la CI (`workflow_run`), seulement si elle a réussi
  sur un push sur `main` de ce dépôt. Il extrait le commit que la CI a vérifié. Un déploiement à la fois, jamais
  interrompu (`concurrency` sans annulation) ; environnement GitHub `production`.
- **Un seul script, deux usages** : `scripts/gcp/deployer.sh` décrit chaque étape (`prerequis`, `image`,
  `migrations`, `revision`, `sante`, `trafic`, `front`, `site`). Le workflow en lance une par étape GitHub ; un
  poste lance les mêmes, avec la configuration `gcloud` dédiée, compte et projet vérifiés. Rien ne devient public
  sans l'option `--public`, que seul le workflow passe.
- **Prérequis** : avant toute écriture, les secrets de l'API doivent exister, avec une version active. Le compte de
  déploiement n'en lit que les métadonnées (`roles/secretmanager.viewer`, ajouté au script d'infrastructure). Un
  secret absent (comme `cle-codes-recuperation`, tant qu'US-047 ne l'a pas créé) arrête tout avec un message clair.
- **Image** : construite depuis le Dockerfile d'US-046, étiquetée par le SHA du commit, poussée sans attestation, et
  pas reconstruite si elle existe déjà (reprise d'un déploiement). Sur un poste, la configuration Docker reste
  intacte : `gcloud` fournit les identifiants à une configuration temporaire.
- **Migrations** : le job `hipmaster-migrations` reçoit l'image et la configuration de l'API (compte, secrets), seule
  la commande change ; il est exécuté jusqu'au bout. En cas d'échec, le déploiement s'arrête.
- **API** : nouvelle révision **sans trafic**, étiquetée `essai`. Sa sonde `/api/v1/sante` est appelée par sa propre
  adresse, puis tout le trafic bascule. La révision qui servait reçoit l'étiquette `precedente` : le retour arrière
  tient en une commande. Réglages : `europe-west3`, compte `hipmaster-api`, 1 vCPU, 512 Mio, 0 à 1 instance,
  accélération au démarrage, processeur alloué pendant les requêtes seulement, `DATABASE_URL` et
  `CLE_CODES_RECUPERATION` tirés de Secret Manager, `GOOGLE_CLOUD_PROJECT`. Le premier déploiement crée le service,
  sans révision précédente à protéger.
- **Front** : le build Angular est publié par l'**API REST de Firebase Hosting** (`scripts/gcp/publier-front.ts`),
  avec le jeton `gcloud` du compte de déploiement, sans CLI Firebase ni clé. `firebase.json` fait foi : le script le
  traduit, et refuse ce qu'il ne sait pas traduire plutôt que de l'oublier. Une dernière étape vérifie le site public
  : CSP, cache, bundle servi, et `/api` relayé vers Cloud Run.
- **`firebase.json`** : en-têtes de sécurité sur toutes les réponses ; `no-cache` partout sauf sous `/api`, où l'API
  garde la main (`no-store` d'US-047, cache public d'US-057) ; illustrations gardées un jour ; fichiers à empreinte
  `immutable`. `/api/**` est réécrit vers `hipmaster-api`, le reste vers `index.html`.
- **CSP vérifiée par les parcours e2e** : la CI les lance sur le build de production, servi par un petit serveur local
  qui applique `firebase.json` comme Hosting. Chaque violation de CSP que le navigateur signale y est consignée, et
  une seule fait échouer la série. Le build de production désactive l'insertion du CSS critique
  (`inlineCritical: false`).

## Alternatives envisagées

- **Job de déploiement dans `ci.yml`** (`needs`, ou workflow réutilisable) : contexte plus simple, mais la CI annule
  ses exécutions en cours à chaque push (`cancel-in-progress`), y compris un déploiement à mi-chemin. Un workflow à
  part garde sa propre file, sans annulation.
- **Déploiement direct avec trafic** : Cloud Run vérifie seulement que le conteneur écoute. Une révision qui démarre
  mais répond mal recevrait le trafic. L'étiquette, la sonde puis la bascule ne coûtent qu'une commande de plus.
- **Bascule progressive** (10 %, puis 100 %) : impossible avec une seule instance et des parties en mémoire
  (ADR 0014).
- **CLI Firebase** (`firebase deploy`) : l'outil standard, qui lit `firebase.json` tel quel. Mais c'est un gros
  paquet npm de plus, et une seconde identité, dont la connexion expire sur le poste. L'API REST fait la même chose
  en 150 lignes, avec l'identité déjà vérifiée. L'action `FirebaseExtended/action-hosting-deploy` exige une clé JSON :
  écartée.
- **`pinTag`** (Hosting épingle une révision Cloud Run) : il lie le retour arrière du front à celui de l'API, et crée
  des étiquettes que seule la CLI Firebase gère. Écarté pour l'instant.
- **Émulateur Firebase pour les e2e** : il demande la CLI Firebase, et sa réécriture `run` vise le vrai service Cloud
  Run. Un serveur local d'une centaine de lignes suffit ; le comportement réel du cache est vérifié à chaque
  déploiement, par l'étape `site`.
- **Reprendre le build de la CI** plutôt que reconstruire le front : il faudrait partager des artefacts entre
  workflows. Reconstruire le même commit, avec le même `package-lock.json`, suffit.

## Conséquences

- Un merge sur `main` est en ligne quelques minutes après la CI. Un échec avant la bascule laisse l'ancienne révision
  servir. Un échec après (publication du front) laisse la nouvelle API avec l'ancien front : l'API doit rester
  compatible avec le front précédent, comme une migration avec l'API précédente (ajouter, déployer, puis retirer).
- Retour arrière en une commande chacun : `deployer.sh retour-api` rend le trafic à la révision `precedente`, dont
  l'image est encore gardée (Artifact Registry en garde 2) ; `deployer.sh --public retour-front` republie la version
  précédente du front. Plus loin en arrière, on redéploie un ancien commit en relançant son exécution du workflow.
- Chaque déploiement efface les parties contre le bot en cours, jusqu'à US-052 (ADR 0014).
- L'adresse de la révision `essai` est joignable comme le service : c'est le code qui va servir, sans risque de plus.
- Un déploiement depuis un poste reste possible, avec le même script, mais jamais pendant que le workflow tourne.
- La CI lance les parcours e2e sur le build de production. En local, `npm run test:e2e` reste sur le serveur de
  développement, et `npm run test:e2e:production` reproduit la CI.
- `firebase.json` n'accepte que ce que `hebergement.ts` sait traduire. Ajouter des redirections, par exemple, demande
  d'abord de compléter ce module et ses tests.
- Pour les en-têtes, quand plusieurs règles correspondent, la dernière l'emporte : c'est le comportement confirmé par
  l'équipe Firebase (firebase-tools#9467), et l'étape `site` le vérifie à chaque déploiement.
