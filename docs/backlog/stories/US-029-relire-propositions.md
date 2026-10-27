# US-029 — Relire une carte proposée dans sa pull request

- **Epic** : EPIC-08
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-029-relecture-pr-carte`

## Récit

En tant que **porteur du projet**, je veux **relire chaque carte proposée dans sa PR avec une liste de contrôle**
afin de **ne publier que des cartes justes, équilibrées et sans contenu sensible**.

## Critères d'acceptation

- [x] Un modèle de PR « carte » (`.github/PULL_REQUEST_TEMPLATE/carte.md`) porte la proposition et la liste de
      contrôle : exactitude technique, texte « En vrai » compréhensible, confidentialité, pas de doublon avec une
      carte existante, équilibrage plausible, illustration conforme, original joint.
- [x] Un fichier `CODEOWNERS` demande la relecture du porteur du projet sur toute PR.
- [x] La CI d'une PR venant d'un fork vérifie les invariants du catalogue (`npm run check`) sans aucun secret.
- [x] L'équilibrage d'une carte proposée se mesure par simulation (`npm run simuler:carte`, deux exemplaires dans
      chaque deck prêté contre les trois decks, méthode d'US-077), lancée en CI sur chaque PR pour les cartes
      nouvelles et affichée dans le résumé du job ; la démarche est décrite dans le guide.
- [x] Le guide (US-027) indique les réponses possibles et le délai visé (moins de deux semaines) : fusionnée, à
      retravailler, refusée avec un motif.

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md). Remplace la file de relecture dans le jeu
  du plan initial (rôle de relecteur, statuts en base, routes protégées).
- `npm run simuler -- 200` prend 10 à 30 minutes : trop long pour chaque PR ; prévoir un volume réduit.

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard).
- 2026-10-27 — affinage (ADR 0050) : la relecture se fait dans la PR GitHub, plus dans le jeu.
- 2026-10-27 — `scripts/simuler-carte.ts` : 400 parties par duel, une minute et demie par carte ; le signal est un
  écart de 10 points ou plus entre le deck inchangé et le deck avec la carte (et non des bornes absolues : la
  référence elle-même varie de quelques points). Essayé sur les cartes 72 à 74 retrouvées par `--base` (catalogue
  d'avant US-077) : API GraphQL fait gagner nettement plus le deck Héritage (+17 à +23 points à 100 parties), ce
  que la mesure d'US-077, faite dans le seul deck Moderne, ne montrait pas. Confirmé à 400 parties sur les graines 1
  et 2 : Héritage +13 à +18 points contre chaque deck, Moderne et Hybride +1 à +10. À examiner hors de cette story
  (la carte, ou les cartes qu'elle remplace dans Héritage).
- 2026-10-27 — `CODEOWNERS` demande la relecture du porteur du projet ; la protection de branche (relecture
  obligatoire) n'est pas activée : seul le porteur du projet peut fusionner.
- 2026-10-27 — livrée : Modèle de PR carte (vérifications du contributeur, liste de contrôle du relecteur), CODEOWNERS, script simuler:carte et job de CI Équilibrage des cartes nouvelles ; guides mis à jour.
