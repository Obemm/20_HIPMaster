# US-034 — Écran de duel

- **Epic** : EPIC-06
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-034-ecran-duel`

## Récit

En tant que **joueur en duel**, je veux **jouer mon tour et voir celui de mon adversaire** afin de **mener le duel
jusqu'au bout**.

## Critères d'acceptation

- [x] L'écran réutilise celui de la partie contre le bot (plateau, main, journal, aides) avec le pseudo de
      l'adversaire.
- [x] Pendant le tour de l'adversaire, l'écran l'annonce (« Au tour d'Ada ») et se met à jour seul quand il a joué
      (interrogation toutes les 3 secondes, suspendue si l'onglet est caché) ; les actions de l'adversaire passent
      dans le journal comme celles du bot.
- [x] La fin du duel annonce victoire, défaite ou nulle, et propose une revanche : « Lancer une revanche » ouvre un
      nouveau défi, dont le lien est à renvoyer à l'adversaire (l'envoi direct au même adversaire attend « Mes
      duels », US-035).
- [x] Tests de l'écran ; parcours e2e d'un duel complet à deux navigateurs ; audit axe-core au vert.

## Notes

- Les annonces de mise à jour passent par une zone `aria-live` polie.

## Journal

- 2026-10-19 — création (découpage d'EPIC-06, ADR 0020 proposé).
- 2026-10-19 — l'écran de partie gagne un mode « duel » (`mode`) au lieu d'être dupliqué : l'adversaire est nommé
  partout (titre, camp, aides, règle courte, journal avec élision « d'Ada »), les actions partent vers
  `/duels/{id}/actions` avec `If-Match`, et pendant le tour adverse l'écran redemande le duel toutes les 3 s
  (`If-None-Match`, `?depuis=`), sauf si l'onglet est caché ; un 409 recharge le duel. La page `/duels/:id`
  affiche ce plateau dès que le défi est relevé. La main de cartes devient focusable (défilement au clavier même
  quand ses cartes sont désactivées). Repli du mode sur « bot » quand le routeur lie `undefined`. Tests : écran (4),
  journal (1), e2e (3 : duel à deux navigateurs, fin menée par l'API pour aller vite, axe en clair et en sombre).
- 2026-10-19 — livrée : Écran de duel : plateau partagé avec le bot, adversaire nommé, mise à jour pendant le tour adverse
