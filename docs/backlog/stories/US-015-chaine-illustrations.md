# US-015 — Chaîne d'import et d'optimisation des illustrations

- **Epic** : EPIC-05
- **Statut** : En revue
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-015-chaine-illustrations`

## Récit

En tant que **porteur du projet**, je veux **déposer l'image originale d'une carte et la voir dans le jeu, optimisée,
en une commande** afin de **pouvoir illustrer les 71 cartes sans retouche à la main ni images trop lourdes**.

## Critères d'acceptation

- [x] **Étant donné** un PNG déposé dans `packages/illustrations/sources/set-1/<numero>.png` et décrit dans
      `packages/illustrations/set-1.json`, **quand** je lance `npm run illustrations`, **alors** quatre fichiers sont
      produits dans `apps/web/public/cartes/set-1/` (AVIF et WebP, en 320 et 640 px de large, au format 4:3).
- [x] Chaque fichier produit pèse **moins de 100 Ko** ; un test le vérifie sur tous les fichiers versionnés.
- [x] Le script refuse, avec un message clair, un original absent, trop petit (moins de 640 px de large) ou une
      entrée sans texte alternatif, et une entrée qui vise un numéro de carte inexistant.
- [x] Le script écrit le manifeste `apps/web/src/app/cartes/illustrations.generated.ts` (numéro → texte alternatif).
- [x] **Étant donné** une carte qui a une illustration, **alors** la vignette l'affiche dans sa zone d'illustration
      (`<picture>`, AVIF puis WebP, `srcset`, `loading="lazy"`, dimensions fixées) avec son texte alternatif ; une
      carte sans illustration garde son fond et son pictogramme de famille.
- [x] Les originaux sont ignorés par Git ; la démarche est expliquée dans `packages/illustrations/README.md`.
- [x] `npm run check`, `npm run build` et `npm run test:e2e` passent, sans violation axe-core.

## Notes

- Décision de stockage et de formats : [ADR 0014](../../decisions/0014-illustrations-statiques-optimisees.md).
- La chaîne ne dépend d'aucun générateur : elle sert à Recraft (US-016, US-017) comme à des images faites à la main.
- Hors périmètre : choisir l'outil et le style (US-016), produire les 71 illustrations (US-017), envoyer les images
  vers Azure (à la mise en ligne, ADR 0008).

## Journal

- 2026-10-18 — création, au découpage d'EPIC-05 ; ADR 0014.
- 2026-10-18 — paquet `@hipmaster/illustrations` (validation de `set-1.json` par Zod, déclinaisons `sharp` en AVIF et
  WebP de 320 et 640 px recadrées en 4:3 sur la zone la plus marquante, qualité abaissée par paliers sous 100 Ko,
  manifeste formaté par Prettier, rien n'est écrit en cas d'erreur, images d'une carte retirée supprimées) ;
  `npm run illustrations` ; jeton `ILLUSTRATIONS_CARTES` et `<picture>` dans `hip-vignette-carte`, pictogramme de
  famille conservé sans image. Essai de bout en bout avec un original de synthèse pour la carte FTP (4 fichiers de 5
  à 11 Ko, AVIF 640 px choisi sur un écran ×2), puis retiré : aucune illustration réelle n'est livrée. 20 tests
  unitaires ajoutés, 18 parcours e2e et audit axe-core au vert. En revue.
