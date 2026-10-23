#!/usr/bin/env bash
# Infrastructure de HIPMaster : Google Cloud, Firebase Hosting et base Neon (US-049, ADR 0021 et 0024).
#
# Le script est idempotent : il crée ce qui manque, remet d'aplomb ce qui s'écarte de la cible et dit,
# pour chaque ressource, si elle existait déjà. Le relancer ne casse rien.
# Guide d'exploitation : docs/exploitation/README.md.
#
# Usage, depuis la racine du dépôt (Git Bash sous Windows, ou bash 4 et plus) :
#
#   HIPMASTER_COMPTE=<compte Google> HIPMASTER_FACTURATION=<compte de facturation> \
#     bash scripts/gcp/infrastructure.sh [--simulation]
#
#   --simulation   vérifie l'existant et annonce ce qui serait créé ou modifié, sans rien écrire.
#
# Paramètres facultatifs, avec leur valeur par défaut :
#   HIPMASTER_PROJET=hipmaster            HIPMASTER_REGION=europe-west3
#   HIPMASTER_DEPOT=Obemm/20_HIPMaster    HIPMASTER_BRANCHE=main
#   HIPMASTER_SITE=<projet>               HIPMASTER_BUCKET=<projet>-sauvegardes
#   HIPMASTER_BUDGET=1 (devise du compte de facturation)
#   HIPMASTER_ALERTES=<HIPMASTER_COMPTE> (adresse qui reçoit les alertes par e-mail, US-051)
#   HIPMASTER_DEPOT_ID=<lu sur l'API publique de GitHub>
#   NEON_PROJET=hipmaster                 NEON_ORG=<la seule organisation du compte Neon>
#   NEON_REGION=aws-eu-central-1          NEON_PG=18          NEON_CU=0.25
#   NEON_BASE=hipmaster                   NEON_ROLE=hipmaster
#
# Sécurité :
#   - chaque appel gcloud vise la configuration dédiée « hipmaster », avec le compte et le projet
#     imposés ; la configuration active du poste n'est jamais utilisée ni modifiée (contrôlé à la fin) ;
#   - le compte, puis le projet (dont ce compte doit être propriétaire), sont vérifiés avant toute
#     écriture ;
#   - ni adresse e-mail ni identifiant de facturation dans le dépôt : ils arrivent par l'environnement ;
#   - l'URL de la base va de neonctl à Secret Manager par des tubes : jamais affichée, écrite sur le
#     disque ni journalisée ;
#   - la clé des codes de récupération est tirée au hasard par Node et va à Secret Manager par un tube,
#     sans jamais être affichée ; une fois rangée, elle n'est jamais régénérée.

set -Eeuo pipefail

if ((BASH_VERSINFO[0] < 4)); then
  echo "Bash 4 ou plus est nécessaire (Git Bash sous Windows convient)." >&2
  exit 2
fi

MODE=application
case ${1:-} in
  '') ;;
  --simulation) MODE=simulation ;;
  -h | --aide | --help)
    awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"
    exit 0
    ;;
  *)
    echo "Option inconnue : $1 (voir --aide)." >&2
    exit 2
    ;;
esac

# --- Paramètres et noms -----------------------------------------------------------------------------

COMPTE=${HIPMASTER_COMPTE:-}
FACTURATION=${HIPMASTER_FACTURATION:-}
PROJET=${HIPMASTER_PROJET:-hipmaster}
REGION=${HIPMASTER_REGION:-europe-west3}
DEPOT=${HIPMASTER_DEPOT:-Obemm/20_HIPMaster}
BRANCHE=${HIPMASTER_BRANCHE:-main}
SITE=${HIPMASTER_SITE:-$PROJET}
BUCKET=${HIPMASTER_BUCKET:-$PROJET-sauvegardes}
BUDGET=${HIPMASTER_BUDGET:-1}
ALERTES=${HIPMASTER_ALERTES:-$COMPTE}
DEPOT_ID=${HIPMASTER_DEPOT_ID:-}
NEON_PROJET=${NEON_PROJET:-hipmaster}
NEON_ORG=${NEON_ORG:-}
NEON_REGION=${NEON_REGION:-aws-eu-central-1}
NEON_PG=${NEON_PG:-18}
NEON_CU=${NEON_CU:-0.25}
NEON_BASE=${NEON_BASE:-hipmaster}
NEON_ROLE=${NEON_ROLE:-hipmaster}

# La configuration gcloud n'est pas un paramètre : le script ne peut viser aucune autre configuration.
readonly CONFIGURATION=hipmaster
readonly DEPOT_IMAGES=images
readonly SA_API=hipmaster-api
readonly SA_DEPLOIEMENT=hipmaster-deploiement
readonly SECRET=database-url
readonly SECRET_CLE=cle-codes-recuperation
readonly POOL=github
readonly FOURNISSEUR=github-actions
readonly NOM_BUDGET=HIPMaster
# Exploitation (US-051, ADR 0033) : jobs créés par le déploiement (scripts/gcp/deployer.sh exploitation).
readonly SA_SAUVEGARDE=hipmaster-sauvegarde
readonly SA_CONSOMMATION=hipmaster-consommation
readonly SECRET_NEON=neon-cle-api
readonly JOB_SAUVEGARDE=hipmaster-sauvegarde
readonly JOB_CONSOMMATION=hipmaster-consommation
# Purge de chaque nuit (US-054, ADR 0035) : job créé avec l'image de l'API (scripts/gcp/deployer.sh purge).
readonly SA_PURGE=hipmaster-purge
readonly JOB_PURGE=hipmaster-purge
# Heure de Paris. La sauvegarde évite la fenêtre de maintenance de Neon (jeudi, 2 h à 3 h UTC) ; le relevé arrive
# avant la journée de travail.
readonly FUSEAU=Europe/Paris
readonly HORAIRE_SAUVEGARDE='30 5 * * *'
readonly HORAIRE_CONSOMMATION='0 8 * * *'
# La purge passe juste avant la sauvegarde : un seul réveil de la base Neon pour les deux (veille après 5 minutes), et
# une sauvegarde déjà allégée.
readonly HORAIRE_PURGE='25 5 * * *'
readonly MONITORING=https://monitoring.googleapis.com/v3
readonly NOM_CANAL="HIPMaster : porteur du projet"
readonly NOM_TEST="HIPMaster : santé de l'API"
readonly NOM_ALERTE_SITE="HIPMaster : site indisponible"
readonly NOM_ALERTE_JOBS="HIPMaster : sauvegarde ou consommation Neon"
# Version de neonctl figée (publiée le 2026-10-07) plutôt que la dernière parue.
readonly NEONCTL=neonctl@8.0.12

readonly -a API=(
  cloudresourcemanager.googleapis.com # projet et droits
  serviceusage.googleapis.com         # activation des API
  cloudbilling.googleapis.com         # liaison à la facturation
  billingbudgets.googleapis.com       # budget
  iam.googleapis.com                  # comptes de service, Workload Identity Federation
  iamcredentials.googleapis.com       # jetons courts du compte de déploiement
  sts.googleapis.com                  # échange du jeton GitHub contre un jeton Google
  artifactregistry.googleapis.com     # images de l'API
  run.googleapis.com                  # API et jobs (US-050, US-051)
  secretmanager.googleapis.com        # URL de la base
  storage.googleapis.com              # sauvegardes
  cloudscheduler.googleapis.com       # sauvegarde et purge de chaque nuit (US-051, US-054)
  logging.googleapis.com              # journaux
  monitoring.googleapis.com           # test de disponibilité, alertes (US-051)
  clouderrorreporting.googleapis.com  # erreurs de l'API (US-051)
  firebase.googleapis.com             # Firebase
  firebasehosting.googleapis.com      # front
)

readonly -a ROLES_DEPLOIEMENT=(
  roles/run.admin                         # déployer l'API et ses jobs, et l'ouvrir à Firebase Hosting
  roles/firebasehosting.admin             # publier le front
  roles/serviceusage.serviceUsageConsumer # utiliser les API du projet depuis les CLI
  roles/secretmanager.viewer              # vérifier que les secrets de l'API existent, sans lire leur valeur (US-050)
)

readonly EMAIL_API=$SA_API@$PROJET.iam.gserviceaccount.com
readonly EMAIL_DEPLOIEMENT=$SA_DEPLOIEMENT@$PROJET.iam.gserviceaccount.com
readonly EMAIL_SAUVEGARDE=$SA_SAUVEGARDE@$PROJET.iam.gserviceaccount.com
readonly EMAIL_CONSOMMATION=$SA_CONSOMMATION@$PROJET.iam.gserviceaccount.com
readonly EMAIL_PURGE=$SA_PURGE@$PROJET.iam.gserviceaccount.com
readonly CORRESPONDANCE=google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref
NUMERO=''
CONDITION=''
ACTIVE_AVANT=''
NEON_ID=''
BRANCHE_NEON=''
BRANCHE_NEON_NOM=''
NEON_INCOMPLET=0
CREES=0
MODIFIES=0
EXISTANTS=0
A_FAIRE=0

TEMPORAIRE=$(mktemp -d)
trap 'rm -rf "$TEMPORAIRE"' EXIT

# --- Affichage --------------------------------------------------------------------------------------

etape() { printf '\n%s\n' "$*"; }
info() { printf '                 %s\n' "$*"; }
existe() {
  EXISTANTS=$((EXISTANTS + 1))
  printf '  [existe déjà]  %s\n' "$*"
}
alerte() { printf '  [ATTENTION]    %s\n' "$*"; }
arret() {
  printf '\nARRÊT : %s\n' "$*" >&2
  exit 1
}

