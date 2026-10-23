# Tableau de suivi

_Dernière mise à jour : 2026-10-23_

## Epics

| Epic                                                                                              | Priorité | Statut    | Avancement |
| ------------------------------------------------------------------------------------------------- | -------- | --------- | ---------- |
| [EPIC-00 — Fondations](epics/EPIC-00-fondations.md)                                               | Must     | Terminé   | 9/9        |
| [EPIC-01 — Univers et modèle de carte](epics/EPIC-01-univers-cartes.md)                           | Must     | Terminé   | 2/2        |
| [EPIC-02 — Comptes joueurs](epics/EPIC-02-comptes-joueurs.md)                                     | Must     | Terminé   | 1/1        |
| [EPIC-03 — Boosters et collection](epics/EPIC-03-boosters-collection.md)                          | Must     | Terminé   | 2/2        |
| [EPIC-04 — Combat contre le bot](epics/EPIC-04-combat-bot.md)                                     | Must     | Terminé   | 14/14      |
| [EPIC-05 — Illustrations des cartes](epics/EPIC-05-illustrations.md)                              | Should   | En cours  | 3/5        |
| [EPIC-06 — Duels entre joueurs](epics/EPIC-06-duels-joueurs.md)                                   | Should   | Terminé   | 8/8        |
| [EPIC-07 — Vie sociale](epics/EPIC-07-vie-sociale.md)                                             | Could    | À affiner | 0/0        |
| [EPIC-08 — Cartes proposées par la communauté IT](epics/EPIC-08-cartes-communaute.md)             | Should   | À affiner | 0/5        |
| [EPIC-09 — Mise en ligne sur Google Cloud](epics/EPIC-09-mise-en-ligne-gcp.md)                    | Must     | En cours  | 6/13       |
| [EPIC-10 — Identité visuelle et confort sur téléphone](epics/EPIC-10-identite-visuelle-mobile.md) | Should   | À affiner | 0/5        |
| [EPIC-11 — Apprendre à jouer](epics/EPIC-11-apprendre-a-jouer.md)                                 | Should   | À affiner | 0/3        |

## Itération 0 (en cours) — fondations

Objectif : un socle outillé, vérifié automatiquement, et une méthode de travail documentée.

