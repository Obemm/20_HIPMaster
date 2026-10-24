#!/usr/bin/env bash
# Déploiement de HIPMaster (US-050, ADR 0028) : image de l'API, migrations, API sur Cloud Run, puis front sur
# Firebase Hosting. Le workflow .github/workflows/deploy.yml en enchaîne les étapes après chaque CI verte sur main ;
# les mêmes étapes se lancent depuis un poste, avec la configuration gcloud dédiée.
# Guide d'exploitation : docs/exploitation/README.md.
#
# Usage, depuis la racine du dépôt (Git Bash sous Windows, ou bash 4 et plus) :
#
#   HIPMASTER_COMPTE=<compte Google> bash scripts/gcp/deployer.sh [--public] <étape>…
#
# Étapes du déploiement, dans l'ordre :
#   prerequis   les secrets de l'API existent dans Secret Manager, avec une version active
#   image       image de l'API construite et poussée, étiquetée par le commit (rien à faire si elle existe déjà)
#   migrations  job hipmaster-migrations mis à jour avec cette image, puis exécuté jusqu'au bout
#   revision    nouvelle révision du service hipmaster-api, sans trafic, étiquetée « essai »
#   sante       /api/v1/sante répond sur la révision « essai »
#   trafic      tout le trafic passe à la révision « essai » ; celle qui servait reçoit l'étiquette « precedente »
#   front       front publié sur Firebase Hosting (--public)
#   site        le site public sert ce front, avec ses en-têtes, et relaie /api vers Cloud Run (--public)
#   exploitation  image des jobs d'exploitation (construite seulement si ses sources ont changé), puis jobs
#               hipmaster-sauvegarde et hipmaster-consommation mis à jour (US-051, ADR 0033)
#   purge       job hipmaster-purge mis à jour avec l'image de l'API (US-054, ADR 0035) ; le workflow ne fait que le
#               tenir à jour, seul un poste le crée (décision du porteur du projet, voir le guide d'exploitation)
#
# Exploitation :
#   etat                     trafic et révisions de l'API, dernières publications du front
#   retour-api [révision]    tout le trafic à une révision ; par défaut, celle étiquetée « precedente »
#   retour-front [version]   republie une version du front ; par défaut, celle d'avant la publication en cours
#                            (--public)
#
# Options :
#   --public   l'API devient invocable par tous (allUsers), ce qu'exige la réécriture de Firebase Hosting, et le
#              front peut être publié. Sans elle, rien ne devient public : un nouveau service naît privé, les droits
#              d'un service existant ne changent pas, et la sonde de santé présente un jeton d'identité.
#
# Paramètres (environnement) :
#   HIPMASTER_COMPTE   sur un poste, le compte Google personnel (jamais écrit dans le dépôt)
#   HIPMASTER_COMMIT   commit déployé, qui étiquette l'image ; par défaut, celui du dépôt (git rev-parse HEAD)
#   HIPMASTER_SECRETS  secrets de l'API, VARIABLE=secret séparés par des virgules ; par défaut
#                      DATABASE_URL=database-url,CLE_CODES_RECUPERATION=cle-codes-recuperation
#   HIPMASTER_ADMINISTRATEURS
#                      identifiants de joueur des administrateurs (page « Inviter », US-072, ADR 0029), séparés par
#                      des espaces ou des virgules ; vide : personne. Dans GitHub Actions, la variable du dépôt du
#                      même nom. Les étapes migrations et revision la posent sur l'API : un déploiement sans elle
#                      retire les administrateurs.
#
# Sécurité : sur un poste, chaque appel gcloud vise la configuration dédiée « hipmaster », compte et projet vérifiés
# avant toute écriture, et la configuration active du poste ne change pas (contrôlé à la fin) ; dans GitHub Actions,
# l'identité vient de Workload Identity Federation, sans clé. Les jetons passent par des tubes, jamais par une ligne
# de commande ni par le disque.

set -Eeuo pipefail

if ((BASH_VERSINFO[0] < 4)); then
  echo "Bash 4 ou plus est nécessaire (Git Bash sous Windows convient)." >&2
  exit 2
fi