echec() {
  # Une commande qui échoue dans un sous-shell déclencherait le message deux fois.
  if ((BASH_SUBSHELL == 0)); then
    printf "\nÉchec à la ligne %s. Rien n'est défait : corriger la cause, puis relancer le script, qui reprend où il en était.\n" "$1" >&2
  fi
}
trap 'echec $LINENO' ERR

# agir creer|modifier <libellé> <commande…> : exécute la commande, ou l'annonce seulement en simulation.
agir() {
  local nature=$1 libelle=$2
  shift 2
  if [[ $MODE == simulation ]]; then
    A_FAIRE=$((A_FAIRE + 1))
    if [[ $nature == creer ]]; then
      printf '  [à créer]      %s\n' "$libelle"
    else
      printf '  [à modifier]   %s\n' "$libelle"
    fi
    return 0
  fi
  "$@"
  if [[ $nature == creer ]]; then
    CREES=$((CREES + 1))
    printf '  [créé]         %s\n' "$libelle"
  else
    MODIFIES=$((MODIFIES + 1))
    printf '  [modifié]      %s\n' "$libelle"
  fi
}
creer() { agir creer "$@"; }
modifier() { agir modifier "$@"; }

# --- Outils -----------------------------------------------------------------------------------------

# gcloud sur la configuration dédiée ; sous Windows, gcloud termine ses lignes par \r\n.
gc() { gcloud --configuration="$CONFIGURATION" "$@" | tr -d '\r'; }

# sans_surcharge <commande…> : sans le compte ni le projet imposés par l'environnement, pour écrire
# ces valeurs dans la configuration elle-même.
sans_surcharge() { (unset CLOUDSDK_CORE_ACCOUNT CLOUDSDK_CORE_PROJECT && "$@"); }

# silencieux <commande…> : n'affiche la sortie de la commande qu'en cas d'échec.
silencieux() {
  local sortie
  if ! sortie=$("$@" 2>&1); then
    printf '%s\n' "$sortie" >&2
    return 1
  fi
}

# reessayer <commande…> : jusqu'à 6 essais à 15 s d'écart, le temps qu'une activation d'API ou une
# création se propage. N'affiche la sortie de la commande qu'en cas d'échec final. « Existe déjà » vaut
# succès : une création peut aboutir malgré une erreur (vu le 2026-10-22 sur Artifact Registry).
reessayer() {
  local essai sortie
  for essai in 1 2 3 4 5 6; do
    if sortie=$("$@" 2>&1); then return 0; fi
    if grep -qiE 'already exists|ALREADY_EXISTS' <<<"$sortie"; then
      info "déjà présent : un essai précédent avait abouti malgré son message d'erreur"
      return 0
    fi
    if ((essai < 6)); then
      info "essai $essai sur 6 en échec ($(grep -m 1 -E 'ERROR|error' <<<"$sortie" | cut -c 1-110)), nouvel essai dans 15 s"
      sleep 15
    fi
  done
  printf '%s\n' "$sortie" >&2
  return 1
}

# neonctl, sans statistiques d'usage ni question interactive.
neon() { npx --yes "$NEONCTL" --no-analytics "$@" </dev/null; }

# API REST de Neon : sous Git Bash, un chemin « /projects/… » serait converti en chemin Windows.
neon_api() { MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' neon api "$@"; }

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
      if (valeur !== undefined && valeur !== null) {
        console.log(typeof valeur === "object" ? JSON.stringify(valeur) : String(valeur));
      }
    });
  ' "$1"
}

# appel_google <méthode> <url> [corps] : API REST Google (Firebase) avec le jeton du compte vérifié.
# Affiche la réponse, puis son code HTTP en dernière ligne. Le jeton passe par l'entrée standard de
# curl, jamais par sa ligne de commande.
appel_google() {
  local jeton
  jeton=$(gc auth print-access-token)
  local -a options=(-sS -X "$1" -H @- -H "x-goog-user-project: $PROJET" -w '\n%{http_code}')
  # Le corps passe par un fichier : sous Windows, un argument de curl perd ses lettres accentuées.
  if [[ -n ${3:-} ]]; then
    printf '%s' "$3" >"$TEMPORAIRE/corps.json"
    options+=(-H 'Content-Type: application/json' --data-binary "@$(chemin_natif "$TEMPORAIRE/corps.json")")
  fi
  printf 'Authorization: Bearer %s\n' "$jeton" | curl "${options[@]}" "$2"
}

# chemin_natif <chemin> : chemin lisible par gcloud (sous Windows, C:/… plutôt que /tmp/…).
chemin_natif() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

# Nom de la configuration gcloud active du poste, lu dans son fichier : seulement pour vérifier, à la
# fin, que le script ne l'a pas changé.
configuration_active_du_poste() {
  local dossier
  dossier=$(gc info --format='value(config.paths.global_config_dir)' 2>/dev/null) || return 0
  if command -v cygpath >/dev/null 2>&1; then dossier=$(cygpath -u "$dossier"); fi
  cat "$dossier/active_config" 2>/dev/null || true
}

# lier_role <libellé> <membre> <rôle> <groupe gcloud> <ressource> [options…] : ajoute la liaison IAM
# si elle manque (« groupe » vaut par exemple « projects » ou « iam service-accounts »).
lier_role() {
  local libelle=$1 membre=$2 role=$3 groupe=$4 ressource=$5
  shift 5
  local -a commande ajout=()
  read -r -a commande <<<"$groupe"
  if [[ $groupe == projects ]]; then ajout=(--condition=None); fi
  # Filtre en JSON : gcloud storage buckets get-iam-policy n'accepte pas --filter (US-051).
  local membres
  membres=$(gc "${commande[@]}" get-iam-policy "$ressource" "$@" --format=json 2>/dev/null |
    ROLE=$role json '(j.bindings || []).filter((b) => b.role === process.env.ROLE).flatMap((b) => b.members).join("\n")' ||
    true)
  if grep -qxF "$membre" <<<"$membres"; then
    existe "$libelle"
  else
    creer "$libelle" reessayer gc "${commande[@]}" add-iam-policy-binding "$ressource" "$@" \
      "${ajout[@]}" --member="$membre" --role="$role"
  fi
}

# --- 0. Paramètres ----------------------------------------------------------------------------------

verifier_parametres() {
  [[ $COMPTE =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] ||
    arret "HIPMASTER_COMPTE doit contenir l'adresse du compte Google personnel (voir le guide)."
  [[ $FACTURATION =~ ^[0-9A-F]{6}-[0-9A-F]{6}-[0-9A-F]{6}$ ]] ||
    arret "HIPMASTER_FACTURATION doit contenir l'identifiant du compte de facturation (XXXXXX-XXXXXX-XXXXXX)."
  [[ $PROJET =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]] ||
    arret "HIPMASTER_PROJET n'est pas un identifiant de projet Google Cloud valable : $PROJET."
  [[ $BUDGET =~ ^[0-9]+$ ]] || arret "HIPMASTER_BUDGET doit être un nombre entier : $BUDGET."
  [[ $ALERTES =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] ||
    arret "HIPMASTER_ALERTES doit contenir une adresse e-mail."
  local outil
  for outil in gcloud node npx curl sha256sum; do
    command -v "$outil" >/dev/null 2>&1 || arret "outil introuvable : $outil (voir les prérequis du guide)."
  done
}

# --- 1. Identité et configuration gcloud ------------------------------------------------------------

etape_configuration() {
  etape "1. Compte Google et configuration gcloud « $CONFIGURATION »"
  # Toute commande gcloud du script vise cette configuration, ce compte et ce projet, quelle que soit
  # la configuration active du poste : variables CLOUDSDK_* en plus de l'option --configuration.
  export CLOUDSDK_ACTIVE_CONFIG_NAME=$CONFIGURATION CLOUDSDK_CORE_ACCOUNT=$COMPTE \
    CLOUDSDK_CORE_PROJECT=$PROJET CLOUDSDK_CORE_DISABLE_PROMPTS=1
  ACTIVE_AVANT=$(configuration_active_du_poste)

  # Vérifications avant toute écriture, même locale.
  local comptes compte projet
  comptes=$(gc auth list --format='value(account)' 2>/dev/null || true)
  grep -qxF "$COMPTE" <<<"$comptes" ||
    arret "le compte $COMPTE n'est pas connecté à gcloud : gcloud auth login $COMPTE (voir le guide)."
  compte=$(gc config get-value core/account 2>/dev/null)
  projet=$(gc config get-value core/project 2>/dev/null)
  [[ $compte == "$COMPTE" && $projet == "$PROJET" ]] ||
    arret "gcloud viserait le compte « $compte » et le projet « $projet » : rien n'est écrit."
  gc projects list --limit=1 --format='value(projectId)' >/dev/null 2>&1 ||
    arret "la connexion de $COMPTE à gcloud a expiré : gcloud auth login $COMPTE, puis relancer."
  info "vérifié : compte $COMPTE, projet $PROJET ; la configuration active du poste (« ${ACTIVE_AVANT:-?} ») n'est pas utilisée"

  if gc config configurations describe "$CONFIGURATION" >/dev/null 2>&1; then
    local compte_lie
    compte_lie=$(sans_surcharge gc config get-value core/account 2>/dev/null || true)
    if [[ -n $compte_lie && $compte_lie != "$COMPTE" ]]; then
      arret "la configuration gcloud « $CONFIGURATION » est liée au compte $compte_lie, pas à $COMPTE."
    fi
    existe "configuration gcloud « $CONFIGURATION » (compte $COMPTE)"
  else
    creer "configuration gcloud « $CONFIGURATION » (compte $COMPTE, projet $PROJET, région $REGION), non activée" \
      creer_configuration
  fi
}

creer_configuration() {
  silencieux gc config configurations create "$CONFIGURATION" --no-activate
  local propriete
  for propriete in "core/account=$COMPTE" "core/project=$PROJET" "run/region=$REGION" \
    "artifacts/location=$REGION"; do
    sans_surcharge silencieux gc config set "${propriete%%=*}" "${propriete#*=}"
  done
}

# --- 2. Projet --------------------------------------------------------------------------------------

etape_projet() {
  etape "2. Projet Google Cloud « $PROJET »"
  local etat proprietaires
  etat=$(gc projects describe "$PROJET" --format='value(lifecycleState)' 2>/dev/null || true)
  case $etat in
    ACTIVE) ;;
    '') creer "projet $PROJET (« HIPMaster »)" creer_projet ;;
    DELETE_REQUESTED)
      arret "le projet $PROJET est en cours de suppression : le restaurer (gcloud projects undelete $PROJET --configuration=$CONFIGURATION) ou choisir un autre HIPMASTER_PROJET."
      ;;
    *) arret "le projet $PROJET est dans un état inattendu : $etat." ;;
  esac
  if [[ $MODE == simulation && -z $etat ]]; then
    NUMERO='<numéro du projet>'
    return 0
  fi
  # Jamais d'écriture dans le projet d'un autre : le compte doit en être propriétaire.
  proprietaires=$(gc projects get-iam-policy "$PROJET" --flatten='bindings[].members' \
    --filter='bindings.role="roles/owner"' --format='value(bindings.members)')
  grep -qxF "user:$COMPTE" <<<"$proprietaires" ||
    arret "le projet $PROJET existe, mais $COMPTE n'en est pas propriétaire : rien n'est écrit."
  NUMERO=$(gc projects describe "$PROJET" --format='value(projectNumber)')
  if [[ $etat == ACTIVE ]]; then existe "projet $PROJET (n° $NUMERO), dont $COMPTE est propriétaire"; fi
}

