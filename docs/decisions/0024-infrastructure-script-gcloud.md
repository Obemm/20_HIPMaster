# 0024 — Infrastructure décrite par un script `gcloud` idempotent plutôt que par Terraform

- **Date** : 2026-10-22
- **Statut** : Acceptée (par le porteur du projet, revue avant mise en ligne du 2026-10-22 : « l'infrastructure
  est créée par un script `gcloud` que Claude exécute »)
- **Complète** : [0021](0021-hebergement-gcp.md) (hébergement)
- **Référence Elis** : le référentiel n'a aucun ADR sur l'infrastructure décrite en code. ADR-023 (radar
  technologique) — adapté : pour un projet personnel, le choix de l'outil est justifié ici. ADR-033 (assistants de
  code IA) — retenu : aucun secret dans le dépôt, dans les journaux ni dans les échanges avec l'assistant. Page
  « Secrets must be stored in a key vault » (non opposable, à l'état TODO) — retenue comme inspiration : l'URL de la
  base vit dans Secret Manager.

## Contexte

L'ADR 0021 place HIPMaster sur un projet Google Cloud du compte personnel du porteur du projet (Cloud Run, Artifact
Registry, Secret Manager, Cloud Storage, Firebase Hosting), avec une base Neon gratuite. Le porteur du projet veut
que Claude crée et maintienne tout cela en ligne de commande, sans réglage à la main, et puisse tout recréer
(US-049).

Il y a une trentaine d'éléments à créer : projet, liaison à la facturation, API, dépôt d'images, bucket, deux comptes
de service, secret, Workload Identity Federation, droits IAM, budget, Firebase et son site, projet Neon, calcul, base,
rôle et URL de connexion.

Contraintes :

- le poste (Windows, Git Bash) a déjà `gcloud`, Node et Docker ; sa configuration `gcloud` active est
  professionnelle et ne doit **jamais** servir à ce projet (ADR 0021) ;
- le dépôt est public (ADR 0022) : aucun secret, identifiant de facturation ni adresse e-mail ne doit y entrer ;
- une partie de l'infrastructure est hors de Google Cloud (Neon) ;
- relancer l'outil ne doit rien casser, et il doit dire ce qui existait déjà.

## Décision

- **Un script bash idempotent**, [`scripts/gcp/infrastructure.sh`](../../scripts/gcp/infrastructure.sh). Pour chaque
  ressource, il lit l'état réel, crée ce qui manque, remet d'aplomb ce qui s'écarte de la cible, et l'annonce :
  « existe déjà », « créé » ou « modifié ». Le mode `--simulation` fait les mêmes lectures sans rien écrire : c'est
  le plan avant une création, et la vérification après.
- **Outils** : `gcloud` pour Google Cloud ; l'API REST de Firebase, appelée avec le jeton de ce même `gcloud` (une
  seule identité, déjà vérifiée) ; `neonctl`, dans une version figée lancée par `npx` (rien à installer).
- **Sécurité** :
  - chaque appel `gcloud` vise la configuration dédiée `hipmaster`, par variables d'environnement et par option, avec
    le compte et le projet imposés ;
  - le compte, puis la propriété du projet, sont vérifiés avant toute écriture ; à la fin, le script contrôle que la
    configuration active du poste n'a pas changé ;
  - le compte Google et le compte de facturation arrivent par l'environnement, jamais par le dépôt ;
  - l'URL de la base passe de `neonctl` à Secret Manager par des tubes : jamais affichée, écrite sur le disque ni
    journalisée.
- **Base Neon en PostgreSQL 18**, pas en 17. C'est la version de PGlite (18.6), qui sert au développement et aux
  tests (ADR 0018), et celle de `docker-compose.yml`. Neon ne change jamais la version majeure d'un projet : la CI
  d'US-056 doit utiliser PostgreSQL 18.
- **Hors du script** : le service Cloud Run et ses jobs, créés par le premier déploiement (US-050) qui en porte la
  configuration (image, révision, secret monté). La supervision et la sauvegarde de chaque nuit (US-051) s'ajoutent au
  script en nouvelles étapes : il reste la seule description de l'infrastructure.

## Alternatives envisagées

- **Terraform**, avec les fournisseurs Google et Neon : déclaratif, avec plan, détection des écarts et suppression
  de ce qui sort de la description. Écarté à cette échelle, pour quatre raisons :
  - un binaire de plus à installer et à tenir à jour ;
  - un fichier d'état, qui contiendrait le mot de passe de la base, à ranger quelque part. Un bucket demande d'exister
    avant Terraform (l'œuf et la poule). Un fichier local se perd et reste en clair sur le poste ;
  - le fournisseur Neon est maintenu par la communauté ;
  - les mêmes précautions sur la configuration `gcloud` resteraient à prendre.

  Il reste l'option naturelle si l'infrastructure grandit (préproduction `stg`, autres services) : les ressources
  existantes s'importent (`terraform import`).

- **Pulumi ou OpenTofu** : mêmes remarques que Terraform (état à stocker, outil en plus).
- **Infrastructure Manager** (Terraform géré par Google) ou **Deployment Manager** (en fin de vie) : demandent un
  compte de service et un stockage d'état côté Google, et ne couvrent pas Neon.
- **Console Google Cloud et procédure écrite** : ni reproductible ni vérifiable, contraire à l'objectif de ne rien
  configurer à la main.
- **CLI Firebase** pour Firebase : une seconde identité, avec sa propre connexion, qui avait d'ailleurs expiré le
  2026-10-22, et que la vérification de la configuration `gcloud` ne couvre pas. L'API REST, appelée avec le jeton
  déjà vérifié, fait la même chose.

## Conséquences

- Rien d'autre à installer que `gcloud`, Node (`npx`) et `curl` ; Claude peut lancer et relancer le script, et la
  simulation montre tout écart avant d'écrire.
- Sans fichier d'état, le cloud fait foi : le script relit tout à chaque passage (une à deux minutes).
- Le script ne voit que ce qu'il vérifie : il n'enlève ni un droit ajouté à la main, ni une ressource retirée du
  script. Une suppression se fait à la main, et le guide d'exploitation la décrit.
- Chaque nouvelle ressource (US-050, US-051) devient une étape du script, avec sa vérification d'existence.
- Les particularités de Git Bash sont traitées dans le script : fins de ligne `\r\n` de `gcloud`, conversion des
  chemins par MSYS, chemins Windows des fichiers temporaires.
- La version majeure de la base (PostgreSQL 18) s'impose à la CI (US-056) et aux restaurations (US-051).