| Story                                                                                                                    | Epic    | Priorité | Taille | Statut |
| ------------------------------------------------------------------------------------------------------------------------ | ------- | -------- | ------ | ------ |
| [US-001 — Socle de développement](stories/US-001-socle-developpement.md)                                                 | EPIC-00 | Must     | S      | Faite  |
| [US-002 — Next.js + Tailwind CSS](stories/US-002-nextjs-tailwind.md)                                                     | EPIC-00 | Must     | XS     | Faite  |
| [US-003 — Organisation en mode projet](stories/US-003-organisation-projet.md)                                            | EPIC-00 | Must     | S      | Faite  |
| [US-004 — Base de données locale](stories/US-004-base-de-donnees.md)                                                     | EPIC-00 | Must     | XS     | Faite  |
| [US-006 — Socle Angular aligné sur le référentiel Elis](stories/US-006-socle-angular-referentiel-elis.md)                | EPIC-00 | Must     | M      | Faite  |
| [US-007 — Dependabot ne propose que des versions compatibles](stories/US-007-dependabot-versions-compatibles.md)         | EPIC-00 | Must     | XS     | Faite  |
| [US-043 — Tests de l'API robustes sur un poste chargé](stories/US-043-tests-api-pglite.md)                               | EPIC-00 | Must     | S      | Faite  |
| [US-044 — Le quality gate ignore les worktrees de l'app Claude Desktop](stories/US-044-quality-gate-ignore-worktrees.md) | EPIC-00 | Must     | XS     | Faite  |
| [US-045 — `npm run dev` ne redémarre l'API que sur un changement des sources](stories/US-045-api-dev-watch-sources.md)   | EPIC-00 | Must     | XS     | Faite  |

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

| Story                                                                              | Epic    | Priorité | Taille | Statut |
| ---------------------------------------------------------------------------------- | ------- | -------- | ------ | ------ |
| [US-032 — Duels côté serveur](stories/US-032-duels-serveur.md)                     | EPIC-06 | Must     | L      | Faite  |
| [US-033 — Défier un collègue par lien](stories/US-033-defier-par-lien.md)          | EPIC-06 | Must     | M      | Faite  |
| [US-034 — Écran de duel](stories/US-034-ecran-duel.md)                             | EPIC-06 | Must     | L      | Faite  |
| [US-035 — Mes duels et « à vous de jouer »](stories/US-035-mes-duels.md)           | EPIC-06 | Should   | M      | Faite  |
| [US-036 — Abandon et forfait](stories/US-036-abandon-forfait.md)                   | EPIC-06 | Should   | S      | Faite  |
| [US-037 — Adversaire au hasard](stories/US-037-adversaire-hasard.md)               | EPIC-06 | Could    | M      | Faite  |
| [US-038 — Un booster pour une victoire en duel](stories/US-038-recompense-duel.md) | EPIC-06 | Could    | S      | Faite  |
| [US-042 — Parcours e2e de duel fiables](stories/US-042-e2e-duels-fiables.md)       | EPIC-06 | Should   | S      | Faite  |

## Retours de partie

Retour du porteur du projet le 2026-10-19 : une partie perdue sans un seul dégât infligé, faute de savoir qu'il faut
choisir l'attaquant et sa cible.

| Story                                                                                  | Epic    | Priorité | Taille | Statut |
| -------------------------------------------------------------------------------------- | ------- | -------- | ------ | ------ |
| [US-039 — Expliquer les attaques et les combats](stories/US-039-expliquer-attaques.md) | EPIC-04 | Must     | S      | Faite  |
| [US-040 — Détail des cartes de la main](stories/US-040-detail-cartes-main.md)          | EPIC-04 | Should   | M      | Faite  |
| [US-041 — Détail des cartes du plateau](stories/US-041-detail-cartes-plateau.md)       | EPIC-04 | Should   | M      | Faite  |

Retour du porteur du projet le 2026-10-22 : « presque impossible de gagner contre le bot ».

| Story                                                                                             | Epic    | Priorité | Taille | Statut |
| ------------------------------------------------------------------------------------------------- | ------- | -------- | ------ | ------ |
| [US-064 — Un bot battable par un débutant, une partie équitable](stories/US-064-bot-equilibre.md) | EPIC-04 | Must     | M      | Faite  |

## Itération 6 (à venir) — mise en ligne

Revue du 2026-10-22 ([revue avant mise en ligne](../revues/2026-10-22-revue-mise-en-ligne.md)) : hébergement sur
Google Cloud, Firebase Hosting et une base Neon gratuite (ADR 0021, accepté le 2026-10-22), jeu ouvert aux collègues **sur invitation** (choix du porteur du projet le
2026-10-22). Lot 1 avant la première mise en ligne, lot 2 avant d'envoyer les invitations, lot 3 ensuite.

| Story                                                                                                                                 | Epic    | Priorité | Taille | Lot | Statut    |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- | ------ | --- | --------- |
| [US-046 — Une API prête pour Cloud Run](stories/US-046-api-prete-cloud-run.md)                                                        | EPIC-09 | Must     | L      | 1   | Faite     |
| [US-056 — La CI teste l'API sur un vrai PostgreSQL](stories/US-056-ci-postgresql.md)                                                  | EPIC-09 | Must     | S      | 1   | Faite     |
| [US-047 — Les protections indispensables avant l'ouverture](stories/US-047-protections-avant-ouverture.md)                            | EPIC-09 | Must     | M      | 1   | Faite     |
| [US-048 — Inscription sur invitation](stories/US-048-inscription-sur-invitation.md)                                                   | EPIC-09 | Must     | M      | 1   | Faite     |
| [US-055 — Un front robuste au démarrage à froid et aux sessions expirées](stories/US-055-front-robuste.md)                            | EPIC-09 | Must     | M      | 1   | Faite     |
| [US-049 — Infrastructure gratuite et reproductible](stories/US-049-infrastructure-gcp.md)                                             | EPIC-09 | Must     | M      | 1   | Faite     |
| [US-050 — Déploiement continu vers Cloud Run et Firebase Hosting](stories/US-050-deploiement-continu.md)                              | EPIC-09 | Must     | M      | 1   | En revue  |
| [US-052 — Parties contre le bot gardées en base](stories/US-052-parties-bot-en-base.md)                                               | EPIC-09 | Must     | M      | 2   | À affiner |
| [US-051 — Supervision, sauvegardes vérifiées et scan de sécurité](stories/US-051-supervision-sauvegardes-securite.md)                 | EPIC-09 | Must     | S      | 2   | À affiner |
| [US-053 — Page de confidentialité et suppression de son compte](stories/US-053-confidentialite-suppression-compte.md)                 | EPIC-09 | Should   | S      | 2   | À affiner |
| [US-059 — Un plateau de partie qui tient dans un écran de téléphone](stories/US-059-plateau-mobile-un-ecran.md)                       | EPIC-10 | Should   | M      | 2   | À affiner |
| [US-060 — Une navigation pensée pour le téléphone](stories/US-060-navigation-mobile.md)                                               | EPIC-10 | Should   | S      | 2   | À affiner |
| [US-065 — Des coups de pouce au bon moment](stories/US-065-coups-de-pouce.md)                                                         | EPIC-11 | Should   | S      | 2   | À affiner |
| [US-066 — Un conseil à la demande, contre le bot](stories/US-066-conseil-en-partie.md)                                                | EPIC-11 | Should   | M      | 2   | À affiner |
| [US-054 — Des sessions qui expirent et des données qui ne s'accumulent pas](stories/US-054-sessions-purge.md)                         | EPIC-09 | Should   | M      | 3   | À affiner |
| [US-057 — Des requêtes légères : index, lectures bornées, cache et chargement à la demande](stories/US-057-requetes-legeres-cache.md) | EPIC-09 | Should   | M      | 3   | À affiner |
| [US-058 — Des duels équitables : hasard imprévisible et appariement sûr](stories/US-058-duels-equitables.md)                          | EPIC-09 | Should   | S      | 3   | À affiner |
| [US-061 — Une identité visuelle et un accueil qui donnent envie](stories/US-061-accueil-identite-visuelle.md)                         | EPIC-10 | Should   | M      | 3   | À affiner |
| [US-063 — Installer le jeu sur son téléphone (PWA)](stories/US-063-pwa-installable.md)                                                | EPIC-10 | Could    | S      | 3   | À affiner |
| [US-062 — Ouvrir un booster, un vrai moment](stories/US-062-ouverture-booster-mise-en-scene.md)                                       | EPIC-10 | Could    | M      | 3   | À affiner |
| [US-067 — Une première partie guidée](stories/US-067-premiere-partie-guidee.md)                                                       | EPIC-11 | Should   | L      | 3   | À affiner |

## Plus tard — évolutions notées le 2026-10-23

Demandes du porteur du projet, à affiner le moment venu.

| Story                                                                                                           | Epic    | Priorité | Taille | Statut    |
| --------------------------------------------------------------------------------------------------------------- | ------- | -------- | ------ | --------- |
| [US-068 — Une revue visuelle de tout le site](stories/US-068-revue-visuelle.md)                                 | EPIC-10 | Should   | M      | À affiner |
| [US-069 — Un score et un classement](stories/US-069-score-classement.md)                                        | EPIC-07 | Could    | L      | À affiner |
| [US-070 — Des boosters offerts par code, pour récompenser le travail réel](stories/US-070-boosters-par-code.md) | EPIC-03 | Should   | M      | À affiner |

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