creer_projet() {
  local sortie
  if sortie=$(gc projects create "$PROJET" --name=HIPMaster --labels=application=hipmaster 2>&1); then
    return 0
  fi
  printf '%s\n' "$sortie" >&2
  if grep -qiE 'already (in use|exists)' <<<"$sortie"; then
    arret "l'identifiant « $PROJET » est déjà pris par un autre compte Google : en choisir un autre avec HIPMASTER_PROJET (par exemple hipmaster-jeu)."
  fi
  if grep -qi 'quota' <<<"$sortie"; then
    arret "le compte $COMPTE a atteint son quota de projets : supprimer un projet inutile ou demander une hausse du quota (voir le guide)."
  fi
  return 1
}

# --- 3. Facturation ---------------------------------------------------------------------------------

etape_facturation() {
  etape "3. Facturation (compte $FACTURATION)"
  local lien
  lien=$(gc billing projects describe "$PROJET" --format='value(billingAccountName)' 2>/dev/null || true)
  if [[ $lien == "billingAccounts/$FACTURATION" ]]; then
    existe "projet relié au compte de facturation $FACTURATION"
  elif [[ -n $lien ]]; then
    arret "le projet est relié à un autre compte de facturation (${lien#billingAccounts/}) : à vérifier avant de relancer."
  else
    creer "projet relié au compte de facturation $FACTURATION" lier_facturation
  fi
}

lier_facturation() {
  local sortie
  if sortie=$(gc billing projects link "$PROJET" --billing-account="$FACTURATION" 2>&1); then
    return 0
  fi
  printf '%s\n' "$sortie" >&2
  if grep -qi 'quota' <<<"$sortie"; then
    arret "le compte de facturation $FACTURATION a atteint son quota de projets reliés. Au choix (voir le guide) :
  1. délier un projet devenu inutile : gcloud billing projects unlink <projet> --configuration=$CONFIGURATION ;
  2. demander une hausse du quota : https://support.google.com/code/contact/billing_quota_increase ;
  3. réutiliser un projet déjà relié : HIPMASTER_PROJET=<projet>."
  fi
  return 1
}

# --- 4. API -----------------------------------------------------------------------------------------

