# US-082 — Des messages d'erreur traduits et des parcours vérifiés dans les deux langues

- **Epic** : EPIC-14
- **Statut** : Faite
- **ADR** : [0042](../../decisions/0042-site-bilingue-i18n-angular.md), [0043](../../decisions/0043-contenu-traduit-domaine-langue-api.md)
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-082-erreurs-parcours-bilingues`

## Récit

En tant que **joueur**, je veux **comprendre les erreurs dans ma langue** afin de **savoir quoi faire quand une
action est refusée**.

## Critères d'acceptation

- [x] Les erreurs de l'API (Problem Details) portent un code stable que le front traduit ; le texte français reste
      en repli.
      → `apps/api/src/problemes.ts` : chaque erreur porte `code` (raison du refus, code du moteur pour une action
      refusée, `requete-invalide`, `trop-de-requetes`…), décrit dans chaque contrat OpenAPI ; le front traduit les
      refus d'action par code (`reseau/probleme.ts`) et garde le texte français de l'API en repli. Les autres
      messages d'erreur du front, choisis d'après le statut HTTP, sont traduits depuis US-080.
- [x] Les parcours e2e principaux tournent dans les deux langues, audit d'accessibilité compris.
      → `e2e/parcours-anglais.spec.ts` (compte, booster, collection, carte et fiche, partie contre le bot, partie
      guidée) et `e2e/langues.spec.ts` en anglais ; la série existante couvre le français.
- [x] Le guide d'exploitation et le CHANGELOG disent comment ajouter une langue.
      → « Les langues du jeu » dans `docs/exploitation/README.md`.

## Journal

- 2026-10-24 — création, à la demande du porteur du projet (EPIC-14).
- 2026-10-24 — codes d'erreur stables, refus d'action traduits par code, parcours anglais, guide pour ajouter une
  langue.
- 2026-10-24 — livrée : Codes d'erreur stables dans chaque Problem Details, refus d'action traduits par code, parcours principaux vérifiés en anglais, guide pour ajouter une langue
