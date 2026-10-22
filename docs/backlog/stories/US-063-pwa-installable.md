# US-063 — Installer le jeu sur son téléphone (PWA)

- **Epic** : EPIC-10
- **Statut** : À affiner
- **Priorité** : Could
- **Taille** : S
- **Branche** : `us-063-pwa-installable`

## Récit

En tant que **joueur sur téléphone**, je veux **ajouter HIPMaster à mon écran d'accueil** afin de **le lancer comme
une application, en plein écran, et le retrouver vite**.

## Contexte

L'ADR 0006 annonce un front « livré en PWA » (ADR-016 Elis) ; la revue du 2026-10-22 constate qu'il n'y a ni
manifeste web, ni service worker, ni icônes : le jeu n'est pas installable.

## Critères d'acceptation

- [ ] **Étant donné** le site en ligne, **alors** un manifeste web (nom, couleurs du thème, icônes 192 et 512 px,
      icône masquable, affichage `standalone`) le rend installable sur Android et iOS.
- [ ] **Étant donné** un joueur qui revient, **alors** l'interface et les illustrations se chargent depuis le cache
      du service worker (`@angular/service-worker`), et les appels à `/api/` ne sont jamais mis en cache.
- [ ] **Étant donné** une nouvelle version publiée, **alors** le joueur est invité à recharger au lieu de garder
      indéfiniment l'ancienne.
- [ ] **Étant donné** l'absence de réseau, **alors** un message clair le dit (le jeu se joue en ligne : le serveur
      fait foi, ADR 0004).
- [ ] Audit Lighthouse « installable » au vert.

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (écart entre l'ADR 0006 et le code).