etape_api() {
  etape "4. API Google Cloud"
  local actives api
  local -a manquantes=()
  actives=$(gc services list --enabled --project="$PROJET" --format='value(config.name)' 2>/dev/null || true)
  for api in "${API[@]}"; do
    grep -qxF "$api" <<<"$actives" || manquantes+=("$api")
  done
  if ((${#manquantes[@]} == 0)); then
    existe "${#API[@]} API activées"
  else
    creer "${#manquantes[@]} API activées sur ${#API[@]} : ${manquantes[*]%.googleapis.com}" \
      reessayer gc services enable "${manquantes[@]}" --project="$PROJET"
  fi
}

# --- 5. Artifact Registry ---------------------------------------------------------------------------

etape_artifact_registry() {
  etape "5. Dépôt d'images Artifact Registry « $DEPOT_IMAGES » ($REGION)"
  local adresse=$REGION-docker.pkg.dev/$PROJET/$DEPOT_IMAGES conforme
  local libelle="nettoyage : seules les 2 dernières versions de chaque image sont gardées"
  if gc artifacts repositories describe "$DEPOT_IMAGES" --project="$PROJET" --location="$REGION" >/dev/null 2>&1; then
    existe "dépôt Docker $adresse"
  else
    creer "dépôt Docker $adresse" reessayer gc artifacts repositories create "$DEPOT_IMAGES" \
      --project="$PROJET" --location="$REGION" --repository-format=docker \
      --description="Images de l'API HIPMaster (US-049)"
    creer "$libelle" appliquer_nettoyage
    return 0
  fi
  conforme=$(gc artifacts repositories describe "$DEPOT_IMAGES" --project="$PROJET" --location="$REGION" \
    --format=json 2>/dev/null | json '(() => {
      const politiques = Object.values(j.cleanupPolicies || {});
      const action = (p) => String(p.action || "").toUpperCase();
      const garder = politiques.some((p) => action(p) === "KEEP" && Number((p.mostRecentVersions || {}).keepCount) === 2);
      const supprimer = politiques.some((p) => action(p) === "DELETE" && String((p.condition || {}).tagState).toUpperCase() === "ANY");
      return garder && supprimer && j.cleanupPolicyDryRun !== true;
    })()' || true)
  if [[ $conforme == true ]]; then
    existe "$libelle"
  else
    modifier "$libelle" appliquer_nettoyage
  fi
}

appliquer_nettoyage() {
  cat >"$TEMPORAIRE/nettoyage.json" <<'JSON'
[
  {
    "name": "garder-les-2-dernieres",
    "action": { "type": "Keep" },
    "mostRecentVersions": { "keepCount": 2 }
  },
  {
    "name": "supprimer-les-autres",
    "action": { "type": "Delete" },
    "condition": { "tagState": "any" }
  }
]
JSON
  silencieux gc artifacts repositories set-cleanup-policies "$DEPOT_IMAGES" --project="$PROJET" \
    --location="$REGION" --policy="$(chemin_natif "$TEMPORAIRE/nettoyage.json")" --no-dry-run
}

# --- 6. Bucket de sauvegardes -----------------------------------------------------------------------

etape_bucket() {
  etape "6. Bucket de sauvegardes gs://$BUCKET ($REGION)"
  local description conforme
  local libelle="fichiers supprimés après 30 jours ; accès uniforme, jamais public ; sans corbeille"
  if description=$(gc storage buckets describe "gs://$BUCKET" --project="$PROJET" --format=json 2>/dev/null); then
    existe "bucket gs://$BUCKET"
  else
    creer "bucket gs://$BUCKET : $libelle" creer_bucket
    return 0
  fi
  conforme=$(json '(() => {
    const regles = (j.lifecycle_config || {}).rule || [];
    const trente = regles.some((r) => (r.action || {}).type === "Delete" && Number((r.condition || {}).age) === 30);
    const corbeille = Number((j.soft_delete_policy || {}).retentionDurationSeconds || 0);
    return trente && corbeille === 0 && j.public_access_prevention === "enforced" && j.uniform_bucket_level_access === true;
  })()' <<<"$description" || true)
  if [[ $conforme == true ]]; then
    existe "$libelle"
  else
    modifier "$libelle" silencieux gc storage buckets update "gs://$BUCKET" --project="$PROJET" \
      --lifecycle-file="$(cycle_de_vie)" --uniform-bucket-level-access --public-access-prevention \
      --clear-soft-delete
  fi
}

# Les sauvegardes de plus de 30 jours sont supprimées (ADR 0021) ; sans corbeille, rien ne survit.
cycle_de_vie() {
  printf '%s\n' '{ "rule": [{ "action": { "type": "Delete" }, "condition": { "age": 30 } }] }' \
    >"$TEMPORAIRE/cycle-de-vie.json"
  chemin_natif "$TEMPORAIRE/cycle-de-vie.json"
}

creer_bucket() {
  local sortie
  if sortie=$(gc storage buckets create "gs://$BUCKET" --project="$PROJET" --location="$REGION" \
    --default-storage-class=STANDARD --uniform-bucket-level-access --public-access-prevention \
    --soft-delete-duration=0 --lifecycle-file="$(cycle_de_vie)" 2>&1); then
    return 0
  fi
  printf '%s\n' "$sortie" >&2
  if grep -qiE 'not available|already exists|409' <<<"$sortie"; then
    arret "le nom de bucket « $BUCKET » est déjà pris ailleurs : en choisir un autre avec HIPMASTER_BUCKET."
  fi
  return 1
}

# --- 7. Comptes de service --------------------------------------------------------------------------

etape_comptes_service() {
  etape "7. Comptes de service (sans clé JSON)"
  compte_service "$SA_API" "API HIPMaster (Cloud Run)" \
    "Exécute l'API HIPMaster ; ne lit que ses secrets : la base et la clé des codes (US-049, US-047)"
  compte_service "$SA_DEPLOIEMENT" "Déploiement HIPMaster (GitHub Actions)" \
    "Déploie HIPMaster depuis GitHub Actions, par Workload Identity Federation et sans clé (US-049)"
  compte_service "$SA_SAUVEGARDE" "Sauvegarde HIPMaster (Cloud Run Job)" \
    "Sauvegarde la base chaque nuit : lit l'URL de la base, ajoute des objets au bucket de sauvegardes (US-051)"
  compte_service "$SA_CONSOMMATION" "Consommation Neon HIPMaster (Cloud Run Job)" \
    "Relève chaque jour la consommation Neon : lit la clé de l'API Neon, jamais la base (US-051)"
  compte_service "$SA_PURGE" "Purge HIPMaster (Cloud Run Job)"     "Purge chaque nuit les données techniques expirées : lit l'URL de la base, rien d'autre (US-054)"
}

compte_service() {
  local nom=$1 affichage=$2 description=$3
  local email=$nom@$PROJET.iam.gserviceaccount.com cles
  if gc iam service-accounts describe "$email" --project="$PROJET" >/dev/null 2>&1; then
    existe "compte de service $email"
  else
    creer "compte de service $email" silencieux gc iam service-accounts create "$nom" --project="$PROJET" \
      --display-name="$affichage" --description="$description"
    return 0
  fi
  # Workload Identity Federation rend les clés inutiles : en trouver une est une anomalie.
  cles=$(gc iam service-accounts keys list --iam-account="$email" --project="$PROJET" --managed-by=user \
    --format='value(name.basename())' 2>/dev/null || true)
  if [[ -n $cles ]]; then
    alerte "$email a des clés JSON ($(tr '\n' ' ' <<<"$cles")) : les supprimer (gcloud iam service-accounts keys delete)."
  else
    info "aucune clé JSON"
  fi
}

# --- 8. Secret de la base ---------------------------------------------------------------------------

etape_secret() {
  etape "8. Secret « $SECRET » (URL de la base, lue par l'API seule)"
  if gc secrets describe "$SECRET" --project="$PROJET" >/dev/null 2>&1; then
    existe "secret $SECRET, répliqué en $REGION seulement"
  else
    creer "secret $SECRET, répliqué en $REGION seulement (sa valeur vient de Neon, étape 13)" \
      reessayer gc secrets create "$SECRET" --project="$PROJET" \
      --replication-policy=user-managed --locations="$REGION" --labels=application=hipmaster
  fi
  lier_role "$SA_API peut lire ce secret" "serviceAccount:$EMAIL_API" \
    roles/secretmanager.secretAccessor secrets "$SECRET" --project="$PROJET"
}

# --- 9. Workload Identity Federation ----------------------------------------------------------------

etape_wif() {
  etape "9. Workload Identity Federation : GitHub Actions ($DEPOT, branche $BRANCHE) → $SA_DEPLOIEMENT"
  if [[ -z $DEPOT_ID ]]; then
    DEPOT_ID=$(curl -fsS "https://api.github.com/repos/$DEPOT" | json 'j.id') ||
      arret "identifiant du dépôt GitHub $DEPOT introuvable : le fournir avec HIPMASTER_DEPOT_ID."
  fi
  [[ $DEPOT_ID =~ ^[0-9]+$ ]] || arret "identifiant de dépôt GitHub invalide : $DEPOT_ID."
  # L'identifiant numérique protège d'un dépôt recréé sous le même nom ; la référence limite à la
  # branche : ni pull request ni autre branche ne peut obtenir de jeton.
  CONDITION="assertion.repository_id == '$DEPOT_ID' && assertion.repository == '$DEPOT' && assertion.ref == 'refs/heads/$BRANCHE'"

  local etat fournisseur conforme
  etat=$(gc iam workload-identity-pools describe "$POOL" --project="$PROJET" --location=global \
    --format='value(state)' 2>/dev/null || true)
  case $etat in
    ACTIVE) existe "pool d'identités $POOL" ;;
    DELETED)
      modifier "pool d'identités $POOL, restauré (il avait été supprimé)" silencieux \
        gc iam workload-identity-pools undelete "$POOL" --project="$PROJET" --location=global
      ;;
    *)
      creer "pool d'identités $POOL" reessayer gc iam workload-identity-pools create "$POOL" \
        --project="$PROJET" --location=global --display-name="GitHub Actions" \
        --description="Workflows GitHub Actions du dépôt $DEPOT (US-049)"
      ;;
  esac

  fournisseur=$(gc iam workload-identity-pools providers describe "$FOURNISSEUR" --project="$PROJET" \
    --location=global --workload-identity-pool="$POOL" --format=json 2>/dev/null || true)
  local libelle="fournisseur OIDC $FOURNISSEUR : jetons GitHub du dépôt $DEPOT (n° $DEPOT_ID), branche $BRANCHE seulement"
  if [[ -z $fournisseur ]]; then
    creer "$libelle" reessayer gc iam workload-identity-pools providers create-oidc "$FOURNISSEUR" \
      --project="$PROJET" --location=global --workload-identity-pool="$POOL" \
      --display-name="GitHub Actions ($BRANCHE)" --issuer-uri=https://token.actions.githubusercontent.com \
      --attribute-mapping="$CORRESPONDANCE" --attribute-condition="$CONDITION"
  else
    # Valeurs attendues passées sous d'autres noms : CORRESPONDANCE, en lecture seule, ne peut pas être
    # réaffectée devant la commande.
    conforme=$(ATTENDU_CONDITION=$CONDITION ATTENDU_CORRESPONDANCE=$CORRESPONDANCE json '(() => {
      const attendu = process.env.ATTENDU_CORRESPONDANCE.split(",").map((c) => c.split("="));
      const actuel = j.attributeMapping || {};
      const memes = attendu.length === Object.keys(actuel).length && attendu.every(([cle, valeur]) => actuel[cle] === valeur);
      return memes && j.attributeCondition === process.env.ATTENDU_CONDITION && j.state === "ACTIVE" && !j.disabled
        && (j.oidc || {}).issuerUri === "https://token.actions.githubusercontent.com";
    })()' <<<"$fournisseur" || true)
    if [[ $conforme == true ]]; then
      existe "$libelle"
    else
      modifier "$libelle (condition et attributs remis à la cible)" silencieux \
        gc iam workload-identity-pools providers update-oidc "$FOURNISSEUR" --project="$PROJET" \
        --location=global --workload-identity-pool="$POOL" \
        --issuer-uri=https://token.actions.githubusercontent.com \
        --attribute-mapping="$CORRESPONDANCE" --attribute-condition="$CONDITION"
    fi
  fi

  lier_role "les workflows de $DEPOT ($BRANCHE) agissent comme $SA_DEPLOIEMENT, sans clé" \
    "principalSet://iam.googleapis.com/projects/$NUMERO/locations/global/workloadIdentityPools/$POOL/attribute.repository/$DEPOT" \
    roles/iam.workloadIdentityUser "iam service-accounts" "$EMAIL_DEPLOIEMENT" --project="$PROJET"
}

# --- 10. Droits du compte de déploiement ------------------------------------------------------------

etape_droits_deploiement() {
  etape "10. Droits du compte de déploiement $SA_DEPLOIEMENT"
  local role
  for role in "${ROLES_DEPLOIEMENT[@]}"; do
    lier_role "$role sur le projet" "serviceAccount:$EMAIL_DEPLOIEMENT" "$role" projects "$PROJET"
  done
  lier_role "roles/artifactregistry.writer sur le dépôt $DEPOT_IMAGES seulement" \
    "serviceAccount:$EMAIL_DEPLOIEMENT" roles/artifactregistry.writer "artifacts repositories" \
    "$DEPOT_IMAGES" --location="$REGION" --project="$PROJET"
  local email
  for email in "$EMAIL_API" "$EMAIL_SAUVEGARDE" "$EMAIL_CONSOMMATION" "$EMAIL_PURGE"; do
    lier_role "roles/iam.serviceAccountUser sur ${email%%@*} seulement (déployer l'API ou un job sous ce compte)" \
      "serviceAccount:$EMAIL_DEPLOIEMENT" roles/iam.serviceAccountUser "iam service-accounts" \
      "$email" --project="$PROJET"
  done
}

# --- 11. Budget -------------------------------------------------------------------------------------