readonly PROJET=hipmaster
readonly REGION=europe-west3
readonly CONFIGURATION=hipmaster
readonly SITE=hipmaster
readonly SERVICE=hipmaster-api
readonly JOB=hipmaster-migrations
# Jobs d'exploitation (US-051, ADR 0033), déclenchés par Cloud Scheduler (scripts/gcp/infrastructure.sh).
readonly JOB_SAUVEGARDE=hipmaster-sauvegarde
readonly JOB_CONSOMMATION=hipmaster-consommation
readonly COMPTE_SAUVEGARDE=hipmaster-sauvegarde@$PROJET.iam.gserviceaccount.com
readonly COMPTE_CONSOMMATION=hipmaster-consommation@$PROJET.iam.gserviceaccount.com
# Purge de chaque nuit (US-054, ADR 0035), déclenchée par Cloud Scheduler (scripts/gcp/infrastructure.sh).
readonly JOB_PURGE=hipmaster-purge
readonly COMPTE_PURGE=hipmaster-purge@$PROJET.iam.gserviceaccount.com
readonly BUCKET=hipmaster-sauvegardes
# Projet Neon suivi par le relevé de consommation : sa clé, limitée au projet, ne peut pas lister les projets.
readonly NEON_PROJET=lingering-firefly-04102994
readonly SOURCES_EXPLOITATION=scripts/exploitation
readonly COMPTE_API=hipmaster-api@$PROJET.iam.gserviceaccount.com
readonly REGISTRE=$REGION-docker.pkg.dev/$PROJET/images
readonly ESSAI=essai
readonly PRECEDENTE=precedente
readonly FIREBASE=https://firebasehosting.googleapis.com/v1beta1
readonly BUILD_FRONT=apps/web/dist/web/browser
# Variables de l'API, hors secrets : projet pour relier journaux et traces (US-046) ; deux relais devant l'API,
# Firebase Hosting puis le frontal de Cloud Run, sans quoi elle refuse de démarrer (US-047, ADR 0025).
readonly VARIABLES=GOOGLE_CLOUD_PROJECT=$PROJET,PROXYS_DE_CONFIANCE=2
readonly -a ETAPES_CONNUES=(prerequis image migrations revision sante trafic front site exploitation purge etat
  retour-api retour-front)

GITHUB=0
if [[ ${GITHUB_ACTIONS:-} == true ]]; then GITHUB=1; fi
PUBLIC=0
ETAPES=()
COMPTE=${HIPMASTER_COMPTE:-}
COMMIT=${HIPMASTER_COMMIT:-}
ADMINISTRATEURS=${HIPMASTER_ADMINISTRATEURS:-}
IFS=, read -r -a SECRETS <<<"${HIPMASTER_SECRETS:-DATABASE_URL=database-url,CLE_CODES_RECUPERATION=cle-codes-recuperation}"
ACTIVE_AVANT=''

TEMPORAIRE=$(mktemp -d)
trap 'rm -rf "$TEMPORAIRE"' EXIT

# --- Affichage --------------------------------------------------------------------------------------

titre() { printf '\n== %s\n' "$*"; }
info() { printf '   %s\n' "$*"; }

# arret <message> : arrête tout, avec une annotation d'erreur dans GitHub Actions.
arret() {
  if ((GITHUB)); then printf '::error title=Déploiement arrêté::%s\n' "$*"; fi
  printf '\nARRÊT : %s\n' "$*" >&2
  exit 1
}

echec() {
  # Une commande qui échoue dans un sous-shell déclencherait le message deux fois.
  if ((BASH_SUBSHELL == 0)); then
    printf '\nÉchec à la ligne %s : voir le message juste au-dessus. Les étapes déjà faites le restent ; une étape relancée reprend proprement.\n' "$1" >&2
  fi
}
trap 'echec $LINENO' ERR

aide() { awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; }

# --- Outils -----------------------------------------------------------------------------------------

# gcloud : sur un poste, la configuration dédiée (et, sous Windows, sans les \r de fin de ligne) ; dans GitHub
# Actions, l'identité posée par google-github-actions/auth.
gc() {
  if ((GITHUB)); then
    gcloud "$@"
  else
    gcloud --configuration="$CONFIGURATION" "$@" | tr -d '\r'
  fi
}

# json <expression> : évalue une expression JavaScript sur le JSON lu en entrée (variable j).
json() {
  node -e '
    let texte = "";
    process.stdin.on("data", (d) => (texte += d));
    process.stdin.on("end", () => {
      let j;
      try {
        j = JSON.parse(texte);
      } catch {
        process.exit(1);
      }
      const valeur = new Function("j", `return (${process.argv[1]});`)(j);
      if (valeur !== undefined && valeur !== null && valeur !== "") {
        console.log(typeof valeur === "object" ? JSON.stringify(valeur) : String(valeur));
      }
    });
  ' "$1"
}

# chemin_natif <chemin> : chemin lisible par un programme Windows (C:/… plutôt que /tmp/…).
chemin_natif() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

