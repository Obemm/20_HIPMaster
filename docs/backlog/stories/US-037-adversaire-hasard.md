# US-037 — Adversaire au hasard

- **Epic** : EPIC-06
- **Statut** : À affiner
- **Priorité** : Could
- **Taille** : M
- **Branche** : `us-037-adversaire-hasard`

## Récit

En tant que **joueur connecté**, je veux **trouver un adversaire sans connaître personne** afin de **jouer en duel
quand j'en ai envie**.

## Critères d'acceptation

- [ ] « Adversaire au hasard » me place dans les duels ouverts : je rejoins le plus ancien duel en attente d'un
      autre joueur, ou j'en ouvre un s'il n'y en a pas.
- [ ] Je ne tombe jamais contre moi-même, et pas deux fois de suite contre le même joueur si un autre attend.
- [ ] Je peux quitter la file tant que personne ne m'a rejoint.
- [ ] Tests de l'API (appariement, concurrence de deux joueurs qui rejoignent le même duel) et de l'écran.

## Notes

- Pas de classement ni d'appariement par niveau pour l'instant (EPIC-07).

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