etape_budget() {
  local devise budget montant
  devise=$(gc billing accounts describe "$FACTURATION" --format='value(currencyCode)')
  etape "11. Budget mensuel de $BUDGET $devise (alertes par e-mail à 50 %, à 100 % et à 100 % prévus)"
  # Le quota de l'API Budgets est compté sur le projet, où elle est activée (étape 4).
  budget=$(gc billing budgets list --billing-account="$FACTURATION" --billing-project="$PROJET" \
    --filter="displayName=\"$NOM_BUDGET\"" --format='value(name)' 2>/dev/null || true)
  budget=${budget%%$'\n'*}
  if [[ -z $budget ]]; then
    creer "budget « $NOM_BUDGET » de $BUDGET $devise par mois, limité au projet $PROJET" reessayer \
      gc billing budgets create --billing-account="$FACTURATION" --billing-project="$PROJET" \
      --display-name="$NOM_BUDGET" --budget-amount="$BUDGET$devise" --calendar-period=month \
      --filter-projects="projects/$PROJET" --threshold-rule=percent=0.5 --threshold-rule=percent=1.0 \
      --threshold-rule=percent=1.0,basis=forecasted-spend
    return 0
  fi
  montant=$(gc billing budgets describe "$budget" --billing-project="$PROJET" \
    --format='value(amount.specifiedAmount.units)')
  if [[ $montant == "$BUDGET" ]]; then
    existe "budget « $NOM_BUDGET » de $BUDGET $devise par mois"
  else
    modifier "budget « $NOM_BUDGET » : ${montant:-?} → $BUDGET $devise par mois" silencieux \
      gc billing budgets update "$budget" --billing-project="$PROJET" --budget-amount="$BUDGET$devise"
  fi
}

# --- 12. Firebase -----------------------------------------------------------------------------------

