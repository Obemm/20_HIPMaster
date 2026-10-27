# US-029 — Relire une carte proposée dans sa pull request

- **Epic** : EPIC-08
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-029-relecture-pr-carte`

## Récit

En tant que **porteur du projet**, je veux **relire chaque carte proposée dans sa PR avec une liste de contrôle**
afin de **ne publier que des cartes justes, équilibrées et sans contenu sensible**.

## Critères d'acceptation

- [ ] Un modèle de PR « carte » (`.github/PULL_REQUEST_TEMPLATE/carte.md`) porte la proposition et la liste de
      contrôle : exactitude technique, texte « En vrai » compréhensible, confidentialité, pas de doublon avec une
      carte existante, équilibrage plausible, illustration conforme, original joint.
- [ ] Un fichier `CODEOWNERS` demande la relecture du porteur du projet sur toute PR.
- [ ] La CI d'une PR venant d'un fork vérifie les invariants du catalogue (`npm run check`) sans aucun secret.
- [ ] L'équilibrage d'une carte proposée se vérifie par une simulation courte (decks prêtés, niveaux du bot), lancée
      en CI ou par le relecteur ; la démarche est décrite dans le guide.
- [ ] Le guide (US-027) indique les réponses possibles et le délai visé (moins de deux semaines) : fusionnée, à
      retravailler, refusée avec un motif.

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md). Remplace la file de relecture dans le jeu
  du plan initial (rôle de relecteur, statuts en base, routes protégées).
- `npm run simuler -- 200` prend 10 à 30 minutes : trop long pour chaque PR ; prévoir un volume réduit.

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard).
- 2026-10-27 — affinage (ADR 0050) : la relecture se fait dans la PR GitHub, plus dans le jeu.
