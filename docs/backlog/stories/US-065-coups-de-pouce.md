# US-065 — Des coups de pouce au bon moment

- **Epic** : EPIC-11
- **Statut** : Faite
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

- [x] **Étant donné** un tour où au moins un de mes composants peut attaquer, **quand** je clique « Finir mon tour »,
      **alors** un message non bloquant le dit (« 2 de vos composants peuvent encore attaquer »), avec « Finir quand
      même » et « Revenir au plateau ».
- [x] **Étant donné** assez de Débit pour poser une carte de ma main, **quand** je clique « Finir mon tour », **alors**
      le même message le mentionne (« Vous pouvez encore poser Pub/Sub »).
- [x] **Étant donné** un composant adverse avec Garde, **quand** je choisis un attaquant, **alors** l'écran rappelle
      que ce composant doit tomber avant le SI, et le SI apparaît comme cible indisponible avec sa raison.
- [x] **Étant donné** un joueur qui a désactivé les coups de pouce (réglage gardé par le navigateur), **alors** plus
      aucun ne s'affiche.
- [x] Actifs contre le bot comme en duel : ils ne révèlent rien que le joueur ne puisse voir lui-même.
- [x] Messages annoncés aux lecteurs d'écran, utilisables au clavier et en 375 px ; tests unitaires et parcours e2e.

## Notes

- Aucune nouvelle route d'API : tout vient de la vue renvoyée par le serveur.
- Choix retenus :
  - **Avant de finir** : « Finir mon tour » ouvre, s'il reste quelque chose à faire, un message non modal au bas de
    l'écran (`role="alertdialog"`, focus sur « Revenir au plateau », Échap y revient), avec « Finir quand même ». Ce
    qui reste à faire vient seulement de `vue.actions` : les actions `attaquer` (composants qui peuvent encore
    attaquer) et les actions qui posent ou jouent une carte de la main (`poser`, `evoluer`, `jouer`, `router`,
    `migrer`) ; décommissionner ne compte pas, ce n'est pas un oubli.
  - **Garde** : quand un attaquant est choisi et que le serveur ne propose pas le SI comme cible, le bouton du SI dit
    « Indisponible », avec « Garde » si un composant adverse visible porte cette capacité ; le détail de l'attaquant
    rappelle que ce composant doit tomber avant le SI. Le front ne décide d'aucune cible (ADR 0004).
  - **Réglage** : une case « Coups de pouce » dans l'aide « Comment jouer ? », gardée par le navigateur
    ([ADR 0032](../../decisions/0032-preferences-interface-navigateur.md)) ; décochée, ni message, ni rappel, ni
    avertissement d'attaques oubliées (US-039).

## Journal

- 2026-10-23 — création, à la demande du porteur du projet (« un mode tuto ou un bot qui conseille le joueur »).
- 2026-10-23 — affinée et commencée (lot 2, session front) : choix notés ci-dessus.
- 2026-10-23 — livrée : message non bloquant avant « Finir mon tour » (attaques et cartes encore possibles d'après vue.actions), SI « Indisponible : Garde » et rappel de Garde, réglage dans l'aide gardé par le navigateur, actifs en duel (ADR 0032)