# Firebase passe par son API REST, avec le jeton du compte vérifié à l'étape 1 : une seule identité,
# celle de la configuration dédiée, sans dépendre de la connexion de la CLI Firebase.
etape_firebase() {
  etape "12. Firebase et site Hosting « $SITE »"
  local reponse sites
  reponse=$(appel_google GET "https://firebase.googleapis.com/v1beta1/projects/$PROJET")
  if [[ ${reponse##*$'\n'} == 200 ]]; then
    existe "Firebase ajouté au projet $PROJET"
  else
    creer "Firebase ajouté au projet $PROJET" ajouter_firebase
  fi
  reponse=$(appel_google GET "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJET/sites")
  sites=$(json '(j.sites || []).map((s) => s.name.split("/").pop()).join("\n")' <<<"${reponse%$'\n'*}" || true)
  if grep -qxF "$SITE" <<<"$sites"; then
    existe "site Hosting $SITE : https://$SITE.web.app"
  elif [[ $MODE == simulation ]]; then
    creer "site Hosting $SITE : https://$SITE.web.app (si ce nom est libre)" :
  else
    creer_site "$sites"
  fi
}

ajouter_firebase() {
  local reponse operation essai
  reponse=$(appel_google POST "https://firebase.googleapis.com/v1beta1/projects/$PROJET:addFirebase" '{}')
  if [[ ${reponse##*$'\n'} != 200 ]]; then
    printf '%s\n' "${reponse%$'\n'*}" >&2
    return 1
  fi
  operation=$(json 'j.name' <<<"${reponse%$'\n'*}")
  for essai in $(seq 1 40); do
    reponse=$(appel_google GET "https://firebase.googleapis.com/v1beta1/$operation")
    case $(json 'j.done ? (j.error ? "erreur" : "fini") : "en cours"' <<<"${reponse%$'\n'*}") in
      fini) return 0 ;;
      erreur)
        printf '%s\n' "${reponse%$'\n'*}" >&2
        return 1
        ;;
    esac
    sleep 5
  done
  printf 'Firebase ne répond pas après %s essais.\n' "$essai" >&2
  return 1
}

# Le nom du site fait l'adresse du jeu ; s'il est pris ailleurs, le site par défaut reste en place.
creer_site() {
  local reponse
  reponse=$(appel_google POST "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJET/sites?siteId=$SITE" '{}')
  if [[ ${reponse##*$'\n'} == 200 ]]; then
    CREES=$((CREES + 1))
    printf '  [créé]         %s\n' "site Hosting $SITE : https://$SITE.web.app"
  elif grep -qiE 'already exists|ALREADY_EXISTS|not available|reserved' <<<"$reponse"; then
    alerte "le nom de site « $SITE » est déjà pris : le site par défaut ($(tr '\n' ' ' <<<"$1")) reste l'adresse du jeu ; un autre nom : HIPMASTER_SITE=<nom>."
  else
    printf '%s\n' "${reponse%$'\n'*}" >&2
    return 1
  fi
}

# --- 13. Neon ---------------------------------------------------------------------------------------

etape_neon() {
  etape "13. Base PostgreSQL Neon « $NEON_PROJET » ($NEON_REGION, PostgreSQL $NEON_PG, ${NEON_CU/./,} CU)"
  # Sans connexion, neonctl ouvrirait le navigateur sans prévenir : mieux vaut s'arrêter.
  local identifiants=${NEON_CONFIG_DIR:-$HOME/.config/neon}
  if [[ -z ${NEON_API_KEY:-} && ! -f $identifiants/credentials.json && ! -f $identifiants/profiles.json ]]; then
    arret "neonctl n'est pas connecté : npx $NEONCTL auth (voir le guide), puis relancer."
  fi
  local moi organisations projets projet nombre
  moi=$(neon me --output json) ||
    arret "neonctl ne répond pas (connexion expirée ?) : npx $NEONCTL auth, puis relancer."
  info "compte Neon : $(json 'j.email' <<<"$moi")"
  if [[ -z $NEON_ORG ]]; then
    organisations=$(neon orgs list --output json)
    [[ $(json 'j.length' <<<"$organisations") == 1 ]] ||
      arret "le compte Neon a plusieurs organisations : préciser NEON_ORG."
    NEON_ORG=$(json 'j[0].id' <<<"$organisations")
  fi
  projets=$(neon projects list --org-id "$NEON_ORG" --output json)
  projet=$(NOM=$NEON_PROJET json 'j.filter((p) => p.name.toLowerCase() === process.env.NOM.toLowerCase())' <<<"$projets")
  nombre=$(json 'j.length' <<<"$projet")
  if ((nombre > 1)); then arret "plusieurs projets Neon s'appellent « $NEON_PROJET » : préciser NEON_PROJET."; fi
  if ((nombre == 0)); then
    creer "projet Neon « $NEON_PROJET » ($NEON_REGION, PostgreSQL $NEON_PG, ${NEON_CU/./,} CU, base $NEON_BASE, rôle $NEON_ROLE)" \
      creer_projet_neon
    if [[ $MODE == simulation ]]; then
      creer "URL de connexion rangée dans le secret $SECRET" :
      return 0
    fi
  else
    local region pg
    NEON_ID=$(json 'j[0].id' <<<"$projet")
    region=$(json 'j[0].region_id' <<<"$projet")
    pg=$(json 'j[0].pg_version' <<<"$projet")
    [[ $region == "$NEON_REGION" ]] ||
      arret "le projet Neon « $NEON_PROJET » est en $region, pas en $NEON_REGION : Neon ne déplace pas un projet."
    [[ $pg == "$NEON_PG" ]] ||
      arret "le projet Neon « $NEON_PROJET » est en PostgreSQL $pg, pas $NEON_PG : Neon ne change pas la version majeure d'un projet (garder NEON_PG=$pg, ou choisir un autre NEON_PROJET)."
    existe "projet Neon « $(json 'j[0].name' <<<"$projet") » ($NEON_ID), $region, PostgreSQL $pg"
  fi
  neon_branche
  neon_calcul
  neon_role_et_base
  neon_secret
}

creer_projet_neon() {
  local sortie
  # --no-secrets : sans cette option, la réponse contiendrait l'URL de connexion et son mot de passe.
  sortie=$(neon projects create --org-id "$NEON_ORG" --name "$NEON_PROJET" --region-id "$NEON_REGION" \
    --pg-version "$NEON_PG" --cu "$NEON_CU" --database "$NEON_BASE" --role "$NEON_ROLE" \
    --no-secrets --output json)
  NEON_ID=$(json '(j.project || j).id' <<<"$sortie")
}

neon_branche() {
  local branches
  branches=$(neon branches list --project-id "$NEON_ID" --output json)
  BRANCHE_NEON=$(json 'j.find((b) => b.default).id' <<<"$branches")
  BRANCHE_NEON_NOM=$(json 'j.find((b) => b.default).name' <<<"$branches")
  info "branche par défaut : $BRANCHE_NEON_NOM ($BRANCHE_NEON)"
}

# Calcul plafonné à NEON_CU (quota gratuit de 100 heures-CU par mois, ADR 0021), pour le calcul de la
# branche comme pour les calculs créés plus tard (restauration de sauvegarde, US-051).
neon_calcul() {
  local points point id_point minimum maximum projet_neon
  points=$(neon_api "/projects/$NEON_ID/endpoints")
  point=$(BR=$BRANCHE_NEON json 'j.endpoints.find((e) => e.branch_id === process.env.BR && e.type === "read_write")' <<<"$points")
  [[ -n $point ]] || arret "la branche Neon $BRANCHE_NEON_NOM n'a pas de calcul en lecture-écriture."
  id_point=$(json 'j.id' <<<"$point")
  minimum=$(json 'j.autoscaling_limit_min_cu' <<<"$point")
  maximum=$(json 'j.autoscaling_limit_max_cu' <<<"$point")
  if [[ $minimum == "$NEON_CU" && $maximum == "$NEON_CU" ]]; then
    existe "calcul $id_point fixé à ${NEON_CU/./,} CU, en veille après 5 minutes sans connexion"
  else
    modifier "calcul $id_point : ${minimum/./,} à ${maximum/./,} CU → ${NEON_CU/./,} CU fixes" silencieux \
      neon_api "/projects/$NEON_ID/endpoints/$id_point" -X PATCH \
      -F "endpoint.autoscaling_limit_min_cu=$NEON_CU" -F "endpoint.autoscaling_limit_max_cu=$NEON_CU"
  fi
  projet_neon=$(neon projects get "$NEON_ID" --output json)
  minimum=$(json '(j.project || j).default_endpoint_settings.autoscaling_limit_min_cu' <<<"$projet_neon")
  maximum=$(json '(j.project || j).default_endpoint_settings.autoscaling_limit_max_cu' <<<"$projet_neon")
  if [[ $minimum == "$NEON_CU" && $maximum == "$NEON_CU" ]]; then
    existe "calculs créés plus tard : ${NEON_CU/./,} CU"
  else
    modifier "calculs créés plus tard : ${minimum/./,} à ${maximum/./,} CU → ${NEON_CU/./,} CU" silencieux \
      neon projects update "$NEON_ID" --cu "$NEON_CU" --output json
  fi
}

neon_role_et_base() {
  local roles present bases proprietaire
  roles=$(neon roles list --project-id "$NEON_ID" --branch "$BRANCHE_NEON" --output json)
  present=$(NOM=$NEON_ROLE json 'j.some((r) => r.name === process.env.NOM)' <<<"$roles")
  if [[ $present == true ]]; then
    existe "rôle PostgreSQL $NEON_ROLE"
  else
    NEON_INCOMPLET=1
    creer "rôle PostgreSQL $NEON_ROLE" creer_role_neon
  fi
  bases=$(neon databases list --project-id "$NEON_ID" --branch "$BRANCHE_NEON" --output json)
  proprietaire=$(NOM=$NEON_BASE json '(j.find((d) => d.name === process.env.NOM) || {}).owner_name' <<<"$bases")
  if [[ -z $proprietaire ]]; then
    NEON_INCOMPLET=1
    creer "base $NEON_BASE, propriété de $NEON_ROLE" silencieux neon databases create \
      --project-id "$NEON_ID" --branch "$BRANCHE_NEON" --name "$NEON_BASE" --owner-name "$NEON_ROLE" --output json
  elif [[ $proprietaire == "$NEON_ROLE" ]]; then
    existe "base $NEON_BASE, propriété de $NEON_ROLE"
  else
    arret "la base $NEON_BASE appartient au rôle $proprietaire, pas à $NEON_ROLE : à vérifier."
  fi
}

# La réponse de Neon contient le mot de passe du rôle : elle n'est jamais affichée.
creer_role_neon() {
  neon roles create --project-id "$NEON_ID" --branch "$BRANCHE_NEON" --name "$NEON_ROLE" --output json >/dev/null
}

# URL pour postgres.js : point d'accès direct (sans PgBouncer), certificat vérifié (« verify-full » :
# « require » chiffre sans vérifier le certificat), sans channel_binding, que postgres.js enverrait au
# serveur comme un paramètre inconnu. Elle ne circule que par des tubes et la mémoire ; en cas d'erreur,
# rien n'est affiché.
url_de_connexion() {
  neon connection-string "$BRANCHE_NEON" --project-id "$NEON_ID" --database-name "$NEON_BASE" \
    --role-name "$NEON_ROLE" --ssl verify-full 2>/dev/null |
    node -e '
      let texte = "";
      process.stdin.on("data", (d) => (texte += d));
      process.stdin.on("end", () => {
        try {
          const url = new URL(texte.trim());
          if (!/^postgres(ql)?:$/.test(url.protocol) || !url.password) process.exit(1);
          url.searchParams.delete("channel_binding");
          url.searchParams.set("sslmode", "verify-full");
          process.stdout.write(url.toString());
        } catch {
          process.exit(1);
        }
      });
    '
}

neon_secret() {
  local libelle="URL de connexion ($NEON_ROLE sur $NEON_BASE, certificat vérifié) rangée dans le secret $SECRET"
  if [[ $MODE == simulation ]] && { ((NEON_INCOMPLET)) || ! gc secrets describe "$SECRET" --project="$PROJET" >/dev/null 2>&1; }; then
    creer "$libelle" :
    return 0
  fi
  local url empreinte_neon empreinte_secret versions
  url=$(url_de_connexion) || arret "neonctl n'a pas fourni d'URL de connexion valable."
  empreinte_neon=$(printf '%s' "$url" | sha256sum)
  empreinte_secret=$(gc secrets versions access latest --secret="$SECRET" --project="$PROJET" 2>/dev/null |
    tr -d '\r\n' | sha256sum || true)
  versions=$(gc secrets versions list "$SECRET" --project="$PROJET" --filter='state=ENABLED' \
    --format='value(name.basename())' 2>/dev/null || true)
  if [[ $empreinte_neon == "$empreinte_secret" ]]; then
    existe "$libelle (version à jour)"
  elif [[ -n $versions ]]; then
    modifier "$libelle (nouvelle version ; les précédentes sont désactivées)" ranger_url "$url" "$versions"
  else
    creer "$libelle" ranger_url "$url" ""
  fi
  unset url
}

# ranger_url <url> <versions à désactiver> : la valeur passe par l'entrée standard de gcloud.
ranger_url() {
  local version
  printf '%s' "$1" | silencieux gc secrets versions add "$SECRET" --project="$PROJET" --data-file=-
  for version in $2; do
    silencieux gc secrets versions disable "$version" --secret="$SECRET" --project="$PROJET"
  done
}

# --- 14. Clé des codes de récupération (US-047) -----------------------------------------------------

# L'API garde des codes de récupération une empreinte HMAC (ADR 0025) : sans cette clé, une copie de la
# base ne permet pas d'essayer des codes hors ligne. La clé est tirée une seule fois : la changer
# rendrait inutilisables tous les codes de récupération des joueurs (voir le guide en cas de fuite).
etape_cle_codes() {
  etape "14. Secret « $SECRET_CLE » (clé des codes de récupération, lue par l'API seule)"
  if gc secrets describe "$SECRET_CLE" --project="$PROJET" >/dev/null 2>&1; then
    existe "secret $SECRET_CLE, répliqué en $REGION seulement"
  else
    creer "secret $SECRET_CLE, répliqué en $REGION seulement" reessayer gc secrets create "$SECRET_CLE" \
      --project="$PROJET" --replication-policy=user-managed --locations="$REGION" --labels=application=hipmaster
  fi
  local versions
  versions=$(gc secrets versions list "$SECRET_CLE" --project="$PROJET" --filter='state=ENABLED' \
    --format='value(name.basename())' 2>/dev/null || true)
  if [[ -n $versions ]]; then
    existe "valeur de la clé (jamais régénérée par le script)"
  else
    creer "valeur de la clé : 256 bits tirés au hasard, jamais affichés" ranger_cle
  fi
  lier_role "$SA_API peut lire ce secret" "serviceAccount:$EMAIL_API" \
    roles/secretmanager.secretAccessor secrets "$SECRET_CLE" --project="$PROJET"
}

# La clé va de Node à gcloud par un tube : jamais affichée, écrite sur le disque ni journalisée.
ranger_cle() {
  node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))' |
    silencieux gc secrets versions add "$SECRET_CLE" --project="$PROJET" --data-file=-
}

# --- 15. Sauvegarde de chaque nuit (US-051) ---------------------------------------------------------

# Le job hipmaster-sauvegarde (deployer.sh exploitation) range un pg_dump de la base dans le bucket. Son compte lit
# l'URL de la base et ajoute des objets au bucket : il ne peut ni lire, ni remplacer, ni supprimer une sauvegarde.
etape_sauvegarde() {
  etape "15. Sauvegarde de chaque nuit : job $JOB_SAUVEGARDE (« $HORAIRE_SAUVEGARDE », heure de Paris)"
  lier_role "$SA_SAUVEGARDE peut lire le secret $SECRET" "serviceAccount:$EMAIL_SAUVEGARDE" \
    roles/secretmanager.secretAccessor secrets "$SECRET" --project="$PROJET"
  lier_role "$SA_SAUVEGARDE peut ajouter des objets à gs://$BUCKET (ni lire, ni remplacer, ni supprimer)" \
    "serviceAccount:$EMAIL_SAUVEGARDE" roles/storage.objectCreator "storage buckets" "gs://$BUCKET" \
    --project="$PROJET"
  planifier "$JOB_SAUVEGARDE" "$EMAIL_SAUVEGARDE" "$HORAIRE_SAUVEGARDE" \
    "Sauvegarde de la base Neon vers gs://$BUCKET (US-051)"
}

# planifier <job> <compte> <horaire> <description> : tâche Cloud Scheduler du même nom, qui lance le job Cloud Run
# avec l'identité du compte de ce job, autorisé à lancer ce seul job.
planifier() {
  local job=$1 email=$2 horaire=$3 description=$4 actuelle conforme
  local uri="https://run.googleapis.com/v2/projects/$PROJET/locations/$REGION/jobs/$job:run"
  if gc run jobs describe "$job" --project="$PROJET" --region="$REGION" >/dev/null 2>&1; then
    lier_role "$job peut être lancé par ${email%%@*} (ce job seulement)" "serviceAccount:$email" \
      roles/run.invoker "run jobs" "$job" --project="$PROJET" --region="$REGION"
  else
    alerte "le job $job n'existe pas encore : il naît au déploiement (deployer.sh exploitation, ou deployer.sh purge) ; relancer ensuite ce script pour que la tâche planifiée ait le droit de le lancer."
  fi
  local -a options=(--project="$PROJET" --location="$REGION" --schedule="$horaire" --time-zone="$FUSEAU"
    --uri="$uri" --http-method=POST --oauth-service-account-email="$email"
    --oauth-token-scope=https://www.googleapis.com/auth/cloud-platform --description="$description")
  local libelle="tâche planifiée $job : « $horaire » ($FUSEAU), lance le job $job"
  actuelle=$(gc scheduler jobs describe "$job" --project="$PROJET" --location="$REGION" --format=json \
    2>/dev/null || true)
  if [[ -z $actuelle ]]; then
    creer "$libelle" reessayer gc scheduler jobs create http "$job" "${options[@]}"
    return 0
  fi
  conforme=$(HORAIRE=$horaire URI=$uri EMAIL=$email ZONE=$FUSEAU json '(() => {
    const cible = j.httpTarget || {};
    return j.schedule === process.env.HORAIRE && j.timeZone === process.env.ZONE && cible.uri === process.env.URI
      && (cible.oauthToken || {}).serviceAccountEmail === process.env.EMAIL && j.state === "ENABLED";
  })()' <<<"$actuelle" || true)
  if [[ $conforme == true ]]; then
    existe "$libelle"
  else
    modifier "$libelle (remise à la cible, réactivée si elle était en pause)" planifier_a_nouveau "$job" \
      "${options[@]}"
  fi
}

planifier_a_nouveau() {
  local job=$1
  shift
  silencieux gc scheduler jobs update http "$job" "$@"
  if [[ $(gc scheduler jobs describe "$job" --project="$PROJET" --location="$REGION" --format='value(state)') != ENABLED ]]; then
    silencieux gc scheduler jobs resume "$job" --project="$PROJET" --location="$REGION"
  fi
}

# --- 16. Relevé de la consommation Neon (US-051) ----------------------------------------------------

# Le job hipmaster-consommation lit sur l'API de Neon les compteurs du mois, sans jamais se connecter à la base. Sa
# clé est une clé d'organisation limitée au projet HIPMaster, créée ici et rangée dans Secret Manager par des tubes.
etape_consommation() {
  etape "16. Relevé de la consommation Neon : job $JOB_CONSOMMATION (« $HORAIRE_CONSOMMATION », heure de Paris)"
  if gc secrets describe "$SECRET_NEON" --project="$PROJET" >/dev/null 2>&1; then
    existe "secret $SECRET_NEON (clé de l'API Neon), répliqué en $REGION seulement"
  else
    creer "secret $SECRET_NEON (clé de l'API Neon), répliqué en $REGION seulement" reessayer gc secrets create \
      "$SECRET_NEON" --project="$PROJET" --replication-policy=user-managed --locations="$REGION" \
      --labels=application=hipmaster
  fi
  local versions
  versions=$(gc secrets versions list "$SECRET_NEON" --project="$PROJET" --filter='state=ENABLED' \
    --format='value(name.basename())' 2>/dev/null || true)
  if [[ -n $versions ]]; then
    existe "clé de l'API Neon rangée (jamais recréée par le script)"
  elif [[ -z $NEON_ID ]]; then
    creer "clé de l'API Neon limitée au projet, rangée dans le secret $SECRET_NEON" :
  else
    creer "clé de l'API Neon « hipmaster-consommation », limitée au projet $NEON_ID, rangée sans être affichée" \
      ranger_cle_neon
  fi
  lier_role "$SA_CONSOMMATION peut lire ce secret" "serviceAccount:$EMAIL_CONSOMMATION" \
    roles/secretmanager.secretAccessor secrets "$SECRET_NEON" --project="$PROJET"
  planifier "$JOB_CONSOMMATION" "$EMAIL_CONSOMMATION" "$HORAIRE_CONSOMMATION" \
    "Relevé de la consommation Neon, alerte au-delà de 70 % du quota (US-051)"
}

# La réponse de Neon contient la clé : elle va de neonctl à gcloud par des tubes, jamais affichée ni écrite. En cas
# d'échec après sa création, la révoquer dans la console Neon (Organization settings, API keys).
ranger_cle_neon() {
  neon_api "/organizations/$NEON_ORG/api_keys" -X POST -F key_name=hipmaster-consommation \
    -F "project_id=$NEON_ID" |
    node -e '
      let texte = "";
      process.stdin.on("data", (d) => (texte += d));
      process.stdin.on("end", () => {
        try {
          const cle = JSON.parse(texte).key;
          if (!cle) process.exit(1);
          process.stdout.write(cle);
        } catch {
          process.exit(1);
        }
      });
    ' | silencieux gc secrets versions add "$SECRET_NEON" --project="$PROJET" --data-file=-
}

# --- 17. Purge de chaque nuit (US-054) --------------------------------------------------------------

# Le job hipmaster-purge (deployer.sh purge) lance `node apps/api/src/purger.ts` avec l'image de l'API : il supprime les
# sessions inutilisées 90 jours, les défis jamais acceptés et les parties contre le bot abandonnées, jamais un compte,
# une collection, une récompense ni un duel commencé (ADR 0035). Son compte ne lit que l'URL de la base.
etape_purge() {
  etape "17. Purge de chaque nuit : job $JOB_PURGE (« $HORAIRE_PURGE », heure de Paris)"
  lier_role "$SA_PURGE peut lire le secret $SECRET" "serviceAccount:$EMAIL_PURGE"     roles/secretmanager.secretAccessor secrets "$SECRET" --project="$PROJET"
  planifier "$JOB_PURGE" "$EMAIL_PURGE" "$HORAIRE_PURGE"     "Purge des données techniques expirées : sessions, défis, parties contre le bot (US-054)"
}

# --- 18. Supervision (US-051) -----------------------------------------------------------------------

# Cloud Monitoring par son API REST : un canal e-mail, un test de disponibilité et deux alertes. Chaque objet est
# retrouvé par son nom affiché, et remis à la cible s'il s'en écarte.
etape_supervision() {
  etape "18. Supervision : test de disponibilité de https://$SITE.web.app/api/v1/sante, alertes par e-mail"
  supervision_canal
  supervision_test
  supervision_alerte "$NOM_ALERTE_SITE" "$(alerte_site)"
  supervision_alerte "$NOM_ALERTE_JOBS" "$(alerte_jobs)"
}

# monitoring <méthode> <chemin> [corps] : API de Cloud Monitoring du projet ; affiche la réponse, échoue sur une
# erreur HTTP.
monitoring() {
  local reponse
  reponse=$(appel_google "$1" "$MONITORING/projects/$PROJET$2" "${3:-}")
  if [[ ${reponse##*$'\n'} != 2* ]]; then
    printf '%s\n' "${reponse%$'\n'*}" >&2
    return 1
  fi
  printf '%s\n' "${reponse%$'\n'*}"
}

# trouver <collection> <nom affiché> : l'objet de ce nom (JSON), ou rien.
trouver() {
  monitoring GET "/$1?pageSize=200" | COLLECTION=$1 NOM=$2 \
    json '(j[process.env.COLLECTION] || []).find((o) => o.displayName === process.env.NOM)' || true
}

# nom_court <objet JSON> : le dernier segment de son nom (identifiant).
nom_court() { json 'j.name.split("/").pop()' <<<"$1"; }

CANAL=''
ID_TEST=''

supervision_canal() {
  local canal corps libelle="canal e-mail « $NOM_CANAL » (adresse HIPMASTER_ALERTES)"
  corps=$(NOM=$NOM_CANAL ADRESSE=$ALERTES node -e 'console.log(JSON.stringify({ type: "email",
    displayName: process.env.NOM, labels: { email_address: process.env.ADRESSE }, enabled: true }))')
  canal=$(trouver notificationChannels "$NOM_CANAL")
  if [[ -z $canal ]]; then
    if [[ $MODE == simulation ]]; then
      creer "$libelle" :
      CANAL=projects/$PROJET/notificationChannels/a-creer
      return 0
    fi
    canal=$(monitoring POST /notificationChannels "$corps")
    CREES=$((CREES + 1))
    printf '  [créé]         %s\n' "$libelle"
  elif [[ $(ADRESSE=$ALERTES json 'j.labels.email_address === process.env.ADRESSE && j.enabled !== false' <<<"$canal") == true ]]; then
    existe "$libelle"
  else
    modifier "$libelle : adresse remise à HIPMASTER_ALERTES, canal réactivé" silencieux monitoring PATCH \
      "/notificationChannels/$(nom_court "$canal")?updateMask=labels,enabled" "$corps"
  fi
  CANAL=$(json 'j.name' <<<"$canal")
}

# Toutes les 15 minutes, depuis 3 régions : 8 640 exécutions par mois, pour 1 million gratuites. /api/v1/sante ne
# touche pas la base, qui peut rester en veille (ADR 0021).
supervision_test() {
  local test corps conforme
  local libelle="test de disponibilité « $NOM_TEST » : GET https://$SITE.web.app/api/v1/sante toutes les 15 minutes, depuis 3 régions"
  corps=$(NOM=$NOM_TEST HOTE=$SITE.web.app PROJET_GCP=$PROJET node -e 'console.log(JSON.stringify({
    displayName: process.env.NOM,
    monitoredResource: { type: "uptime_url", labels: { project_id: process.env.PROJET_GCP, host: process.env.HOTE } },
    httpCheck: { path: "/api/v1/sante", port: 443, useSsl: true, validateSsl: true, requestMethod: "GET",
      acceptedResponseStatusCodes: [{ statusClass: "STATUS_CLASS_2XX" }] },
    contentMatchers: [{ content: "\"statut\":\"ok\"", matcher: "CONTAINS_STRING" }],
    period: "900s", timeout: "30s", selectedRegions: ["EUROPE", "SOUTH_AMERICA", "ASIA_PACIFIC"],
    checkerType: "STATIC_IP_CHECKERS" }))')
  test=$(trouver uptimeCheckConfigs "$NOM_TEST")
  if [[ -z $test ]]; then
    if [[ $MODE == simulation ]]; then
      creer "$libelle" :
      ID_TEST=a-creer
      return 0
    fi
    test=$(monitoring POST /uptimeCheckConfigs "$corps")
    CREES=$((CREES + 1))
    printf '  [créé]         %s\n' "$libelle"
  else
    conforme=$(CIBLE=$corps json '(() => {
      const c = JSON.parse(process.env.CIBLE);
      const meme = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      return j.period === c.period && j.timeout === c.timeout && (j.httpCheck || {}).path === c.httpCheck.path
        && j.monitoredResource.labels.host === c.monitoredResource.labels.host
        && meme([...(j.selectedRegions || [])].sort(), [...c.selectedRegions].sort())
        && meme((j.contentMatchers || []).map((m) => m.content), c.contentMatchers.map((m) => m.content));
    })()' <<<"$test" || true)
    if [[ $conforme == true ]]; then
      existe "$libelle"
    else
      modifier "$libelle (remis à la cible)" silencieux monitoring PATCH \
        "/uptimeCheckConfigs/$(nom_court "$test")?updateMask=httpCheck,period,timeout,contentMatchers,selectedRegions" \
        "$corps"
    fi
  fi
  ID_TEST=$(nom_court "$test")
}

# Alerte quand 2 régions sur 3 échouent deux tours de suite : une indisponibilité qui dure, pas un raté isolé. Les
# alertes sur les métriques des tests de disponibilité restent gratuites.
alerte_site() {
  NOM=$NOM_ALERTE_SITE CANAL=$CANAL TEST=$ID_TEST node -e 'console.log(JSON.stringify({
    displayName: process.env.NOM,
    documentation: { mimeType: "text/markdown",
      content: "Le jeu ne répond plus sur /api/v1/sante depuis au moins 2 régions sur 3, deux tours de suite. Voir docs/exploitation/README.md, section Supervision." },
    combiner: "OR",
    conditions: [{ displayName: "/api/v1/sante en échec depuis 2 régions sur 3",
      conditionThreshold: {
        filter: `metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND metric.label.check_id="${process.env.TEST}" AND resource.type="uptime_url"`,
        aggregations: [{ alignmentPeriod: "1200s", perSeriesAligner: "ALIGN_NEXT_OLDER",
          crossSeriesReducer: "REDUCE_COUNT_FALSE", groupByFields: ["resource.label.host"] }],
        comparison: "COMPARISON_GT", thresholdValue: 1, duration: "1200s", trigger: { count: 1 } } }],
    alertStrategy: { autoClose: "3600s" },
    notificationChannels: [process.env.CANAL], severity: "CRITICAL", enabled: true }))'
}

