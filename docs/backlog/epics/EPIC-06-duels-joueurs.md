# EPIC-06 — Duels entre joueurs

- **Statut** : À affiner
- **Priorité** : Should

## Objectif

Défier un collègue ou un joueur au hasard. Les duels sont **asynchrones, au tour par tour** (ADR
[0020](../../decisions/0020-duels-asynchrones.md), accepté le 2026-10-19) : chacun joue quand il veut, et la partie avance en
direct si les deux joueurs sont présents.

## Indicateur de réussite

- Un duel entre deux joueurs se termine sans désynchronisation ni triche possible (le serveur fait foi, chacun ne
  voit que sa vue).
- Un joueur sait en un coup d'œil, depuis n'importe quelle page, qu'un duel attend son tour.

## Stories

- [ ] US-032 — Duels côté serveur : créer, rejoindre, jouer à son tour
- [ ] US-033 — Défier un collègue par lien
- [ ] US-034 — Écran de duel
- [ ] US-035 — Mes duels et « à vous de jouer »
- [ ] US-036 — Abandon et forfait
- [ ] US-037 — Adversaire au hasard
- [ ] US-038 — Un booster pour une victoire en duel

Ordre suggéré : US-032, US-033 et US-034 forment le premier duel jouable de bout en bout ; US-035 et US-036 le
rendent vivable au quotidien ; US-037 et US-038 viennent ensuite.

## Hors périmètre

- Tournois, classement (EPIC-07).
- Chat entre joueurs.
- Construction de decks depuis la collection : à traiter dans sa propre story (les duels démarrent avec les decks
  prêtés).
