# US-036 — Abandon et forfait

- **Epic** : EPIC-06
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-036-abandon-forfait`

## Récit

En tant que **joueur en duel**, je veux **pouvoir abandonner, et ne pas rester bloqué par un adversaire absent**
afin que **chaque duel finisse un jour**.

## Critères d'acceptation

- [ ] Je peux abandonner un duel en cours, après confirmation : l'adversaire gagne.
- [ ] Sans action du joueur actif pendant 72 heures (réglable), il perd par forfait ; l'échéance est évaluée à la
      lecture (ADR 0020) et affichée aux deux joueurs, sur le plateau et dans « Mes duels » (temps restant).
- [ ] L'issue indique la raison (SLA, tours, abandon, forfait) dans l'écran de fin et dans « Mes duels ».
- [ ] Tests de l'API (abandon, forfait avec horloge injectée) et de l'écran.

## Notes

- Le moteur gagne deux raisons d'issue (`abandon`, `forfait`), ou l'API les porte à côté de l'issue du moteur.

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
