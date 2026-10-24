# US-079 — Le socle bilingue : i18n d'Angular, deux versions du site et un sélecteur de langue

- **Epic** : EPIC-14
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-079-socle-bilingue`

## Récit

En tant que **collègue anglophone**, je veux **que le site s'ouvre dans ma langue et que je puisse en changer**
afin de **jouer sans barrière de langue**.

## Critères d'acceptation

- [ ] Un ADR, après consultation du référentiel the company (ADR 0005), fixe l'outil (i18n native d'Angular, ou Transloco
      si l'analyse le justifie), l'organisation des traductions et la place du français comme langue de référence.
- [ ] **Étant donné** le build de production, **alors** une version française et une version anglaise sont produites
      et servies par Firebase Hosting (`/fr/`, `/en/`, et la racine qui redirige selon la langue du navigateur),
      sous la même CSP stricte, avec la PWA fonctionnelle dans les deux langues.
- [ ] **Étant donné** un joueur, **quand** il choisit FR ou EN dans un sélecteur accessible, **alors** il bascule
      sur la même page dans l'autre langue, et ce choix est gardé (préférence du navigateur, ADR 0032).
- [ ] `lang` est juste sur chaque page ; la CI échoue si une traduction manque.
- [ ] Le déploiement continu (ADR 0028) publie les deux versions.

## Journal

- 2026-10-24 — création, à la demande du porteur du projet (EPIC-14).
