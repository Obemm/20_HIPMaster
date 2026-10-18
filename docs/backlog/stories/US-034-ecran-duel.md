# US-034 — Écran de duel

- **Epic** : EPIC-06
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-034-ecran-duel`

## Récit

En tant que **joueur en duel**, je veux **jouer mon tour et voir celui de mon adversaire** afin de **mener le duel
jusqu'au bout**.

## Critères d'acceptation

- [ ] L'écran réutilise celui de la partie contre le bot (plateau, main, journal, aides) avec le pseudo de
      l'adversaire.
- [ ] Pendant le tour de l'adversaire, l'écran l'annonce (« Au tour d'Ada ») et se met à jour seul quand il a joué
      (interrogation toutes les 3 secondes, suspendue si l'onglet est caché) ; les actions de l'adversaire passent
      dans le journal comme celles du bot.
- [ ] La fin du duel annonce victoire, défaite ou nulle, et propose une revanche (nouveau défi au même adversaire).
- [ ] Tests de l'écran ; parcours e2e d'un duel complet à deux navigateurs ; audit axe-core au vert.

## Notes

- Les annonces de mise à jour passent par une zone `aria-live` polie.

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
