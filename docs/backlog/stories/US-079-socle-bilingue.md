# US-079 — Le socle bilingue : i18n d'Angular, deux versions du site et un sélecteur de langue

- **Epic** : EPIC-14
- **Statut** : Faite
- **ADR** : [0042](../../decisions/0042-site-bilingue-i18n-angular.md)
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-079-socle-bilingue`

## Récit

En tant que **collègue anglophone**, je veux **que le site s'ouvre dans ma langue et que je puisse en changer**
afin de **jouer sans barrière de langue**.

## Critères d'acceptation

- [x] Un ADR, après consultation du référentiel the company (ADR 0005), fixe l'outil (i18n native d'Angular, ou Transloco
      si l'analyse le justifie), l'organisation des traductions et la place du français comme langue de référence.
      → [ADR 0042](../../decisions/0042-site-bilingue-i18n-angular.md) : `@angular/localize`, traductions JSON dans
      `apps/web/src/locale/`, le français langue source ; [ref] the company (Localazy) adapté.
- [x] **Étant donné** le build de production, **alors** une version française et une version anglaise sont produites
      et servies par Firebase Hosting (`/fr/`, `/en/`, et la racine qui redirige selon la langue du navigateur),
      sous la même CSP stricte, avec la PWA fonctionnelle dans les deux langues.
      → `npm run build` compile les deux langues puis `scripts/langues/assembler-site.ts` assemble le site (fichiers
      communs à la racine, manifeste et `ngsw.json` par langue, `index.html` anglais, page de la racine) ;
      `e2e/langues.spec.ts` et `e2e/pwa.spec.ts` sur le build de production, sans violation de CSP.
- [x] **Étant donné** un joueur, **quand** il choisit FR ou EN dans un sélecteur accessible, **alors** il bascule
      sur la même page dans l'autre langue, et ce choix est gardé (préférence du navigateur, ADR 0032).
      → `hip-choix-langue` dans le bandeau (`aria-current`, `lang`, `hreflang`, 44 px), `hipmaster.langue` relu par la
      page de la racine ; audit axe de la page en anglais.
- [x] `lang` est juste sur chaque page ; la CI échoue si une traduction manque.
      → `lang` posé par Angular sur chaque version ; `i18nMissingTranslation: error` au build et
      `npm run i18n:verifier` (extraction à jour, ni traduction manquante ni orpheline) dans la CI.
- [x] Le déploiement continu (ADR 0028) publie les deux versions.
      → `firebase.json` (réécritures par langue, cache immuable dans les sous-dossiers) ; l'étape `site` de
      `deployer.sh` vérifie `/`, `/fr/` et `/en/` après chaque publication.

## Notes

- Les anciens joueurs ont un service worker à la racine : il y est remplacé par le `safety-worker.js` d'Angular, qui
  se désinstalle et recharge la page une fois.
- Les anciens liens sans langue (invitations, duels partagés) passent par la page de la racine et gardent leur page,
  leurs paramètres et leur ancre.
- En dehors du sélecteur (« Langue »), l'interface reste en français dans la version anglaise : sa traduction est
  US-080.

## Journal

- 2026-10-24 — création, à la demande du porteur du projet (EPIC-14).
- 2026-10-24 — Vérifié : CI de la PR #88 verte (parcours e2e et CSP sur le build de production compris).
- 2026-10-24 — ADR 0042 (référentiel the company consulté : [ref] Localazy adapté, [ref] et [ref] retenus),
  i18n d'Angular, `/fr/` et `/en/`, page de la racine, sélecteur, contrôle des traductions dans la CI.
- 2026-10-24 — livrée : Deux versions du site (/fr/, /en/) par l'i18n d'Angular, page de la racine qui choisit la langue, sélecteur FR / EN, contrôle des traductions dans la CI (ADR 0042)
