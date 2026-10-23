#!/usr/bin/env bash
# Restauration d'une sauvegarde de HIPMaster dans une branche Neon temporaire (US-051, ADR 0033).
#
# La procédure vérifie qu'une sauvegarde du bucket se restaure : elle crée une branche Neon à côté de la production,
# y restaure l'archive dans une base vide, compte les comptes et les collections retrouvés, puis supprime la branche.
# La production n'est jamais modifiée. Guide d'exploitation : docs/exploitation/README.md, « Restaurer ».
#
# Usage, depuis la racine du dépôt (Git Bash sous Windows, ou bash 4 et plus), Docker démarré :
#
#   HIPMASTER_COMPTE=<compte Google> bash scripts/gcp/restaurer.sh [--garder] [objet]
#
#   objet      nom de l'archive dans gs://hipmaster-sauvegardes ; par défaut, la plus récente
#   --garder   garde la branche à la fin (pour y regarder de plus près) ; la supprimer ensuite dans la console Neon
#              ou avec : npx neonctl@8.0.12 branches delete <branche> --project-id <projet>
#
# Paramètres facultatifs : NEON_PROJET=HIPMaster (nom du projet Neon), NEON_ORG (si le compte en a plusieurs).
#
# Sécurité : chaque appel gcloud vise la configuration dédiée « hipmaster », compte et projet vérifiés ; l'archive va
# du bucket à pg_restore par un tube ; l'URL de la branche passe par l'environnement de Docker, jamais par une ligne de
# commande, le disque ni l'écran.

set -Eeuo pipefail

if ((BASH_VERSINFO[0] < 4)); then
  echo "Bash 4 ou plus est nécessaire (Git Bash sous Windows convient)." >&2
  exit 2
fi

readonly PROJET=hipmaster
readonly CONFIGURATION=hipmaster
readonly BUCKET=hipmaster-sauvegardes
readonly NEONCTL=neonctl@8.0.12
readonly BASE=restauration
readonly ROLE=hipmaster
readonly IMAGE=hipmaster-exploitation:local
# Les tables comptées après restauration : comptes, sessions, collections, duels.
readonly TABLES=(joueurs sessions collection recompenses duels invitations)

COMPTE=${HIPMASTER_COMPTE:-}
NEON_PROJET=${NEON_PROJET:-HIPMaster}
NEON_ORG=${NEON_ORG:-}
GARDER=0
OBJET=''
URL_BASE=''
NEON_ID=''
BRANCHE=''

titre() { printf '\n== %s\n' "$*"; }
info() { printf '   %s\n' "$*"; }
arret() {
  printf '\nARRÊT : %s\n' "$*" >&2
  exit 1
}

gc() { gcloud --configuration="$CONFIGURATION" "$@" | tr -d '\r'; }
neon() { npx --yes "$NEONCTL" --no-analytics "$@" </dev/null; }

# json <expression> : évalue une expression JavaScript sur le JSON lu en entrée (variable j).
json() {
  node -e '
    let texte = "";
    process.stdin.on("data", (d) => (texte += d));
    process.stdin.on("end", () => {
      const valeur = new Function("j", `return (${process.argv[1]});`)(JSON.parse(texte));
      if (valeur !== undefined && valeur !== null) console.log(String(valeur));
    });
  ' "$1"
}

# La branche est supprimée à la fin, même après un échec, sauf --garder.
nettoyer() {
  if [[ -n $BRANCHE ]] && ((!GARDER)); then
    printf '\n== Suppression de la branche temporaire %s\n' "$BRANCHE"
    neon branches delete "$BRANCHE" --project-id "$NEON_ID" --output json >/dev/null &&
      printf '   supprimée\n' || printf '   [ATTENTION] à supprimer dans la console Neon\n' >&2
  fi
}
trap nettoyer EXIT

lire_arguments() {
  local argument
  for argument in "$@"; do
    case $argument in
      --garder) GARDER=1 ;;
      -h | --aide | --help)
        awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"
        exit 0
        ;;
      -*) arret "option inconnue : $argument (voir --aide)." ;;
      *) OBJET=$argument ;;
    esac
  done
}

