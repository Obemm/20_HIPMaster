#!/usr/bin/env bash
# GitHub settings of the repository (US-094, ADR 0053): a protected main, the project owner's review on every
# contribution, the CI of forks waiting for their approval, and the free protections of a public repository.
# Idempotent: rerun it after changing a setting here, or to put back a setting changed by hand.
#
# Usage, from the root of the repository (Git Bash on Windows, or bash 4 and later), with the GitHub CLI signed in
# as the repository admin:
#
#   bash scripts/github/configurer-depot.sh [owner/name]
#
# Guide: docs/exploitation/README.md, "GitHub settings".
set -euo pipefail

DEPOT="${1:-Obemm/20_HIPMaster}"

# Job names of .github/workflows/ci.yml, required on every pull request: rename them here with the jobs.
CONTROLES_CI=(
  'Lint, format, types, tests unitaires et build'
  "Tests de l'API sur PostgreSQL 18"
  'Parcours, accessibilité et CSP sur le build de production (Playwright)'
  'Équilibrage des cartes nouvelles (simulation)'
)
# GitHub Actions, the app that reports these checks.
ID_GITHUB_ACTIONS=15368
# Built-in repository role "admin".
ROLE_ADMIN=5

etape() { printf '\n== %s\n' "$1"; }

# Creates the ruleset named $1 from the JSON on stdin, or updates it if it exists.
appliquer_ruleset() {
  local nom="$1" corps id
  corps="$(cat)"
  id="$(gh api "repos/$DEPOT/rulesets" --jq ".[] | select(.name == \"$nom\") | .id")"
  if [[ -n "$id" ]]; then
    gh api -X PUT "repos/$DEPOT/rulesets/$id" --input - <<<"$corps" >/dev/null
    echo "ruleset « $nom » updated"
  else
    gh api -X POST "repos/$DEPOT/rulesets" --input - <<<"$corps" >/dev/null
    echo "ruleset « $nom » created"
  fi
}

etape 'Merge options: squash only, merged branches deleted'
gh api -X PATCH "repos/$DEPOT" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true >/dev/null

etape 'Ruleset main — integrity (no bypass)'
controles=''
for controle in "${CONTROLES_CI[@]}"; do
  controles+="${controles:+,}{\"context\":\"$controle\",\"integration_id\":$ID_GITHUB_ACTIONS}"
done
appliquer_ruleset 'main — integrity' <<JSON
{
  "name": "main — integrity",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["squash"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [$controles]
      }
    }
  ]
}
JSON

etape 'Ruleset main — owner review (the admin may bypass it through a pull request)'
appliquer_ruleset 'main — owner review' <<JSON
{
  "name": "main — owner review",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [{ "actor_id": $ROLE_ADMIN, "actor_type": "RepositoryRole", "bypass_mode": "pull_request" }],
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["squash"]
      }
    }
  ]
}
JSON

etape 'CI of forks: approval for every external contributor'
gh api -X PUT "repos/$DEPOT/actions/permissions/fork-pr-contributor-approval" \
  -f approval_policy=all_external_contributors >/dev/null

etape 'Environment production: main only'
gh api -X PUT "repos/$DEPOT/environments/production" --input - >/dev/null <<'JSON'
{ "deployment_branch_policy": { "protected_branches": false, "custom_branch_policies": true } }
JSON
if [[ -z "$(gh api "repos/$DEPOT/environments/production/deployment-branch-policies" \
  --jq '.branch_policies[] | select(.name == "main" and .type == "branch") | .id')" ]]; then
  gh api -X POST "repos/$DEPOT/environments/production/deployment-branch-policies" \
    -f name=main -f type=branch >/dev/null
fi

etape 'Security of the public repository'
gh api -X PATCH "repos/$DEPOT" --input - >/dev/null <<'JSON'
{
  "security_and_analysis": {
    "secret_scanning": { "status": "enabled" },
    "secret_scanning_push_protection": { "status": "enabled" }
  }
}
JSON
gh api -X PUT "repos/$DEPOT/private-vulnerability-reporting" >/dev/null
gh api -X PUT "repos/$DEPOT/vulnerability-alerts" >/dev/null
gh api -X PUT "repos/$DEPOT/automated-security-fixes" >/dev/null

etape 'Done'
gh api "repos/$DEPOT/rulesets" --jq '.[] | "ruleset: \(.name) (\(.enforcement))"'
