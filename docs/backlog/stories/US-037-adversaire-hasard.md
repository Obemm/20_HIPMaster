# US-037 — Adversaire au hasard

- **Epic** : EPIC-06
- **Statut** : Faite
- **Priorité** : Could
- **Taille** : M
- **Branche** : `us-037-adversaire-hasard`

## Récit

En tant que **joueur connecté**, je veux **trouver un adversaire sans connaître personne** afin de **jouer en duel
quand j'en ai envie**.

## Critères d'acceptation

- [x] « Adversaire au hasard » me place dans les duels ouverts : je rejoins le plus ancien duel en attente d'un
      autre joueur, ou j'en ouvre un s'il n'y en a pas.
- [x] Je ne tombe jamais contre moi-même, et pas deux fois de suite contre le même joueur si un autre attend.
- [x] Je peux quitter la file tant que personne ne m'a rejoint.
- [x] Tests de l'API (appariement, concurrence de deux joueurs qui rejoignent le même duel) et de l'écran.

## Notes

- Pas de classement ni d'appariement par niveau pour l'instant (EPIC-07).

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
- 2026-10-19 — colonne `duels.ouvert` (migration `0006_duels_ouverts`) : un duel ouvert forme la file, un défi
  privé (lien) n'est jamais proposé au hasard. `POST /duels/hasard` : rejoint le plus ancien duel ouvert d'un autre
  joueur en évitant si possible le dernier adversaire (`SKIP LOCKED` contre les rejoints simultanés), sinon ouvre un
  duel (201) ; déjà dans la file, on y garde sa place. Front : « un adversaire au hasard » depuis « Jouer »
  (`/duels/hasard`, même écran que le défi), écran « Recherche d'un adversaire… » avec « Quitter la file ». Tests :
  API (5, dont la concurrence), écrans (3), e2e (3, profil bureau seulement et en série : file commune).
- 2026-10-19 — livrée : Adversaire au hasard : file des duels ouverts, défis privés à part