verifier() {
  titre "Vérifications"
  local outil
  for outil in gcloud node npx docker; do
    command -v "$outil" >/dev/null 2>&1 || arret "outil introuvable : $outil."
  done
  [[ $COMPTE =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] ||
    arret "HIPMASTER_COMPTE doit contenir l'adresse du compte Google personnel."
  export CLOUDSDK_ACTIVE_CONFIG_NAME=$CONFIGURATION CLOUDSDK_CORE_ACCOUNT=$COMPTE CLOUDSDK_CORE_PROJECT=$PROJET \
    CLOUDSDK_CORE_DISABLE_PROMPTS=1
  [[ $(gc config get-value core/account 2>/dev/null) == "$COMPTE" ]] ||
    arret "gcloud ne viserait pas le compte $COMPTE : rien n'est fait."
  docker info >/dev/null 2>&1 || arret "Docker ne répond pas : démarrer Docker Desktop, puis relancer."
  # Sans connexion, neonctl ouvrirait le navigateur sans prévenir : mieux vaut s'arrêter.
  local identifiants=${NEON_CONFIG_DIR:-$HOME/.config/neon}
  [[ -n ${NEON_API_KEY:-} || -f $identifiants/credentials.json ]] ||
    arret "neonctl n'est pas connecté : npx $NEONCTL auth, puis relancer."
  info "compte $COMPTE, projet $PROJET ; Docker et neonctl prêts"
}

choisir_archive() {
  titre "Archive à restaurer"
  if [[ -z $OBJET ]]; then
    OBJET=$(gc storage ls "gs://$BUCKET/hipmaster-*.dump" | sort | tail -n 1)
    OBJET=${OBJET##*/}
  fi
  [[ -n $OBJET ]] || arret "aucune sauvegarde dans gs://$BUCKET."
  gc storage objects describe "gs://$BUCKET/$OBJET" --format='value(size,creation_time)' |
    while read -r taille date; do info "gs://$BUCKET/$OBJET : $taille octets, du $date"; done
}

# L'image des jobs d'exploitation, construite sur le poste : le même client PostgreSQL 18 que la sauvegarde.
preparer_image() {
  titre "Client PostgreSQL : image $IMAGE"
  docker build --quiet --tag "$IMAGE" scripts/exploitation >/dev/null
  info "$(docker run --rm "$IMAGE" pg_restore --version)"
}

creer_branche() {
  if [[ -z $NEON_ORG ]]; then
    NEON_ORG=$(neon orgs list --output json | json 'j.length === 1 ? j[0].id : ""')
    [[ -n $NEON_ORG ]] || arret "le compte Neon a plusieurs organisations : préciser NEON_ORG."
  fi
  NEON_ID=$(neon projects list --org-id "$NEON_ORG" --output json |
    NOM=$NEON_PROJET json '(j.projects || j).filter((p) => p.name.toLowerCase() === process.env.NOM.toLowerCase()).map((p) => p.id).join(" ")')
  [[ $NEON_ID =~ ^[a-z0-9-]+$ ]] || arret "projet Neon « $NEON_PROJET » introuvable, ou pas unique."
  local nom
  nom=restauration-$(date -u +%Y%m%d-%H%M%S)
  titre "Branche Neon temporaire $nom (projet $NEON_ID), avec un calcul de 0,25 CU"
  neon branches create --project-id "$NEON_ID" --name "$nom" --output json >/dev/null
  BRANCHE=$nom
  # Une base vide, pour restaurer à partir de rien : la branche, elle, part d'une copie de la production.
  neon databases create --project-id "$NEON_ID" --branch "$BRANCHE" --name "$BASE" --owner-name "$ROLE" \
    --output json >/dev/null
  info "base vide « $BASE » créée sur la branche"
}

# dans_docker <commande…> : exécute la commande dans l'image, connectée à la base restaurée. L'URL passe par
# l'environnement : `-e URL_BASE` sans valeur la lit dans celui de docker.
dans_docker() {
  URL_BASE=$URL_BASE docker run --rm -i -e URL_BASE -e PGSSLROOTCERT=system "$IMAGE" "$@"
}

restaurer() {
  titre "Restauration de $OBJET dans la base « $BASE » de $BRANCHE"
  URL_BASE=$(neon connection-string "$BRANCHE" --project-id "$NEON_ID" --database-name "$BASE" \
    --role-name "$ROLE" --ssl verify-full 2>/dev/null) || arret "neonctl n'a pas fourni l'URL de la branche."
  local debut=$SECONDS
  # Pas de `gc` ici : il retirerait les \r d'un fichier binaire.
  gcloud --configuration="$CONFIGURATION" storage cat "gs://$BUCKET/$OBJET" |
    dans_docker sh -c 'pg_restore --no-owner --no-privileges --exit-on-error --dbname="$URL_BASE"'
  info "restaurée en $((SECONDS - debut)) s"
}

verifier_restauration() {
  titre "Ce que contient la base restaurée"
  local requete='' table
  for table in "${TABLES[@]}"; do
    requete+="${requete:+ union all }select '$table', count(*) from public.$table"
  done
  local lignes
  lignes=$(dans_docker sh -c 'psql "$URL_BASE" --no-psqlrc -At -F " " -c "$1"' _ "$requete")
  printf '%s\n' "$lignes" | while read -r table nombre; do info "$(printf '%-12s %s lignes' "$table" "$nombre")"; done
  local joueurs
  joueurs=$(awk '$1 == "joueurs" { print $2 }' <<<"$lignes")
  ((joueurs > 0)) || arret "aucun compte retrouvé dans la base restaurée."
  info "comptes et collections retrouvés : la sauvegarde se restaure"
}

principal() {
  cd "$(dirname "$0")/../.."
  lire_arguments "$@"
  verifier
  choisir_archive
  preparer_image
  creer_branche
  restaurer
  verifier_restauration
  if ((GARDER)); then
    titre "Branche gardée : $BRANCHE (la supprimer après usage, elle consomme le quota de calcul quand elle sert)"
  fi
}

principal "$@"
