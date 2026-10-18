# US-015 — Chaîne d'import et d'optimisation des illustrations

- **Epic** : EPIC-05
- **Statut** : En cours
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-015-chaine-illustrations`

## Récit

En tant que **porteur du projet**, je veux **déposer l'image originale d'une carte et la voir dans le jeu, optimisée,
en une commande** afin de **pouvoir illustrer les 71 cartes sans retouche à la main ni images trop lourdes**.

## Critères d'acceptation

- [ ] **Étant donné** un PNG déposé dans `packages/illustrations/sources/set-1/<numero>.png` et décrit dans
      `packages/illustrations/set-1.json`, **quand** je lance `npm run illustrations`, **alors** quatre fichiers sont
      produits dans `apps/web/public/cartes/set-1/` (AVIF et WebP, en 320 et 640 px de large, au format 4:3).
- [ ] Chaque fichier produit pèse **moins de 100 Ko** ; un test le vérifie sur tous les fichiers versionnés.
- [ ] Le script refuse, avec un message clair, un original absent, trop petit (moins de 640 px de large) ou une
      entrée sans texte alternatif, et une entrée qui vise un numéro de carte inexistant.
- [ ] Le script écrit le manifeste `apps/web/src/app/cartes/illustrations.generated.ts` (numéro → texte alternatif).
- [ ] **Étant donné** une carte qui a une illustration, **alors** la vignette l'affiche dans sa zone d'illustration
      (`<picture>`, AVIF puis WebP, `srcset`, `loading="lazy"`, dimensions fixées) avec son texte alternatif ; une
      carte sans illustration garde son fond et son pictogramme de famille.
- [ ] Les originaux sont ignorés par Git ; la démarche est expliquée dans `packages/illustrations/README.md`.
- [ ] `npm run check`, `npm run build` et `npm run test:e2e` passent, sans violation axe-core.

## Notes

- Décision de stockage et de formats : [ADR 0014](../../decisions/0014-illustrations-statiques-optimisees.md).
- La chaîne ne dépend d'aucun générateur : elle sert à Recraft (US-016, US-017) comme à des images faites à la main.
- Hors périmètre : choisir l'outil et le style (US-016), produire les 71 illustrations (US-017), envoyer les images
  vers Azure (à la mise en ligne, ADR 0008).

## Journal

- 2026-10-18 — création, au découpage d'EPIC-05 ; ADR 0014.