# Une seule condition sur les journaux pour les trois jobs et leurs tâches planifiées : un échec (ERROR) ou un
# dépassement du seuil de consommation (WARNING) envoie un e-mail, au plus un par heure. Le nom de l'alerte reste celui
# d'US-051 : c'est par lui que le script la retrouve.
alerte_jobs() {
  NOM=$NOM_ALERTE_JOBS CANAL=$CANAL A=$JOB_SAUVEGARDE B=$JOB_CONSOMMATION C=$JOB_PURGE node -e 'console.log(JSON.stringify({
    displayName: process.env.NOM,
    documentation: { mimeType: "text/markdown",
      content: "Sauvegarde, purge ou relevé de consommation en échec, ou consommation Neon au-delà de 70 % du quota du mois. Voir docs/exploitation/README.md, section Supervision." },
    combiner: "OR",
    conditions: [{ displayName: "Avertissement ou erreur d’un job d’exploitation",
      conditionMatchedLog: {
        filter: `(resource.type="cloud_run_job" AND resource.labels.job_name=("${process.env.A}" OR "${process.env.B}" OR "${process.env.C}") AND severity>=WARNING) OR (resource.type="cloud_scheduler_job" AND resource.labels.job_id=("${process.env.A}" OR "${process.env.B}" OR "${process.env.C}") AND severity>=ERROR)` } }],
    alertStrategy: { notificationRateLimit: { period: "3600s" }, autoClose: "86400s" },
    notificationChannels: [process.env.CANAL], severity: "ERROR", enabled: true }))'
}

