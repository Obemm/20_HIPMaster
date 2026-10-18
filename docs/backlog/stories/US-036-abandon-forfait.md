# US-036 — Abandon et forfait

- **Epic** : EPIC-06
- **Statut** : En revue
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-036-abandon-forfait`

## Récit

En tant que **joueur en duel**, je veux **pouvoir abandonner, et ne pas rester bloqué par un adversaire absent**
afin que **chaque duel finisse un jour**.

## Critères d'acceptation

- [x] Je peux abandonner un duel en cours, après confirmation : l'adversaire gagne.
- [x] Sans action du joueur actif pendant 72 heures (réglable), il perd par forfait ; l'échéance est évaluée à la
      lecture (ADR 0020) et affichée aux deux joueurs, sur le plateau et dans « Mes duels » (temps restant).
- [x] L'issue indique la raison (SLA, tours, abandon, forfait) dans l'écran de fin et dans « Mes duels ».
- [x] Tests de l'API (abandon, forfait avec horloge injectée) et de l'écran.

## Notes

- Le moteur gagne deux raisons d'issue (`abandon`, `forfait`), ou l'API les porte à côté de l'issue du moteur.

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
- 2026-10-19 — moteur : `conceder(etat, perdant, 'abandon' | 'forfait')`, fonction pure, et deux nouvelles raisons
  d'issue. API : `POST /duels/{id}/abandon` ; échéance = dernier coup + 72 h (`delaiTourMs`, réglable), exposée
  dans le duel et dans `GET /moi/duels` ; le forfait est appliqué à la lecture (duel, liste, coup trop tard), par
  une mise à jour conditionnée à la version. Front : « Abandonner » sur le plateau avec confirmation à l'écran,
  échéance affichée (« À vous de jouer dans les 2 j 5 h, sinon forfait »), raison de la fin (abandon, forfait) sur
  l'écran de fin et dans « Mes duels » (« Victoire par forfait », « reste 2 j 1 h »). L'écran de duel interroge
  désormais le serveur pendant toute la partie, pour voir un abandon adverse pendant son propre tour. Tests :
  moteur (2), API (3), écrans (2), e2e (1 : abandon vu par l'adversaire sans recharger).
