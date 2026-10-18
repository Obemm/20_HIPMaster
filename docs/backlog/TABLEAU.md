# Tableau de suivi

_Dernière mise à jour : 2026-10-19_

## Epics

| Epic                                                                                  | Priorité | Statut    | Avancement |
| ------------------------------------------------------------------------------------- | -------- | --------- | ---------- |
| [EPIC-00 — Fondations](epics/EPIC-00-fondations.md)                                   | Must     | Terminé   | 6/6        |
| [EPIC-01 — Univers et modèle de carte](epics/EPIC-01-univers-cartes.md)               | Must     | Terminé   | 2/2        |
| [EPIC-02 — Comptes joueurs](epics/EPIC-02-comptes-joueurs.md)                         | Must     | Terminé   | 1/1        |
| [EPIC-03 — Boosters et collection](epics/EPIC-03-boosters-collection.md)              | Must     | Terminé   | 2/2        |
| [EPIC-04 — Combat contre le bot](epics/EPIC-04-combat-bot.md)                         | Must     | En cours  | 10/11      |
| [EPIC-05 — Illustrations des cartes](epics/EPIC-05-illustrations.md)                  | Should   | En cours  | 3/5        |
| [EPIC-06 — Duels entre joueurs](epics/EPIC-06-duels-joueurs.md)                       | Should   | En cours  | 4/7        |
| [EPIC-07 — Vie sociale](epics/EPIC-07-vie-sociale.md)                                 | Could    | À affiner | 0/0        |
| [EPIC-08 — Cartes proposées par la communauté IT](epics/EPIC-08-cartes-communaute.md) | Should   | À affiner | 0/5        |

## Itération 0 (en cours) — fondations

Objectif : un socle outillé, vérifié automatiquement, et une méthode de travail documentée.

| Story                                                                                                            | Epic    | Priorité | Taille | Statut |
| ---------------------------------------------------------------------------------------------------------------- | ------- | -------- | ------ | ------ |
| [US-001 — Socle de développement](stories/US-001-socle-developpement.md)                                         | EPIC-00 | Must     | S      | Faite  |
| [US-002 — Next.js + Tailwind CSS](stories/US-002-nextjs-tailwind.md)                                             | EPIC-00 | Must     | XS     | Faite  |
| [US-003 — Organisation en mode projet](stories/US-003-organisation-projet.md)                                    | EPIC-00 | Must     | S      | Faite  |
| [US-004 — Base de données locale](stories/US-004-base-de-donnees.md)                                             | EPIC-00 | Must     | XS     | Faite  |
| [US-006 — Socle Angular aligné sur le référentiel Elis](stories/US-006-socle-angular-referentiel-elis.md)        | EPIC-00 | Must     | M      | Faite  |
| [US-007 — Dependabot ne propose que des versions compatibles](stories/US-007-dependabot-versions-compatibles.md) | EPIC-00 | Must     | XS     | Faite  |

## Itération 1 (à venir) — définir le jeu

| Story                                                                 | Epic    | Priorité | Taille | Statut |
| --------------------------------------------------------------------- | ------- | -------- | ------ | ------ |
| [US-005 — Univers et règles du jeu](stories/US-005-univers-regles.md) | EPIC-01 | Must     | M      | Faite  |
| [US-008 — Catalogue du set 1](stories/US-008-catalogue-set-1.md)      | EPIC-01 | Must     | L      | Faite  |

## Itération 2 (à venir) — donner envie de jouer

