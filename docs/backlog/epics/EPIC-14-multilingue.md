# EPIC-14 — Un jeu en français et en anglais

- **Statut** : En cours
- **Priorité** : Should

## Objectif

Le porteur du projet veut ouvrir HIPMaster aux collègues anglophones de l’entreprise (décision du 2026-10-24) : le jeu doit
se jouer **en français ou en anglais**, interface comme contenu (cartes, capacités, fiches « En savoir plus », règle).
La documentation du projet, le backlog, les ADR et les commits restent en français (règle du projet).

Orientation proposée par Claude et retenue par le porteur, à consigner dans un ADR après consultation du référentiel
the company (ADR 0005) :

- **interface** : l'i18n native d'Angular (`@angular/localize`, `ng extract-i18n`), une version compilée par langue
  servie sous `/fr/` et `/en/` ; aucun coût à l'exécution, compatible avec la CSP stricte (ADR 0028) et la PWA
  (ADR 0038). Repli étudié : Transloco, si le changement de langue doit être instantané ;
- **contenu du jeu** : traductions dans le domaine (`packages/domain`), par langue et par numéro de carte, le
  français faisant foi et servant de repli ; l'API sert la langue demandée ; les noms de produits ne se traduisent
  pas ;
- **choix de la langue** : celle du navigateur à la première visite, puis un sélecteur FR / EN gardé comme
  préférence du navigateur (ADR 0032) ;
- **traductions** : rédigées par Claude, relues par le porteur ; pas de service de traduction payant.

## Indicateur de réussite

- Un joueur anglophone fait tout le parcours (compte, boosters, collection, partie, duel, fiches) sans croiser un
  mot de français, et inversement.
- Aucune chaîne d'interface en dur : `ng extract-i18n` ne laisse aucun texte sans identifiant, et un contrôle de la CI
  vérifie que chaque langue a toutes ses traductions.
- Les parcours e2e passent dans les deux langues, audit d'accessibilité compris (`lang` juste sur chaque page).

## Stories

- [x] US-079 — Le socle bilingue : i18n d'Angular, deux versions du site et un sélecteur de langue
- [ ] US-080 — Toute l'interface en anglais
- [ ] US-081 — Les cartes, les capacités, les fiches et la règle en anglais
- [ ] US-082 — Des messages d'erreur traduits et des parcours vérifiés dans les deux langues

Ordre : US-079 d'abord (socle et ADR), puis US-080 et US-081 (indépendantes), et US-082 pour finir.

## Hors périmètre

- D'autres langues : le socle doit les permettre, sans les livrer.
- La traduction de la documentation du projet.
