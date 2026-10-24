# 0038 — Jeu installable : manifeste web et service worker d'Angular, jamais l'API en cache

- **Date** : 2026-10-24
- **Statut** : Acceptée (validée par le porteur du projet le 2026-10-24)
- **Référence Elis** : ADR-016 v1 (une application mobile externe est une PWA) — retenu, comme l'annonçait
  l'ADR 0006 ; la v3 en brouillon (publication sur les magasins d'applications) ne s'applique pas.

## Contexte

L'ADR 0006 annonce un front « livré en PWA », mais le site n'avait ni manifeste, ni service worker, ni icônes : il ne
s'installait pas sur l'écran d'accueil d'un téléphone (revue du 2026-10-22). Contraintes : le serveur fait foi
(ADR 0004), un jeu en cache ne doit donc jamais montrer un état périmé de la partie ; CSP stricte (`'self'`
uniquement) ; déploiement continu (ADR 0028) : une nouvelle version doit atteindre les joueurs qui gardent le jeu
ouvert.

## Décision

- **Un manifeste web** (`public/manifest.webmanifest`) : nom, nom court « HIPMaster », `lang` `fr`, affichage
  `standalone`, couleurs de la coquille de nuit (`#0b1029`, ADR 0037), icônes 192 et 512 px et une icône masquable
  (logo dans la zone sûre), tirées du logo.
- **Le service worker d'Angular** (`@angular/service-worker`, `ngsw-config.json`), actif seulement dans le build de
  production, enregistré une fois l'application stable (au plus 30 s après le chargement) :
  - l'interface (HTML, JS, CSS, police, logo, manifeste) est mise en cache dès l'installation ;
  - les illustrations et les icônes à la demande ;
  - **aucun `dataGroup`** : les appels à `/api/` passent toujours par le réseau, jamais par le cache ; une
    navigation vers `/api/` n'est pas non plus servie par `index.html`.
- **Mise à jour** : le service worker cherche une nouvelle version à chaque chargement et à chaque retour sur
  l'onglet ; quand elle est prête, un bandeau propose « Recharger ».
- **Hors ligne** : l'interface s'ouvre depuis le cache et un bandeau dit que le jeu se joue en ligne (vos cartes et
  vos parties sont gardées par le serveur) ; chaque écran garde ses messages de panne (US-055).
- **Tests** : les parcours e2e bloquent le service worker (ses requêtes échapperaient aux pannes simulées par
  `page.route`) ; un parcours dédié le réactive et vérifie, sur le build de production, l'installabilité selon Chrome
  (`Page.getInstallabilityErrors`), l'ouverture hors ligne et l'absence de l'API dans le cache. Lighthouse n'a plus de
  catégorie PWA depuis sa version 12 : ce contrôle de Chrome la remplace.

## Alternatives envisagées

- **Un service worker écrit à la main** ou **Workbox** : plus de liberté, mais à maintenir et à tester soi-même ;
  celui d'Angular suit les versions du build (empreintes, `ngsw.json`) et gère les mises à jour.
- **Mettre en cache certaines lectures de l'API** (catalogue, niveaux) : plus rapide hors ligne, mais le jeu ne se
  joue pas hors ligne, et le catalogue a déjà son cache HTTP (US-057) ; le risque d'un état périmé l'emporte.
- **Publier dans les magasins d'applications** (TWA, Capacitor) : hors de propos pour un jeu sur invitation.

## Conséquences

- Environ 17 Ko de JavaScript en plus au premier chargement (module du service worker) ; le bundle initial reste
  sous le budget (455 Ko).
- `ngsw-worker.js` et `ngsw.json` doivent rester revalidés à chaque visite : c'est déjà le cas (`no-cache` de tout
  sauf `/api/**` dans `firebase.json`). Pour couper le service worker en urgence, publier `safety-worker.js` (fourni
  par Angular) sous le nom `ngsw-worker.js`.
- Un joueur qui garde le jeu ouvert reçoit la nouvelle version au prochain « Recharger », plus tôt qu'avant (il
  devait recharger de lui-même).
