# US-069 — Un score et un classement

- **Epic** : EPIC-07
- **Statut** : À affiner
- **Priorité** : Could
- **Taille** : L
- **Branche** : `us-069-score-classement`

## Récit

En tant que **joueur**, je veux **un score qui reflète mes progrès et un classement entre collègues** afin d'**avoir
envie de revenir et de me comparer**.

## Critères d'acceptation

- [ ] **Étant donné** la règle de score retenue (à définir avec le porteur du projet : victoires pondérées par le
      niveau du bot, cote de duel de type Elo, progression de la collection…), **alors** elle est écrite dans
      `docs/produit/regles.md` et calculée par le serveur, jamais par le front (ADR 0004).
- [ ] **Étant donné** un joueur connecté, **alors** il voit son score et son rang ; un classement liste les joueurs
      par pseudo.
- [ ] **Étant donné** un joueur qui ne veut pas apparaître, **alors** il peut se retirer du classement.

## Notes

- Demande du porteur du projet (2026-10-23). Questions ouvertes : quelles parties comptent (bot, duels), remise à
  zéro périodique ou non, prise en compte des parties guidées (non).

## Journal

- 2026-10-23 — création, notée pour plus tard à la demande du porteur du projet.