| Story                                                                                                   | Epic    | Priorité | Taille | Statut    |
| ------------------------------------------------------------------------------------------------------- | ------- | -------- | ------ | --------- |
| [US-009 — Design des cartes façon carte à jouer](stories/US-009-design-cartes.md)                       | EPIC-05 | Should   | L      | Faite     |
| [US-015 — Chaîne d'import et d'optimisation des illustrations](stories/US-015-chaine-illustrations.md)  | EPIC-05 | Should   | M      | Faite     |
| [US-016 — Direction artistique et choix du générateur d'images](stories/US-016-direction-artistique.md) | EPIC-05 | Should   | M      | En cours  |
| [US-017 — Illustrations des 71 cartes du set 1](stories/US-017-illustrations-set-1.md)                  | EPIC-05 | Should   | L      | À affiner |
| [US-018 — Illustrations provisoires générées par le code](stories/US-018-illustrations-provisoires.md)  | EPIC-05 | Should   | M      | Faite     |

## Itération 3 (à venir) — jouer contre le bot

| Story                                                                                | Epic    | Priorité | Taille | Statut |
| ------------------------------------------------------------------------------------ | ------- | -------- | ------ | ------ |
| [US-010 — Moteur de combat : règles de base](stories/US-010-moteur-combat.md)        | EPIC-04 | Must     | L      | Faite  |
| [US-011 — Bot « Batch de nuit » et decks prêtés](stories/US-011-bot-decks-pretes.md) | EPIC-04 | Must     | M      | Faite  |
| [US-012 — API de partie contre le bot](stories/US-012-api-partie-pve.md)             | EPIC-04 | Must     | M      | Faite  |
| [US-013 — Écran de partie contre le bot](stories/US-013-ecran-partie-pve.md)         | EPIC-04 | Must     | L      | Faite  |
| [US-014 — Sorts et incidents](stories/US-014-effets-cartes.md)                       | EPIC-04 | Should   | L      | Faite  |
| [US-019 — Effets propres des composants](stories/US-019-effets-composants.md)        | EPIC-04 | Should   | M      | Faite  |
| [US-020 — Capacités IA et Migration](stories/US-020-capacites-ia.md)                 | EPIC-04 | Should   | L      | Faite  |

## Itération 4 (à venir) — collectionner

Ordre décidé avec le porteur du projet le 2026-10-18 : niveaux du bot, comptes simples, boosters et collection, puis
récompense de victoire. Les illustrations (EPIC-05) attendent.

| Story                                                                               | Epic    | Priorité | Taille | Statut |
| ----------------------------------------------------------------------------------- | ------- | -------- | ------ | ------ |
| [US-021 — Niveaux du bot](stories/US-021-niveaux-bot.md)                            | EPIC-04 | Must     | M      | Faite  |
| [US-022 — Compte invité, sans mot de passe](stories/US-022-compte-invite.md)        | EPIC-02 | Must     | L      | Faite  |
| [US-023 — Recevoir et ouvrir des boosters](stories/US-023-ouvrir-boosters.md)       | EPIC-03 | Must     | L      | Faite  |
| [US-024 — Ma collection](stories/US-024-ma-collection.md)                           | EPIC-03 | Must     | M      | Faite  |
| [US-025 — Un booster pour chaque victoire](stories/US-025-recompense-victoire.md)   | EPIC-04 | Should   | S      | Faite  |
| [US-026 — Vue publique complète pour les bots](stories/US-026-vue-publique-bots.md) | EPIC-04 | Should   | XS     | Faite  |

## Itération 5 (à venir) — duels entre joueurs

Découpage du 2026-10-19 : duels asynchrones, au tour par tour, état en base (ADR 0020, accepté par le porteur du projet
le 2026-10-19).

| Story                                                                              | Epic    | Priorité | Taille | Statut    |
| ---------------------------------------------------------------------------------- | ------- | -------- | ------ | --------- |
| [US-032 — Duels côté serveur](stories/US-032-duels-serveur.md)                     | EPIC-06 | Must     | L      | Faite     |
| [US-033 — Défier un collègue par lien](stories/US-033-defier-par-lien.md)          | EPIC-06 | Must     | M      | Faite     |
| [US-034 — Écran de duel](stories/US-034-ecran-duel.md)                             | EPIC-06 | Must     | L      | Faite     |
| [US-035 — Mes duels et « à vous de jouer »](stories/US-035-mes-duels.md)           | EPIC-06 | Should   | M      | Faite     |
| [US-036 — Abandon et forfait](stories/US-036-abandon-forfait.md)                   | EPIC-06 | Should   | S      | À affiner |
| [US-037 — Adversaire au hasard](stories/US-037-adversaire-hasard.md)               | EPIC-06 | Could    | M      | À affiner |
| [US-038 — Un booster pour une victoire en duel](stories/US-038-recompense-duel.md) | EPIC-06 | Could    | S      | À affiner |

## Retours de partie

Retour du porteur du projet le 2026-10-19 : une partie perdue sans un seul dégât infligé, faute de savoir qu'il faut
choisir l'attaquant et sa cible.

| Story                                                                                  | Epic    | Priorité | Taille | Statut   |
| -------------------------------------------------------------------------------------- | ------- | -------- | ------ | -------- |
| [US-039 — Expliquer les attaques et les combats](stories/US-039-expliquer-attaques.md) | EPIC-04 | Must     | S      | En cours |

## Plus tard — cartes de la communauté IT

Demande du porteur du projet (2026-10-19) : permettre à d'autres tech leads et architectes de proposer leurs cartes,
pour aider à l'acculturation IT. À traiter plus tard ; ADR à prévoir (identité, rôle de relecteur, chemin vers le
catalogue, set d'accueil).

| Story                                                                                          | Epic    | Priorité | Taille | Statut    |
| ---------------------------------------------------------------------------------------------- | ------- | -------- | ------ | --------- |
| [US-027 — Guide du contributeur](stories/US-027-guide-contributeur.md)                         | EPIC-08 | Should   | S      | À affiner |
| [US-028 — Proposer une carte depuis le jeu](stories/US-028-proposer-carte.md)                  | EPIC-08 | Should   | L      | À affiner |
| [US-029 — Relire et instruire les propositions](stories/US-029-relire-propositions.md)         | EPIC-08 | Should   | M      | À affiner |
| [US-030 — Intégrer une carte acceptée au catalogue](stories/US-030-integrer-carte-acceptee.md) | EPIC-08 | Should   | M      | À affiner |
| [US-031 — Créditer les contributeurs](stories/US-031-crediter-contributeurs.md)                | EPIC-08 | Could    | S      | À affiner |
