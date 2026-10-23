# US-065 — Des coups de pouce au bon moment

- **Epic** : EPIC-11
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-065-coups-de-pouce`

## Récit

En tant que **joueur débutant**, je veux **être averti quand je m'apprête à finir mon tour en laissant passer une
action utile** afin d'**apprendre les réflexes du jeu sans lire les règles**.

## Contexte

Le constat d'US-039 (une partie perdue sans un seul dégât) vient d'un tour fini sans attaquer. Le serveur fournit déjà
tout ce qu'il faut : la liste des actions possibles du joueur (`vue.actions`) et, pour chaque composant, la raison pour
laquelle il ne peut pas attaquer (`sansAttaque`, US-041). Le front n'invente aucune règle (ADR 0004) : il lit ces
informations et les dit au bon moment.

## Critères d'acceptation

- [ ] **Étant donné** un tour où au moins un de mes composants peut attaquer, **quand** je clique « Finir mon tour »,
      **alors** un message non bloquant le dit (« 2 de vos composants peuvent encore attaquer »), avec « Finir quand
      même » et « Revenir au plateau ».
- [ ] **Étant donné** assez de Débit pour poser une carte de ma main, **quand** je clique « Finir mon tour », **alors**
      le même message le mentionne (« Vous pouvez encore poser Pub/Sub »).
- [ ] **Étant donné** un composant adverse avec Garde, **quand** je choisis un attaquant, **alors** l'écran rappelle
      que ce composant doit tomber avant le SI, et le SI apparaît comme cible indisponible avec sa raison.
- [ ] **Étant donné** un joueur qui a désactivé les coups de pouce (réglage gardé par le navigateur), **alors** plus
      aucun ne s'affiche.
- [ ] Actifs contre le bot comme en duel : ils ne révèlent rien que le joueur ne puisse voir lui-même.
- [ ] Messages annoncés aux lecteurs d'écran, utilisables au clavier et en 375 px ; tests unitaires et parcours e2e.

## Notes

- Aucune nouvelle route d'API : tout vient de la vue renvoyée par le serveur.

## Journal

- 2026-10-23 — création, à la demande du porteur du projet (« un mode tuto ou un bot qui conseille le joueur »).
