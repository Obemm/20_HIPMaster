# Décisions d'architecture (ADR)

Chaque décision structurante est notée ici pour se souvenir **pourquoi** on a fait un choix.
Un ADR n'est jamais modifié après acceptation : s'il est remis en cause, un nouvel ADR le remplace.

**Référentiel** : les ADR technologiques Elis (espace Confluence ATR) sont consultés avant toute décision, en
inspiration et sans les obligations d'entreprise — voir [0005](0005-referentiel-adr-elis.md). Chaque ADR cite sa
référence Elis.

| N°                                         | Décision                                                       | Référence Elis         | Statut                        |
| ------------------------------------------ | -------------------------------------------------------------- | ---------------------- | ----------------------------- |
| [0001](0001-nextjs-tailwind.md)            | Next.js + React + Tailwind CSS, TypeScript strict              | —                      | Remplacée par 0006            |
| [0002](0002-backlog-dans-le-depot.md)      | Backlog epics/stories en Markdown dans le dépôt                | —                      | Acceptée                      |
| [0003](0003-postgresql-drizzle.md)         | PostgreSQL + Drizzle ORM, Docker en développement              | aucune                 | Acceptée                      |
| [0004](0004-logique-de-jeu-pure.md)        | Logique de jeu en TypeScript pur, autorité serveur             | aucune                 | Acceptée (complétée par 0007) |
| [0005](0005-referentiel-adr-elis.md)       | Les ADR technologiques Elis comme référentiel                  | corpus ATR             | Acceptée                      |
| [0006](0006-angular-pwa.md)                | Angular pour le front, livré en PWA                            | ADR-005, ADR-016       | Acceptée                      |
| [0007](0007-api-rest-monorepo.md)          | API REST Fastify et monorepo npm workspaces                    | ADR-007, ADR-020       | Acceptée                      |
| [0008](0008-hebergement-azure.md)          | Azure comme hébergement cible                                  | ADR-030, 006, 012, 004 | Acceptée                      |
| [0009](0009-qualite-sonarway.md)           | Qualité de code : règles SonarWay, quality gate bloquant       | ADR-039, 008, 040      | Acceptée                      |
| [0010](0010-combat-plateau.md)             | Combat sur plateau : Débit, SLA, capacités thématiques         | aucune                 | Acceptée                      |
| [0011](0011-catalogue-cartes-versionne.md) | Catalogue des cartes versionné dans le domaine, pas en base    | ADR-026 (écarté)       | Acceptée                      |
| [0012](0012-theme-clair-sombre.md)         | Thème clair ou sombre selon le système, jetons de couleur      | ADR-019 (adapté)       | Acceptée                      |
| [0013](0013-moteur-combat.md)              | Moteur de combat : état sérialisable, actions, hasard à graine | aucune                 | Acceptée                      |
| [0014](0014-parties-en-memoire.md)         | État des parties en cours gardé en mémoire par l'API           | ADR-020                | Acceptée                      |

Modèle : [template.md](template.md).