# supervision_alerte <nom> <corps> : crée la politique d'alerte, ou la remet à la cible (conditions, canal, activée).
supervision_alerte() {
  local nom=$1 corps=$2 politique conforme libelle="alerte « $1 » par e-mail"
  politique=$(trouver alertPolicies "$nom")
  if [[ -z $politique ]]; then
    creer "$libelle" silencieux monitoring POST /alertPolicies "$corps"
    return 0
  fi
  conforme=$(CIBLE=$corps json '(() => {
    const c = JSON.parse(process.env.CIBLE);
    const sans = (conditions) => (conditions || []).map(({ name, ...reste }) => reste);
    const tri = (o) => JSON.stringify(o, (cle, v) => v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort()) : v);
    return tri(sans(j.conditions)) === tri(c.conditions) && j.enabled !== false
      && tri(j.notificationChannels) === tri(c.notificationChannels);
  })()' <<<"$politique" || true)
  if [[ $conforme == true ]]; then
    existe "$libelle"
  else
    modifier "$libelle (remise à la cible)" silencieux monitoring PATCH \
      "/alertPolicies/$(nom_court "$politique")?updateMask=documentation,conditions,combiner,alert_strategy,notification_channels,severity,enabled" \
      "$corps"
  fi
}

# --- Bilan ------------------------------------------------------------------------------------------

bilan() {
  etape "Bilan"
  if [[ $MODE == simulation ]]; then
    info "déjà en place : $EXISTANTS ; à créer ou à modifier : $A_FAIRE (simulation : rien n'a été écrit)."
  else
    info "créés : $CREES ; modifiés : $MODIFIES ; déjà en place : $EXISTANTS."
  fi
  local active_apres
  active_apres=$(configuration_active_du_poste)
  if [[ $active_apres == "$ACTIVE_AVANT" ]]; then
    info "configuration gcloud active du poste inchangée (« ${active_apres:-?} »)."
  else
    alerte "la configuration gcloud active du poste a changé (« $ACTIVE_AVANT » → « $active_apres ») : à vérifier."
  fi
  # Colonnes alignées à la main : printf compte les octets, pas les lettres accentuées.
  etape "Valeurs pour le déploiement (US-050), sans aucun secret"
  printf '  Projet                 %s\n' "$PROJET (n° $NUMERO), région $REGION"
  printf "  Dépôt d'images         %s\n" "$REGION-docker.pkg.dev/$PROJET/$DEPOT_IMAGES"
  printf "  Compte de l'API        %s\n" "$EMAIL_API"
  printf '  Compte de déploiement  %s\n' "$EMAIL_DEPLOIEMENT"
  printf '  Fournisseur WIF        %s\n' \
    "projects/$NUMERO/locations/global/workloadIdentityPools/$POOL/providers/$FOURNISSEUR"
  printf '  Secret de la base      %s\n' "$SECRET (variable DATABASE_URL de l'API)"
  printf '  Clé des codes          %s\n' "$SECRET_CLE (variable CLE_CODES_RECUPERATION de l'API)"
  printf '  Sauvegardes            %s\n' "gs://$BUCKET"
  printf '  Comptes des jobs       %s\n' "$EMAIL_SAUVEGARDE, $EMAIL_CONSOMMATION, $EMAIL_PURGE"
  printf "  Clé de l'API Neon      %s\n" "$SECRET_NEON (variable NEON_CLE_API du job $JOB_CONSOMMATION)"
  printf '  Front                  %s\n' "https://$SITE.web.app"
  printf '  Base Neon              %s\n' \
    "projet ${NEON_ID:-<à créer>}, branche ${BRANCHE_NEON_NOM:-<par défaut>}, base $NEON_BASE, rôle $NEON_ROLE"
}

principal() {
  printf 'HIPMaster : infrastructure Google Cloud, Firebase et Neon (US-049, ADR 0021 et 0024)\n'
  if [[ $MODE == simulation ]]; then printf "Simulation : rien n'est écrit.\n"; fi
  verifier_parametres
  etape_configuration
  etape_projet
  etape_facturation
  etape_api
  etape_artifact_registry
  etape_bucket
  etape_comptes_service
  etape_secret
  etape_wif
  etape_droits_deploiement
  etape_budget
  etape_firebase
  etape_neon
  etape_cle_codes
  etape_sauvegarde
  etape_consommation
  etape_purge
  etape_supervision
  bilan
}

principal
