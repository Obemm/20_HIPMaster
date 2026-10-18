# 0020 — Duels entre joueurs : asynchrones, au tour par tour, état en base

- **Date** : 2026-10-19
- **Statut** : Proposée
- **Référence Elis** : ADR-020 (API REST, réponse en moins de 3 s pour une API front) — retenu ; ADR-013 et ADR-029
  (event streaming et AsyncAPI sur Solace) — écartés : ils régissent les échanges **entre applications**, alors
  que les duels restent internes à HIPMaster

## Contexte

EPIC-06 permet à deux joueurs de s'affronter. Les joueurs visés sont des collègues de l'IT : ils jouent entre deux
réunions, rarement au même moment. Le moteur fait foi côté serveur (ADR 0004, 0013) et sait déjà produire la vue de
chacun des deux joueurs (`vueDe`). Les parties contre le bot vivent en mémoire (ADR 0014), ce qui convient à des
parties de 5 minutes mais pas à un duel qui peut durer plusieurs jours. Les comptes existent (ADR 0017) et la base
aussi (PostgreSQL en production, PGlite en développement, ADR 0018). L'API tourne en une seule instance, et sera
hébergée sur Azure (ADR 0008).

## Décision

- **Duels asynchrones, au tour par tour** : chaque joueur joue son tour quand il veut. Si les deux sont présents en
  même temps, la partie avance aussi vite qu'en direct, sans rien de plus à construire.
- **État en base** : une table `duels` garde les deux joueurs, leurs decks, l'état complet du moteur (JSON), le
  joueur actif, l'issue, l'échéance du tour en cours et un **numéro de version**. Chaque action est appliquée dans
  une transaction et refusée si la version a changé entre-temps (concurrence optimiste) ; seul le joueur actif peut
  agir.
- **Rafraîchissement par interrogation** : l'écran de duel redemande la partie toutes les quelques secondes quand
  c'est au tour de l'adversaire (`GET` conditionnel sur la version, réponse vide si rien n'a bougé) ; la liste
  « Mes duels » se met à jour à l'ouverture et à intervalle plus long. Aucune connexion permanente.
- **Échéance** : sans action pendant 72 heures, le joueur actif perd par forfait (valeur réglable). L'échéance est
  évaluée à la lecture, comme la recharge des boosters (ADR 0019) : aucune tâche de fond.
- **Decks prêtés** au départ, comme contre le bot ; les decks construits depuis la collection viendront avec leur
  propre story.
- L'API ne renvoie jamais l'état complet, seulement la vue du joueur qui demande (ADR 0014, inchangé).

## Alternatives envisagées

- **Temps réel par WebSocket** : la réaction est immédiate, mais il faut tenir des connexions ouvertes (et, sur
  plusieurs instances, un relais entre elles) pour des joueurs rarement connectés ensemble ; c'est un service de
  plus à exploiter pour peu de gain.
- **Server-Sent Events** pour pousser « à vous de jouer » : plus simple que WebSocket et compatible avec ce choix ;
  gardé comme amélioration possible si l'interrogation se révèle trop lente ou trop coûteuse.
- **Garder les duels en mémoire** (ADR 0014) : un redémarrage effacerait des parties de plusieurs jours.
- **Événements sur Solace** (ADR-013, ADR-029 Elis) : réservés aux échanges entre applications du SI ; un jeu
  interne n'a pas à publier sur le broker de l'entreprise.

## Conséquences

- Les duels survivent aux redémarrages et à un futur passage à plusieurs instances.
- Le moteur reste inchangé : il sert déjà deux camps symétriques.
- L'interrogation coûte quelques requêtes légères par minute et par écran ouvert ; à surveiller une fois en ligne
  (EPIC de mise en ligne à venir).
- Il faut une page « Mes duels » et un signal « à vous de jouer », faute de notification poussée.
- Ce choix ne remplace pas l'ADR 0014 : les parties contre le bot restent en mémoire.
