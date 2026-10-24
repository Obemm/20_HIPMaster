# EPIC-11 — Apprendre à jouer

- **Statut** : En cours
- **Priorité** : Should

## Objectif

Qu'un collègue qui n'a jamais joué comprenne les règles et gagne sa première partie contre le bot facile sans lire de
documentation. Les règles sont riches (Débit, Garde, riposte, capacités), et les constats concordent :

- US-039 : une partie perdue sans un seul dégât infligé, faute de savoir qu'il faut choisir l'attaquant et sa cible ;
- étude par simulation du 2026-10-22 : un débutant ne gagnait que 14 % de ses parties contre l'ancien niveau
  « facile » ;
- US-064 a créé un vrai niveau facile, « Stagiaire ». Reste à apprendre à jouer **en jouant**.

## Indicateur de réussite

- Un joueur qui suit les conseils bat Stagiaire au moins 85 % du temps (mesuré par simulation).
- Un joueur ne finit plus un tour sans attaquer, alors qu'il le pouvait, sans en avoir été averti.
- La première partie guidée se termine en moins de 5 minutes.

## Stories

- [x] US-065 — Des coups de pouce au bon moment
- [x] US-066 — Un conseil à la demande, contre le bot
- [ ] US-067 — Une première partie guidée

Ordre suggéré : US-065 et US-066 avant d'envoyer les invitations (lot 2), une fois le lot 1 d'EPIC-09 terminé. Puis
US-067, après le plateau mobile (US-059), pour ne pas refaire les bulles d'aide quand le plateau changera.

## Décisions

- Le conseil n'est donné que **contre le bot**, jamais en duel : un duel reste un face-à-face (porteur du projet,
  2026-10-23).
- Les coups de pouce restent actifs partout, duels compris : ils ne disent que ce que le joueur pourrait voir
  lui-même.

## Hors périmètre

- Un assistant conversationnel (LLM) qui commenterait la partie.
- Le mode « Certification » (questionnaire tiré des textes des cartes), gardé pour plus tard dans la vision produit.
