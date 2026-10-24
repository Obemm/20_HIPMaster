# US-063 — Installer le jeu sur son téléphone (PWA)

- **Epic** : EPIC-10
- **Statut** : Faite
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

- [x] **Étant donné** le site en ligne, **alors** un manifeste web (nom, couleurs du thème, icônes 192 et 512 px,
      icône masquable, affichage `standalone`) le rend installable sur Android et iOS.
- [x] **Étant donné** un joueur qui revient, **alors** l'interface et les illustrations se chargent depuis le cache
      du service worker (`@angular/service-worker`), et les appels à `/api/` ne sont jamais mis en cache.
- [x] **Étant donné** une nouvelle version publiée, **alors** le joueur est invité à recharger au lieu de garder
      indéfiniment l'ancienne.
- [x] **Étant donné** l'absence de réseau, **alors** un message clair le dit (le jeu se joue en ligne : le serveur
      fait foi, ADR 0004).
- [x] Installable selon Chrome : `Page.getInstallabilityErrors` ne renvoie aucune erreur (Lighthouse n'a plus de
      catégorie PWA depuis sa version 12 : ce contrôle de Chrome remplace son audit « installable »).

## Décisions (ADR 0038)

- **Service worker d'Angular**, actif seulement en production : interface en cache dès l'installation,
  illustrations et icônes à la demande, **aucun appel à l'API en cache** (pas de `dataGroup`).
- **Mise à jour** : vérifiée à chaque chargement et à chaque retour sur l'onglet ; un bandeau « Une nouvelle version
  de HIPMaster est prête » propose « Recharger ».
- **Hors ligne** : l'interface s'ouvre depuis le cache ; un bandeau dit « Pas de réseau. HIPMaster se joue en
  ligne… » et disparaît au retour du réseau.
- **Icônes** tirées du logo d'US-061, sur la nuit ; l'icône masquable garde le logo dans la zone sûre.
- **Tests** : les parcours e2e bloquent le service worker (il échapperait aux pannes simulées) ; `pwa.spec.ts` le
  réactive et vérifie le manifeste, les icônes, l'installabilité et, sur le build de production, l'ouverture hors
  ligne et l'absence de l'API dans le cache.

## Captures

- [Bandeau hors ligne sur téléphone](../../produit/captures/us-063-hors-ligne.jpg)
- [Icônes de l'écran d'accueil](../../produit/captures/us-063-icones.png)

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (écart entre l'ADR 0006 et le code).
- 2026-10-24 — affinée et commencée (session de nuit) : ADR 0038.
- 2026-10-24 — livrée : Manifeste web et icônes, service worker d'Angular en production (interface et illustrations en cache, jamais l'API), bandeaux « nouvelle version » et « pas de réseau », installabilité et ouverture hors ligne vérifiées en e2e sur le build de production.