# Nom de la configuration gcloud active du poste, lu dans son fichier : seulement pour vérifier, à la fin, que le
# script ne l'a pas changé.
configuration_active_du_poste() {
  local dossier
  dossier=$(gc info --format='value(config.paths.global_config_dir)' 2>/dev/null) || return 0
  if command -v cygpath >/dev/null 2>&1; then dossier=$(cygpath -u "$dossier"); fi
  cat "$dossier/active_config" 2>/dev/null || true
}

jeton_acces() { gc auth print-access-token; }

# appel_firebase <méthode> <url> [corps] : API REST de Firebase Hosting ; le jeton passe par l'entrée standard de
# curl. Affiche la réponse ; s'arrête sur une erreur HTTP.
appel_firebase() {
  local methode=$1 url=$2 corps=${3:-} jeton reponse code
  local -a options=(-sS -X "$methode" -H @- -H "x-goog-user-project: $PROJET" -w '\n%{http_code}')
  # Le corps passe par un fichier : sous Windows, un argument de curl perd ses lettres accentuées (US-051).
  if [[ -n $corps ]]; then
    printf '%s' "$corps" >"$TEMPORAIRE/corps.json"
    options+=(-H 'Content-Type: application/json' --data-binary "@$(chemin_natif "$TEMPORAIRE/corps.json")")
  fi
  jeton=$(jeton_acces)
  reponse=$(printf 'Authorization: Bearer %s\n' "$jeton" | curl "${options[@]}" "$url")
  code=${reponse##*$'\n'}
  if [[ $code != 2* ]]; then
    printf '%s\n' "${reponse%$'\n'*}" >&2
    arret "Firebase Hosting a répondu $code à $methode $url."
  fi
  printf '%s\n' "${reponse%$'\n'*}"
}

# --secrets de gcloud : VARIABLE=secret:latest, séparés par des virgules.
liste_secrets() {
  local paire
  local -a liste=()
  for paire in "${SECRETS[@]}"; do liste+=("${paire%%=*}=${paire#*=}:latest"); done
  local IFS=,
  printf '%s' "${liste[*]}"
}

# --set-env-vars de gcloud : les variables de l'API, et ses administrateurs s'il y en a. Ceux-ci y sont séparés par
# des espaces, la virgule séparant les variables pour gcloud.
variables_api() {
  printf '%s' "$VARIABLES"
  if [[ -n $ADMINISTRATEURS ]]; then printf ',ADMINISTRATEURS=%s' "$ADMINISTRATEURS"; fi
}

service_json() { gc run services describe "$SERVICE" --project="$PROJET" --region="$REGION" --format=json; }

service_existe() {
  gc run services describe "$SERVICE" --project="$PROJET" --region="$REGION" --format='value(metadata.name)' \
    >/dev/null 2>&1
}

# revision_etiquetee <étiquette> / adresse_etiquette <étiquette> : révision et adresse portant cette étiquette.
revision_etiquetee() {
  service_json | ETIQUETTE=$1 json '((j.status.traffic || []).find((t) => t.tag === process.env.ETIQUETTE) || {}).revisionName'
}
adresse_etiquette() {
  service_json | ETIQUETTE=$1 json '((j.status.traffic || []).find((t) => t.tag === process.env.ETIQUETTE) || {}).url'
}

# Révision qui reçoit aujourd'hui le trafic (la plus grande part).
revision_servante() {
  if ! service_existe; then return 0; fi
  service_json | json '(j.status.traffic || []).filter((t) => t.percent > 0).sort((a, b) => b.percent - a.percent).map((t) => t.revisionName)[0]'
}

exiger_public() {
  ((PUBLIC)) || arret "l'étape « $1 » rend le site public : elle exige l'option --public."
}

# --- Vérifications ----------------------------------------------------------------------------------

verifier_outils() {
  local outil
  for outil in gcloud node curl git; do
    command -v "$outil" >/dev/null 2>&1 || arret "outil introuvable : $outil."
  done
}

# Sur un poste : toute commande gcloud vise la configuration, le compte et le projet de HIPMaster, vérifiés avant
# toute écriture, quelle que soit la configuration active du poste.
verifier_identite() {
  if ((GITHUB)); then
    export CLOUDSDK_CORE_PROJECT=$PROJET CLOUDSDK_CORE_DISABLE_PROMPTS=1
    info "identité : Workload Identity Federation (GitHub Actions), projet $PROJET"
    return 0
  fi
  [[ $COMPTE =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] ||
    arret "HIPMASTER_COMPTE doit contenir l'adresse du compte Google personnel (voir le guide d'exploitation)."
  export CLOUDSDK_ACTIVE_CONFIG_NAME=$CONFIGURATION CLOUDSDK_CORE_ACCOUNT=$COMPTE \
    CLOUDSDK_CORE_PROJECT=$PROJET CLOUDSDK_CORE_DISABLE_PROMPTS=1
  ACTIVE_AVANT=$(configuration_active_du_poste)
  local comptes compte projet
  comptes=$(gc auth list --format='value(account)' 2>/dev/null || true)
  grep -qxF "$COMPTE" <<<"$comptes" ||
    arret "le compte $COMPTE n'est pas connecté à gcloud : gcloud auth login $COMPTE."
  compte=$(gc config get-value core/account 2>/dev/null)
  projet=$(gc config get-value core/project 2>/dev/null)
  [[ $compte == "$COMPTE" && $projet == "$PROJET" ]] ||
    arret "gcloud viserait le compte « $compte » et le projet « $projet » : rien n'est fait."
  gc projects describe "$PROJET" --format='value(projectId)' >/dev/null 2>&1 ||
    arret "la connexion de $COMPTE à gcloud a expiré, ou le projet $PROJET est inaccessible : gcloud auth login $COMPTE."
  info "vérifié : compte $COMPTE, projet $PROJET ; la configuration active du poste (« ${ACTIVE_AVANT:-?} ») n'est pas utilisée"
}

verifier_commit() {
  if [[ -z $COMMIT ]]; then COMMIT=$(git rev-parse HEAD); fi
  [[ $COMMIT =~ ^[0-9a-f]{40}$ ]] || arret "HIPMASTER_COMMIT doit être un SHA complet de commit : « $COMMIT »."
  IMAGE=$REGISTRE/api:$COMMIT
}

# Identifiants de joueur (UUID), séparés par des espaces ou des virgules : vérifiés avant toute étape (l'API refuserait
# de démarrer avec une valeur invalide), puis gardés séparés par des espaces.
verifier_administrateurs() {
  local id
  local -a ids
  read -r -a ids <<<"${ADMINISTRATEURS//,/ }"
  for id in "${ids[@]}"; do
    [[ $id =~ ^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$ ]] ||
      arret "HIPMASTER_ADMINISTRATEURS : « $id » n'est pas un identifiant de joueur (voir le guide d'exploitation, « Administrateurs »)."
  done
  ADMINISTRATEURS="${ids[*]}"
}

# --- Étapes du déploiement --------------------------------------------------------------------------

etape_prerequis() {
  titre "Prérequis : secrets de l'API dans Secret Manager"
  local paire variable secret etat
  for paire in "${SECRETS[@]}"; do
    variable=${paire%%=*}
    secret=${paire#*=}
    if ! etat=$(gc secrets versions describe latest --secret="$secret" --project="$PROJET" \
      --format='value(state)' 2>"$TEMPORAIRE/secret.err"); then
      if grep -q PERMISSION_DENIED "$TEMPORAIRE/secret.err"; then
        arret "le déploiement ne peut pas lire les métadonnées du secret « $secret » : relancer scripts/gcp/infrastructure.sh (droit roles/secretmanager.viewer du compte de déploiement). Rien n'a été déployé."
      fi
      etat=''
    fi
    [[ $etat == ENABLED ]] ||
      arret "le secret « $secret » (variable $variable de l'API) manque dans Secret Manager, ou n'a aucune version active : le créer avec scripts/gcp/infrastructure.sh (voir le guide d'exploitation), puis relancer le déploiement. Rien n'a été déployé : l'API en ligne continue de servir."
    info "$variable ← secret $secret (version active)"
  done
}

etape_image() {
  titre "Image de l'API : $IMAGE"
  if gc artifacts docker images describe "$IMAGE" --format='value(image_summary.digest)' >/dev/null 2>&1; then
    info "déjà dans Artifact Registry : rien à construire"
    return 0
  fi
  if ((!GITHUB)) && [[ -n $(git status --porcelain -- Dockerfile .dockerignore package.json package-lock.json \
    apps/api packages/domain) ]]; then
    arret "des sources de l'image ont des modifications non commitées : l'image ne correspondrait pas au commit $COMMIT."
  fi
  docker info >/dev/null 2>&1 || arret "Docker ne répond pas : le démarrer (Docker Desktop sur un poste), puis relancer."
  # Image simple, sans attestation : sinon celle-ci compterait parmi les 2 versions que garde le dépôt (US-049).
  docker build --provenance=false --sbom=false --label "org.opencontainers.image.revision=$COMMIT" \
    --tag "$IMAGE" .
  pousser_image "$IMAGE"
  info "poussée dans Artifact Registry"
}

# pousser_image <image> : docker push avec gcloud pour fournir les identifiants, dans une configuration Docker
# temporaire : celle du poste n'est jamais modifiée (gcloud auth configure-docker l'aurait fait), et aucun jeton n'est
# écrit sur le disque.
pousser_image() {
  local image=$1 hote configuration=$TEMPORAIRE/docker
  hote=$(docker context inspect --format '{{.Endpoints.docker.Host}}')
  mkdir -p "$configuration"
  printf '{ "credHelpers": { "%s": "gcloud" } }\n' "$REGION-docker.pkg.dev" >"$configuration/config.json"
  DOCKER_CONFIG=$(chemin_natif "$configuration") DOCKER_HOST=$hote docker push "$image"
}

# Même image, même compte et même configuration que l'API, seule la commande change (ADR 0023) : la migration n'en
# lit qu'une partie, mais une configuration vérifiée plus strictement demain ne la casserait pas.
etape_migrations() {
  titre "Migrations : job $JOB, image du commit ${COMMIT:0:7}"
  info "en cas d'échec, le déploiement s'arrête ici : l'API en ligne n'a pas changé"
  gc run jobs deploy "$JOB" --project="$PROJET" --region="$REGION" --image="$IMAGE" \
    --service-account="$COMPTE_API" --set-secrets="$(liste_secrets)" \
    --set-env-vars="$(variables_api)" --command=node --args=apps/api/src/migrer.ts \
    --tasks=1 --max-retries=1 --task-timeout=5m --cpu=1 --memory=512Mi --labels=application=hipmaster
  gc run jobs execute "$JOB" --project="$PROJET" --region="$REGION" --wait
}

etape_revision() {
  titre "API : nouvelle révision de $SERVICE ($REGION), étiquetée « $ESSAI »"
  # 1 instance au plus tant que les parties contre le bot vivent en mémoire (ADR 0014) ; processeur alloué
  # pendant les requêtes seulement, pour que la base Neon puisse se mettre en veille (ADR 0021, 0023).
  local -a options=(--project="$PROJET" --region="$REGION" --image="$IMAGE" --service-account="$COMPTE_API"
    --cpu=1 --memory=512Mi --min-instances=0 --max-instances=1 --cpu-boost --cpu-throttling
    --set-secrets="$(liste_secrets)" --set-env-vars="$(variables_api)"
    --labels=application=hipmaster --tag="$ESSAI")
  if [[ -n $ADMINISTRATEURS ]]; then
    local -a ids
    read -r -a ids <<<"$ADMINISTRATEURS"
    info "administrateurs (page « Inviter ») : ${#ids[@]} compte(s)"
  else
    info "aucun administrateur : la page « Inviter » n'est ouverte à personne (HIPMASTER_ADMINISTRATEURS vide)"
  fi
  if service_existe; then
    options+=(--no-traffic)
    info "sans trafic : la révision actuelle continue de servir jusqu'à la bascule"
  else
    info "premier déploiement : le service naît avec cette révision"
    if ((!PUBLIC)); then options+=(--no-allow-unauthenticated); fi
  fi
  if ((PUBLIC)); then
    options+=(--allow-unauthenticated)
    info "invocable par tous (allUsers), comme l'exige la réécriture de Firebase Hosting"
  fi
  gc run deploy "$SERVICE" "${options[@]}"
}

# Service privé (sans --public) : la sonde présente le jeton d'identité du compte gcloud.
appel_sante() {
  if ((PUBLIC)); then
    curl -fsS --max-time 20 "$1"
  else
    printf 'Authorization: Bearer %s\n' "$(gc auth print-identity-token)" | curl -fsS --max-time 20 -H @- "$1"
  fi
}

etape_sante() {
  local url reponse essai
  url=$(adresse_etiquette "$ESSAI")
  [[ -n $url ]] || arret "aucune révision n'est étiquetée « $ESSAI » : lancer d'abord l'étape revision."
  titre "Santé de la révision « $ESSAI » : $url/api/v1/sante"
  for essai in 1 2 3 4 5 6; do
    if reponse=$(appel_sante "$url/api/v1/sante" 2>&1) && [[ $reponse == *'"statut":"ok"'* ]]; then
      info "réponse : $reponse"
      return 0
    fi
    info "essai $essai sur 6 : ${reponse:-pas de réponse}"
    if ((essai < 6)); then sleep 10; fi
  done
  arret "la révision « $ESSAI » ne répond pas sur /api/v1/sante : le trafic reste sur la révision actuelle. Journaux : gcloud logging read 'resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE\"' --limit=50 --configuration=$CONFIGURATION."
}

etape_trafic() {
  local nouvelle actuelle
  nouvelle=$(revision_etiquetee "$ESSAI")
  [[ -n $nouvelle ]] || arret "aucune révision n'est étiquetée « $ESSAI » : lancer d'abord l'étape revision."
  actuelle=$(revision_servante)
  titre "Bascule du trafic : $nouvelle${actuelle:+ (au lieu de $actuelle)}"
  local -a etiquettes=()
  if [[ -n $actuelle && $actuelle != "$nouvelle" ]]; then
    etiquettes=(--update-tags="$PRECEDENTE=$actuelle")
    info "$actuelle reçoit l'étiquette « $PRECEDENTE » : retour arrière par « deployer.sh retour-api »"
  fi
  gc run services update-traffic "$SERVICE" --project="$PROJET" --region="$REGION" \
    --to-revisions="$nouvelle=100" "${etiquettes[@]}"
}

etape_front() {
  exiger_public front
  titre "Front : publication sur Firebase Hosting (site $SITE)"
  [[ -f $BUILD_FRONT/index.html ]] || arret "le front n'est pas construit : npm run build, puis relancer."
  jeton_acces | node scripts/gcp/publier-front.ts --commit "$COMMIT"
}

# verifier_site : une passe de vérification du site public ; renvoie une erreur décrite sur la sortie standard.
verifier_site() {
  local url=https://$SITE.web.app attendu servi entetes sante
  entetes=$(curl -fsS -D - -o "$TEMPORAIRE/index.html" "$url/") || {
    echo "$url/ ne répond pas"
    return 1
  }
  grep -qi "^content-security-policy: .*script-src 'self'" <<<"$entetes" || {
    echo "la page d'accueil n'a pas sa CSP"
    return 1
  }
  grep -qi '^cache-control: no-cache' <<<"$entetes" || {
    echo "la page d'accueil n'a pas « Cache-Control: no-cache »"
    return 1
  }
  attendu=$(grep -o 'main-[0-9A-Z]*\.js' "$BUILD_FRONT/index.html")
  servi=$(grep -o 'main-[0-9A-Z]*\.js' "$TEMPORAIRE/index.html" || true)
  [[ $servi == "$attendu" ]] || {
    echo "le site sert ${servi:-autre chose} au lieu de $attendu"
    return 1
  }
  curl -fsS -I "$url/$attendu" | grep -qi '^cache-control: .*immutable' || {
    echo "$attendu n'est pas servi avec un cache immuable"
    return 1
  }
  sante=$(curl -fsS "$url/api/v1/sante") && [[ $sante == *'"statut":"ok"'* ]] || {
    echo "/api/v1/sante ne répond pas à travers Firebase Hosting (réécriture vers Cloud Run, accès public ?)"
    return 1
  }
  echo "CSP et cache en place, $attendu servi, /api/v1/sante relayé vers Cloud Run"
}

etape_site() {
  exiger_public site
  titre "Site en ligne : https://$SITE.web.app"
  local essai bilan
  for essai in 1 2 3; do
    if bilan=$(verifier_site); then
      info "$bilan"
      return 0
    fi
    info "essai $essai sur 3 : $bilan"
    if ((essai < 3)); then sleep 10; fi
  done
  arret "le site public ne répond pas comme prévu ($bilan). Retour arrière possible : deployer.sh --public retour-front, et deployer.sh retour-api."
}

# Jobs d'exploitation (US-051, ADR 0033). Leur image est étiquetée par l'empreinte Git de ses sources : elle n'est
# reconstruite que lorsqu'elles changent, et la règle du dépôt (2 dernières versions de chaque image) ne la purge donc
# pas tant qu'elle sert. Chaque job tourne sous son propre compte de service (scripts/gcp/infrastructure.sh).
etape_exploitation() {
  local arbre image
  arbre=$(git rev-parse "$COMMIT:$SOURCES_EXPLOITATION")
  image=$REGISTRE/exploitation:${arbre:0:12}
  titre "Exploitation : image $image, jobs $JOB_SAUVEGARDE et $JOB_CONSOMMATION"
  if gc artifacts docker images describe "$image" --format='value(image_summary.digest)' >/dev/null 2>&1; then
    info "image déjà dans Artifact Registry : rien à construire"
  else
    if ((!GITHUB)) && [[ -n $(git status --porcelain -- "$SOURCES_EXPLOITATION") ]]; then
      arret "les sources de l'image d'exploitation ont des modifications non commitées."
    fi
    docker info >/dev/null 2>&1 || arret "Docker ne répond pas : le démarrer (Docker Desktop sur un poste), puis relancer."
    docker build --provenance=false --sbom=false --label "org.opencontainers.image.revision=$COMMIT"       --tag "$image" "$SOURCES_EXPLOITATION"
    pousser_image "$image"
    info "poussée dans Artifact Registry"
  fi
  local -a communes=(--project="$PROJET" --region="$REGION" --image="$image" --tasks=1 --max-retries=0
    --cpu=1 --memory=512Mi --labels=application=hipmaster --command=node)
  # Sauvegarde : la base (secret database-url) et le droit d'ajouter des objets au bucket, rien d'autre. Un échec
  # n'est pas relancé par Cloud Run : le script réessaie lui-même la connexion, puis l'échec part en alerte.
  gc run jobs deploy "$JOB_SAUVEGARDE" "${communes[@]}" --service-account="$COMPTE_SAUVEGARDE"     --set-secrets=DATABASE_URL=database-url:latest --set-env-vars=BUCKET=$BUCKET     --args=sauvegarder.ts --task-timeout=15m
  # Consommation : la clé de l'API Neon limitée au projet ; jamais la base, qui resterait éveillée.
  gc run jobs deploy "$JOB_CONSOMMATION" "${communes[@]}" --service-account="$COMPTE_CONSOMMATION"     --set-secrets=NEON_CLE_API=neon-cle-api:latest --set-env-vars=NEON_PROJET=$NEON_PROJET     --args=consommation.ts --task-timeout=2m
}

# Purge de chaque nuit (US-054, ADR 0035) : la commande `purger.ts` de l'image de l'API, pour que son code suive le
# schéma. Son compte ne lit que l'URL de la base. Le workflow tient le job à jour à chaque déploiement, mais ne le crée
# jamais : sa création, depuis un poste, est une décision du porteur du projet (guide d'exploitation).
etape_purge() {
  titre "Purge : job $JOB_PURGE, image du commit ${COMMIT:0:7}"
  if ! gc run jobs describe "$JOB_PURGE" --project="$PROJET" --region="$REGION" >/dev/null 2>&1; then
    if ((GITHUB)); then
      info "le job n'existe pas : rien à mettre à jour (il se crée depuis un poste, voir le guide d'exploitation)"
      return 0
    fi
    info "le job n'existe pas encore : il est créé"
  fi
  gc artifacts docker images describe "$IMAGE" --format='value(image_summary.digest)' >/dev/null 2>&1 ||
    arret "l'image $IMAGE n'est pas dans Artifact Registry : ce commit n'a pas encore été déployé."
  gc run jobs deploy "$JOB_PURGE" --project="$PROJET" --region="$REGION" --image="$IMAGE"     --service-account="$COMPTE_PURGE" --set-secrets=DATABASE_URL=database-url:latest     --set-env-vars=GOOGLE_CLOUD_PROJECT=$PROJET --command=node --args=apps/api/src/purger.ts     --tasks=1 --max-retries=1 --task-timeout=5m --cpu=1 --memory=512Mi --labels=application=hipmaster
}

# --- Exploitation -----------------------------------------------------------------------------------

etape_etat() {
  titre "API : trafic du service $SERVICE"
  if ! service_existe; then
    info "le service n'existe pas encore"
  else
    service_json | json '(j.status.traffic || []).map((t) => `${String(t.percent || 0).padStart(3)} %  ${t.revisionName}${t.tag ? `  (étiquette ${t.tag})` : ""}`).join("\n")'
    titre "API : dernières révisions"
    gc run revisions list --service="$SERVICE" --project="$PROJET" --region="$REGION" --limit=5 \
      --format='table(metadata.name:label=RÉVISION,metadata.creationTimestamp.date("%Y-%m-%d %H:%M"):label=CRÉÉE,status.conditions[0].status:label=PRÊTE,spec.containers[0].image.basename():label=IMAGE)'
  fi
  titre "Front : dernières publications (site $SITE)"
  appel_firebase GET "$FIREBASE/sites/$SITE/channels/live/releases?pageSize=5" |
    json '(j.releases || []).map((r) => `${r.releaseTime}  ${r.version.name.split("/").pop()}  ${r.message || r.type}`).join("\n") || "aucune publication"'
}

etape_retour_api() {
  local cible=${1:-} actuelle
  if [[ -z $cible ]]; then cible=$(revision_etiquetee "$PRECEDENTE"); fi
  [[ -n $cible ]] ||
    arret "aucune révision n'est étiquetée « $PRECEDENTE » : préciser la révision voulue (voir l'étape etat)."
  actuelle=$(revision_servante)
  titre "Retour arrière de l'API : tout le trafic à $cible${actuelle:+ (au lieu de $actuelle)}"
  gc run services update-traffic "$SERVICE" --project="$PROJET" --region="$REGION" --to-revisions="$cible=100"
  if [[ -n $actuelle && $actuelle != "$cible" ]]; then
    info "pour revenir : bash scripts/gcp/deployer.sh retour-api $actuelle"
  fi
}

etape_retour_front() {
  exiger_public retour-front
  local cible=${1:-} publications actuelle
  publications=$(appel_firebase GET "$FIREBASE/sites/$SITE/channels/live/releases?pageSize=10")
  actuelle=$(json '((j.releases || [])[0] || { version: {} }).version.name' <<<"$publications")
  if [[ -z $cible ]]; then
    cible=$(ACTUELLE=$actuelle json '((j.releases || []).find((r) => r.version.name !== process.env.ACTUELLE) || { version: {} }).version.name' <<<"$publications")
  elif [[ $cible != sites/* ]]; then
    cible=sites/$SITE/versions/$cible
  fi
  [[ -n $cible ]] || arret "aucune version précédente à republier (voir l'étape etat)."
  titre "Retour arrière du front : republication de ${cible##*/}${actuelle:+ (au lieu de ${actuelle##*/})}"
  appel_firebase POST "$FIREBASE/sites/$SITE/releases?versionName=$cible" \
    '{"message":"Retour arrière (deployer.sh retour-front)"}' | json '`publiée : ${j.name}`'
  if [[ -n $actuelle ]]; then
    info "pour revenir : bash scripts/gcp/deployer.sh --public retour-front ${actuelle##*/}"
  fi
}

# --- Programme principal ----------------------------------------------------------------------------

lire_arguments() {
  local argument
  for argument in "$@"; do
    case $argument in
      --public) PUBLIC=1 ;;
      -h | --aide | --help)
        aide
        exit 0
        ;;
      -*) arret "option inconnue : $argument (voir --aide)." ;;
      *) ETAPES+=("$argument") ;;
    esac
  done
  ((${#ETAPES[@]} > 0)) || arret "aucune étape demandée (voir --aide)."
  # Toutes les étapes sont vérifiées avant d'en lancer une : une faute de frappe n'en exécute pas la moitié.
  local i etape
  for ((i = 0; i < ${#ETAPES[@]}; i++)); do
    etape=${ETAPES[i]}
    if [[ $etape == retour-api || $etape == retour-front ]]; then
      ((i + 2 >= ${#ETAPES[@]})) || arret "« $etape » se lance seule, suivie au plus de sa cible."
      return 0
    fi
    [[ " ${ETAPES_CONNUES[*]} " == *" $etape "* ]] || arret "étape inconnue : $etape (voir --aide)."
  done
}

principal() {
  cd "$(dirname "$0")/../.."
  lire_arguments "$@"
  verifier_outils
  verifier_identite
  verifier_commit
  verifier_administrateurs
  local i etape
  for ((i = 0; i < ${#ETAPES[@]}; i++)); do
    etape=${ETAPES[i]}
    case $etape in
      prerequis) etape_prerequis ;;
      image) etape_image ;;
      migrations) etape_migrations ;;
      revision) etape_revision ;;
      sante) etape_sante ;;
      trafic) etape_trafic ;;
      front) etape_front ;;
      site) etape_site ;;
      exploitation) etape_exploitation ;;
      purge) etape_purge ;;
      etat) etape_etat ;;
      retour-api) etape_retour_api "${ETAPES[i + 1]:-}" && break ;;
      retour-front) etape_retour_front "${ETAPES[i + 1]:-}" && break ;;
    esac
  done
  if ((!GITHUB)); then
    local active_apres
    active_apres=$(configuration_active_du_poste)
    if [[ $active_apres != "$ACTIVE_AVANT" ]]; then
      printf '\n[ATTENTION] la configuration gcloud active du poste a changé (« %s » → « %s ») : à vérifier.\n' \
        "$ACTIVE_AVANT" "$active_apres"
    fi
  fi
}

principal "$@"
