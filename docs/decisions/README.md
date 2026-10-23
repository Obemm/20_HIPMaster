# Décisions d'architecture (ADR)

Chaque décision structurante est notée ici pour se souvenir **pourquoi** on a fait un choix.
Un ADR n'est jamais modifié après acceptation : s'il est remis en cause, un nouvel ADR le remplace.

**Référentiel** : les ADR technologiques Elis (espace Confluence ATR) sont consultés avant toute décision, en
inspiration et sans les obligations d'entreprise — voir [0005](0005-referentiel-adr-elis.md). Chaque ADR cite sa
référence Elis.

| N°                                                     | Décision                                                              | Référence Elis                 | Statut                        |
| ------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------ | ----------------------------- |
| [0001](0001-nextjs-tailwind.md)                        | Next.js + React + Tailwind CSS, TypeScript strict                     | —                              | Remplacée par 0006            |
| [0002](0002-backlog-dans-le-depot.md)                  | Backlog epics/stories en Markdown dans le dépôt                       | —                              | Acceptée                      |
| [0003](0003-postgresql-drizzle.md)                     | PostgreSQL + Drizzle ORM, Docker en développement                     | aucune                         | Acceptée (Docker : 0018)      |
| [0004](0004-logique-de-jeu-pure.md)                    | Logique de jeu en TypeScript pur, autorité serveur                    | aucune                         | Acceptée (complétée par 0007) |
| [0005](0005-referentiel-adr-elis.md)                   | Les ADR technologiques Elis comme référentiel                         | corpus ATR                     | Acceptée                      |
| [0006](0006-angular-pwa.md)                            | Angular pour le front, livré en PWA                                   | ADR-005, ADR-016               | Acceptée                      |
| [0007](0007-api-rest-monorepo.md)                      | API REST Fastify et monorepo npm workspaces                           | ADR-007, ADR-020               | Acceptée                      |
| [0008](0008-hebergement-azure.md)                      | Azure comme hébergement cible                                         | ADR-030, 006, 012, 004         | Remplacée par 0021            |
| [0009](0009-qualite-sonarway.md)                       | Qualité de code : règles SonarWay, quality gate bloquant              | ADR-039, 008, 040              | Acceptée (complétée par 0022) |
| [0010](0010-combat-plateau.md)                         | Combat sur plateau : Débit, SLA, capacités thématiques                | aucune                         | Acceptée (complétée par 0026) |
| [0011](0011-catalogue-cartes-versionne.md)             | Catalogue des cartes versionné dans le domaine, pas en base           | ADR-026 (écarté)               | Acceptée                      |
| [0012](0012-theme-clair-sombre.md)                     | Thème clair ou sombre selon le système, jetons de couleur             | ADR-019 (adapté)               | Acceptée                      |
| [0013](0013-moteur-combat.md)                          | Moteur de combat : état sérialisable, actions, hasard à graine        | aucune                         | Acceptée                      |
| [0014](0014-parties-en-memoire.md)                     | État des parties en cours gardé en mémoire par l'API                  | ADR-020                        | Remplacée par 0030            |
| [0015](0015-illustrations-statiques-optimisees.md)     | Illustrations : fichiers statiques optimisés, originaux hors du dépôt | ADR-012, ADR-030               | Acceptée                      |
| [0016](0016-illustrations-provisoires-vectorielles.md) | Illustrations provisoires vectorielles, générées par le code          | aucune (ADR-033)               | Acceptée                      |
| [0017](0017-compte-invite.md)                          | Compte invité : pseudo, jeton secret et code de récupération          | ADR-010, 034 (écartés)         | Complétée (0025, 0027, 0029)  |
| [0018](0018-pglite-developpement.md)                   | PGlite en développement et en tests, PostgreSQL en production         | aucune                         | Acceptée (complétée par 0023) |
| [0019](0019-boosters-recharge-a-la-lecture.md)         | Boosters : tirage serveur, recharge calculée à la lecture             | aucune (ADR-032 écarté)        | Acceptée                      |
| [0020](0020-duels-asynchrones.md)                      | Duels entre joueurs : asynchrones, au tour par tour, état en base     | ADR-020 (ADR-013, 029 écartés) | Acceptée                      |
| [0021](0021-hebergement-gcp.md)                        | Hébergement quasi gratuit : Firebase Hosting, Cloud Run, Neon         | ADR-030 écarté, 006, 012, 004  | Acceptée                      |
| [0022](0022-depot-public.md)                           | Dépôt GitHub public                                                   | ADR-011, 039, 033              | Acceptée                      |
| [0023](0023-postgresql-production.md)                  | PostgreSQL en production : migrations dédiées, connexions courtes     | aucune                         | Acceptée                      |
| [0024](0024-infrastructure-script-gcloud.md)           | Infrastructure créée par un script `gcloud` idempotent, pas Terraform | ADR-023 adapté, ADR-033 retenu | Acceptée                      |
| [0025](0025-protections-api.md)                        | Protections de l'API : débit limité, sessions révocables, codes HMAC  | ADR-020 retenu                 | Acceptée                      |
| [0026](0026-debit-du-second-joueur.md)                 | Le second joueur reçoit +1 Débit à son premier tour                   | aucune                         | Acceptée                      |
| [0027](0027-inscription-sur-invitation.md)             | Inscription sur invitation : codes à usages comptés, sous HMAC        | ADR-020 ; 010, 034 écartés     | Acceptée (complétée par 0029) |
| [0028](0028-deploiement-continu.md)                    | Déploiement continu : révision vérifiée avant bascule, front par API  | ADR-011, 032 écartés, 039, 033 | Acceptée                      |
| [0029](0029-administrateurs-par-configuration.md)      | Administrateurs désignés par la configuration, routes cachées en 404  | ADR-020 ; 010, 034 écartés     | Acceptée                      |
| [0030](0030-parties-bot-en-base.md)                    | Parties contre le bot en base : version, une écriture par action      | ADR-020                        | Acceptée                      |
| [0031](0031-suppression-compte.md)                     | Suppression de son compte : forfait des duels, historique sans lui    | ADR-020 ; ADR-015 écarté       | Acceptée                      |
| [0032](0032-preferences-interface-navigateur.md)       | Préférences d'interface gardées par le navigateur (`localStorage`)    | ADR-032 écarté                 | Acceptée                      |
| [0033](0033-supervision-sauvegardes.md)                | Supervision, sauvegardes et erreurs : Cloud Monitoring, jobs, journal | ADR-006, 012, 043 ; 009 écarté | Proposée                      |

Modèle : [template.md](template.md).
