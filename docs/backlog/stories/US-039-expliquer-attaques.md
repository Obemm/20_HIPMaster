# US-039 — Expliquer les attaques et la résolution des combats

- **Epic** : EPIC-04
- **Statut** : En cours
- **Priorité** : Must
- **Taille** : S
- **Branche** : `us-039-expliquer-attaques`

## Récit

En tant que **joueur débutant**, je veux **comprendre que je dois choisir moi-même un attaquant et sa cible à chaque
tour, et comment un combat se résout** afin de **faire des dégâts à l'adversaire au lieu de me contenter de poser
des cartes**.

## Critères d'acceptation

- [x] `docs/produit/regles.md` dit explicitement que rien n'attaque tout seul (sauf les agents Autonomes) : à chaque
      tour, on choisit l'attaquant puis la cible, en plus de poser des cartes.
- [x] `docs/produit/regles.md` décrit la résolution d'une attaque, étape par étape (conditions, forces avec Hub,
      échange simultané, Diffusion et Réactif, destructions), conforme au moteur (`packages/domain/src/combat`).
- [x] Des exemples chiffrés avec des cartes du set 1 : échange qui détruit les deux cartes, attaque du SI avec un
      Hub, Garde et dégâts persistants, Réactif, Évolution.
- [ ] La règle courte du jeu (`hip-regle-courte`) dit qu'il faut, à chaque tour, sélectionner l'attaquant puis la
      cible, et renvoie vers un exemple court de combat (riposte).
- [ ] Avant de finir son tour, le joueur qui a des composants prêts à attaquer et n'a pas attaqué en est averti
      (sans bloquer la fin du tour).
- [ ] Tests de l'écran ; `npm run check` passe ; `npm run test:e2e` passe.

## Notes

- Retour du porteur du projet après une partie perdue sans avoir infligé un seul dégât (journal du 2026-10-19) : il
  posait ses cartes sans jamais lancer d'attaque, ne sachant pas qu'il fallait les sélectionner.
- La partie « dans le jeu » attend qu'US-034 (écran de duel) soit commitée : elle modifie aussi
  `apps/web/src/app/jeu/regle-courte.ts` (décision du porteur du projet, 2026-10-19).
- Aucune règle de jeu côté front (ADR 0004) : l'avertissement s'appuie sur les actions `attaquer` proposées par la
  vue de l'API.
- Piste : le journal pourrait aussi afficher le paiement de l'entretien Sur site, déjà noté par le moteur (événement
  `entretien`).

## Journal

- 2026-10-19 — création, après le retour du porteur du projet. Règles complétées : « rien n'attaque tout seul »,
  section « Résoudre un combat » et cinq exemples vérifiés dans le moteur. La partie dans le jeu attend US-034.
