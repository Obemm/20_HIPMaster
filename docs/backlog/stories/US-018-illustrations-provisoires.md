# US-018 — Illustrations provisoires générées par le code

- **Epic** : EPIC-05
- **Statut** : En cours
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-018-illustrations-provisoires`

## Récit

En tant que **joueur de l'équipe d'intégration**, je veux **que chaque carte ait déjà une illustration simple et
cohérente** afin de **reconnaître les cartes d'un coup d'œil sans attendre le choix d'un générateur d'images**.

## Critères d'acceptation

- [ ] **Quand** je lance `npm run illustrations:provisoires`, **alors** les 71 cartes du set 1 reçoivent un original
      vectoriel rendu en PNG 4:3, décrit dans `set-1.json`, puis décliné par la chaîne d'US-015.
- [ ] Le dessin suit la [direction artistique](../../produit/direction-artistique.md) : fond bleu nuit, palette et
      emblème de la famille, sans texte, lettre, chiffre ni logo ; la **rareté** se lit à l'intensité (halo, anneaux,
      étincelles) et le **type** par un motif secondaire (sort, incident, évolution).
- [ ] Deux cartes de même famille, type et rareté restent **distinctes** (variations tirées du numéro de la carte),
      et une carte donne **toujours la même image** (générateur déterministe).
- [ ] Chaque carte a un texte alternatif ; chaque fichier servi pèse moins de 100 Ko (indicateur d'EPIC-05).
- [ ] Les images sont versionnées : le générateur fait foi, aucun original à archiver.
- [ ] `npm run check`, `npm run build` et `npm run test:e2e` passent, sans violation axe-core.

## Notes

- Décision : [ADR 0015](../../decisions/0015-illustrations-provisoires-vectorielles.md). Le porteur du projet a
  demandé le 2026-10-18 des images simples faites par Claude « pour le moment », en attendant de trancher l'offre
  Recraft (US-016).
- Les images de l'essai Recraft (US-016) restent hors du dépôt : elles appartiennent à Recraft.
- Quand de vraies illustrations arriveront (US-017), elles remplaceront celles-ci carte par carte, par la même chaîne.

## Journal

- 2026-10-18 — création.
