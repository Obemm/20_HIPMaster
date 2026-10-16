# 0005 — Les ADR technologiques Elis comme référentiel

- **Date** : 2026-10-16
- **Statut** : Acceptée
- **Référence Elis** : corpus des ADR `DECIDED` de l'espace Confluence ATR

## Contexte

Le porteur du projet travaille chez Elis et veut que HIPMaster s'appuie sur les choix technologiques du Groupe :
une stack connue, des pratiques éprouvées, des décisions déjà argumentées. HIPMaster reste toutefois un **projet
personnel**, hors du SI Elis : les obligations propres à l'entreprise (identité, outillage interne, gouvernance
d'architecture) n'ont pas de sens ici.

Source consultée : le miroir du référentiel ATR (44 ADR opposables, synchronisé le 2026-09-16) tenu dans
`14_AssistanceEquipe/outils/tad-validation/reference/adr-referentiel.md`. La source de vérité reste Confluence.

## Décision

Avant toute décision technique, consulter le référentiel Elis. Un ADR Elis pertinent est **retenu** (on applique),
**adapté** (on applique l'esprit avec un outil accessible à un projet personnel) ou **écarté** (raison notée).
Chaque ADR HIPMaster qui en découle cite sa source dans le champ « Référence Elis ».

| ADR Elis                                                         | Sujet                                       | Position HIPMaster    | Traduction                                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ADR-005                                                          | Angular pour les front-ends web             | Retenu                | [0006](0006-angular-pwa.md)                                                                                                         |
| ADR-016 v1                                                       | Application mobile externe en PWA           | Retenu                | [0006](0006-angular-pwa.md)                                                                                                         |
| ADR-007/020                                                      | Stratégie et design REST (design first)     | Retenu                | [0007](0007-api-rest-monorepo.md)                                                                                                   |
| ADR-030                                                          | Microsoft Azure comme seul cloud public     | Retenu                | [0008](0008-hebergement-azure.md)                                                                                                   |
| ADR-006                                                          | Application Insights / Log Analytics        | Retenu                | [0008](0008-hebergement-azure.md)                                                                                                   |
| ADR-012                                                          | Azure Storage Account pour les fichiers     | Retenu                | [0008](0008-hebergement-azure.md) (illustrations des cartes)                                                                        |
| ADR-004                                                          | Préfixes d'URL hors production              | Retenu                | [0008](0008-hebergement-azure.md) (`dev`, `stg`…)                                                                                   |
| ADR-039/008                                                      | SonarCloud, SonarWay, quality gate bloquant | Adapté                | [0009](0009-qualite-sonarway.md)                                                                                                    |
| ADR-040                                                          | Playwright en e2e, Postman en exploratoire  | Retenu                | [0009](0009-qualite-sonarway.md)                                                                                                    |
| ADR-019                                                          | Figma pour le design d'interface            | Retenu                | Maquettes des cartes et écrans (EPIC-05)                                                                                            |
| ADR-036                                                          | Draw.io pour les schémas d'architecture     | Adapté                | Mermaid dans le Markdown (rendu natif GitHub), draw.io si besoin                                                                    |
| ADR-033                                                          | Guidelines des assistants de code IA        | Retenu                | Revue humaine de tout code généré, aucun secret dans les prompts                                                                    |
| ADR-010/034                                                      | Okta pour toute application                 | Écarté                | Pas de tenant Okta hors SI Elis ; un fournisseur OIDC standard sera choisi dans EPIC-02 (même esprit : pas de mots de passe maison) |
| ADR-011                                                          | Azure Repo                                  | Écarté                | GitHub (CI Actions, Dependabot)                                                                                                     |
| ADR-014/037/031                                                  | TAD et LeanIX obligatoires                  | Écarté                | Les ADR et le backlog du dépôt en tiennent lieu                                                                                     |
| ADR-024                                                          | Anglais pour la tribu d'architecture        | Écarté                | Projet entièrement en français (règle du projet)                                                                                    |
| ADR-015                                                          | AT Internet pour l'analytique web           | Écarté pour l'instant | À revoir à la mise en ligne, avec la même exigence RGPD                                                                             |
| ADR-032/027                                                      | ConfigCat, Localazy                         | Écarté pour l'instant | Pas de feature flags ni de traduction au démarrage                                                                                  |
| Intégration (025, 041, 044…), données (022, 026, 028), MCP (042) | SI Elis                                     | Non applicable        | Application autonome, sans interface avec le SI Elis                                                                                |

## Alternatives envisagées

- **Conformité Elis complète** (Okta, Azure Repo, TAD…) : écartée par le porteur du projet, sans objet hors du SI Elis.
- **Choix libres sans référentiel** : c'était l'approche de l'ADR 0001 ; elle éloignait le projet des pratiques du Groupe.

## Conséquences

- L'ADR [0001](0001-nextjs-tailwind.md) (Next.js) est remplacé par [0006](0006-angular-pwa.md) ;
  [0004](0004-logique-de-jeu-pure.md) est complété par [0007](0007-api-rest-monorepo.md).
- Quand un ADR Elis évolue (nouvelle version, passage à `DECIDED`), ce tableau est revu par un nouvel ADR.
- Une technologie absente du référentiel (ex. PostgreSQL, Fastify) se décide librement, ADR à l'appui.
