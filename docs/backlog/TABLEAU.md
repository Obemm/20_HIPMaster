# Tracking board

_Last updated: 2026-10-28_

## Epics

| Epic                                                                                           | Priority | Status      | Progress |
| ---------------------------------------------------------------------------------------------- | -------- | ----------- | -------- |
| [EPIC-00 — Project foundations](epics/EPIC-00-fondations.md)                                   | Must     | Done        | 10/10    |
| [EPIC-01 — Universe and card model](epics/EPIC-01-univers-cartes.md)                           | Must     | Done        | 2/2      |
| [EPIC-02 — Player accounts](epics/EPIC-02-comptes-joueurs.md)                                  | Must     | Done        | 1/1      |
| [EPIC-03 — Boosters and collection](epics/EPIC-03-boosters-collection.md)                      | Must     | Done        | 3/3      |
| [EPIC-04 — Combat against the bot](epics/EPIC-04-combat-bot.md)                                | Must     | Done        | 15/15    |
| [EPIC-05 — Card illustrations](epics/EPIC-05-illustrations.md)                                 | Should   | Done        | 6/6      |
| [EPIC-06 — Duels between players](epics/EPIC-06-duels-joueurs.md)                              | Should   | Done        | 8/8      |
| [EPIC-07 — Social life](epics/EPIC-07-vie-sociale.md)                                          | Could    | Done        | 1/1      |
| [EPIC-08 — Cards proposed by the IT community](epics/EPIC-08-cartes-communaute.md)             | Should   | In progress | 4/6      |
| [EPIC-09 — Going live on Google Cloud](epics/EPIC-09-mise-en-ligne-gcp.md)                     | Must     | Done        | 14/14    |
| [EPIC-10 — Visual identity and comfort on a phone](epics/EPIC-10-identite-visuelle-mobile.md)  | Should   | Done        | 6/6      |
| [EPIC-11 — Learning to play](epics/EPIC-11-apprendre-a-jouer.md)                               | Should   | Done        | 3/3      |
| [EPIC-12 — Cards that teach](epics/EPIC-12-cartes-qui-enseignent.md)                           | Must     | Done        | 2/2      |
| [EPIC-13 — A set 2: architecture and practices](epics/EPIC-13-set-2-architecture-pratiques.md) | Could    | In progress | 2/3      |
| [EPIC-14 — A game in French and English](epics/EPIC-14-multilingue.md)                         | Should   | Done        | 4/4      |
| [EPIC-15 — Decks of your own](epics/EPIC-15-decks-personnalises.md)                            | Should   | Done        | 2/2      |
| [EPIC-16 — The repository in English](epics/EPIC-16-english-repository.md)                     | Should   | In progress | 2/5      |

## Iteration 0 (in progress) — foundations

Goal: a well-equipped base, checked automatically, and a documented way of working.

| Story                                                                                                                 | Epic    | Priority | Size | Status |
| --------------------------------------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-001 — Development foundation](stories/US-001-socle-developpement.md)                                              | EPIC-00 | Must     | S    | Done   |
| [US-002 — Next.js + Tailwind CSS](stories/US-002-nextjs-tailwind.md)                                                  | EPIC-00 | Must     | XS   | Done   |
| [US-003 — Project-mode organisation](stories/US-003-organisation-projet.md)                                           | EPIC-00 | Must     | S    | Done   |
| [US-004 — Local database](stories/US-004-base-de-donnees.md)                                                          | EPIC-00 | Must     | XS   | Done   |
| [US-006 — Angular foundation aligned with the the company reference](stories/US-006-socle-angular-reference.md)       | EPIC-00 | Must     | M    | Done   |
| [US-007 — Dependabot only proposes compatible versions](stories/US-007-dependabot-versions-compatibles.md)            | EPIC-00 | Must     | XS   | Done   |
| [US-043 — API tests that stay robust on a loaded machine](stories/US-043-tests-api-pglite.md)                         | EPIC-00 | Must     | S    | Done   |
| [US-044 — The quality gate ignores the Claude Desktop app worktrees](stories/US-044-quality-gate-ignore-worktrees.md) | EPIC-00 | Must     | XS   | Done   |
| [US-045 — `npm run dev` restarts the API only when its sources change](stories/US-045-api-dev-watch-sources.md)       | EPIC-00 | Must     | XS   | Done   |
| [US-075 — An epic status that always matches its stories](stories/US-075-statut-epics.md)                             | EPIC-00 | Must     | XS   | Done   |

## Iteration 1 (upcoming) — define the game

| Story                                                                | Epic    | Priority | Size | Status |
| -------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-005 — Game universe and rules](stories/US-005-univers-regles.md) | EPIC-01 | Must     | M    | Done   |
| [US-008 — Set 1 catalogue](stories/US-008-catalogue-set-1.md)        | EPIC-01 | Must     | L    | Done   |

## Iteration 2 (upcoming) — make people want to play

| Story                                                                                                      | Epic    | Priority | Size | Status |
| ---------------------------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-009 — Playing-card style card design](stories/US-009-design-cartes.md)                                 | EPIC-05 | Should   | L    | Done   |
| [US-015 — Illustration import and optimisation pipeline](stories/US-015-chaine-illustrations.md)           | EPIC-05 | Should   | M    | Done   |
| [US-016 — Art direction and choice of the image generator](stories/US-016-direction-artistique.md)         | EPIC-05 | Should   | M    | Done   |
| [US-017 — Illustrations for the 71 cards of set 1](stories/US-017-illustrations-set-1.md)                  | EPIC-05 | Should   | L    | Done   |
| [US-018 — Provisional illustrations generated by code](stories/US-018-illustrations-provisoires.md)        | EPIC-05 | Should   | M    | Done   |
| [US-078 — Fingerprinted illustrations, cached for a year](stories/US-078-illustrations-empreinte-cache.md) | EPIC-05 | Should   | S    | Done   |

## Iteration 3 (upcoming) — play against the bot

| Story                                                                               | Epic    | Priority | Size | Status |
| ----------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-010 — Combat engine: base rules](stories/US-010-moteur-combat.md)               | EPIC-04 | Must     | L    | Done   |
| [US-011 — "Nightly Batch" bot and loaned decks](stories/US-011-bot-decks-pretes.md) | EPIC-04 | Must     | M    | Done   |
| [US-012 — Game API against the bot](stories/US-012-api-partie-pve.md)               | EPIC-04 | Must     | M    | Done   |
| [US-013 — Game screen against the bot](stories/US-013-ecran-partie-pve.md)          | EPIC-04 | Must     | L    | Done   |
| [US-014 — Spells and incidents](stories/US-014-effets-cartes.md)                    | EPIC-04 | Should   | L    | Done   |
| [US-019 — Component-specific effects](stories/US-019-effets-composants.md)          | EPIC-04 | Should   | M    | Done   |
| [US-020 — AI abilities and Migration](stories/US-020-capacites-ia.md)               | EPIC-04 | Should   | L    | Done   |

## Iteration 4 (upcoming) — collect

Order decided with the project owner on 2026-10-18: bot levels, simple accounts, boosters and collection, then
victory reward. The illustrations (EPIC-05) wait.

| Story                                                                                    | Epic    | Priority | Size | Status |
| ---------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-021 — Bot levels](stories/US-021-niveaux-bot.md)                                     | EPIC-04 | Must     | M    | Done   |
| [US-022 — Guest account, without a password](stories/US-022-compte-invite.md)            | EPIC-02 | Must     | L    | Done   |
| [US-023 — Receive and open boosters](stories/US-023-ouvrir-boosters.md)                  | EPIC-03 | Must     | L    | Done   |
| [US-024 — My collection](stories/US-024-ma-collection.md)                                | EPIC-03 | Must     | M    | Done   |
| [US-025 — A booster for every victory](stories/US-025-recompense-victoire.md)            | EPIC-04 | Should   | S    | Done   |
| [US-026 — A complete public view, enough for a bot](stories/US-026-vue-publique-bots.md) | EPIC-04 | Should   | XS   | Done   |

## Iteration 5 (upcoming) — duels between players

Split of 2026-10-19: asynchronous, turn-based duels, state kept in the database (ADR 0020, accepted by the project owner
on 2026-10-19).

| Story                                                                                          | Epic    | Priority | Size | Status |
| ---------------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-032 — Server-side duels: create, join, play on your turn](stories/US-032-duels-serveur.md) | EPIC-06 | Must     | L    | Done   |
| [US-033 — Challenge a colleague by link](stories/US-033-defier-par-lien.md)                    | EPIC-06 | Must     | M    | Done   |
| [US-034 — Duel screen](stories/US-034-ecran-duel.md)                                           | EPIC-06 | Must     | L    | Done   |
| [US-035 — My duels and "your turn"](stories/US-035-mes-duels.md)                               | EPIC-06 | Should   | M    | Done   |
| [US-036 — Concede and forfeit](stories/US-036-abandon-forfait.md)                              | EPIC-06 | Should   | S    | Done   |
| [US-037 — Random opponent](stories/US-037-adversaire-hasard.md)                                | EPIC-06 | Could    | M    | Done   |
| [US-038 — A booster for a duel victory](stories/US-038-recompense-duel.md)                     | EPIC-06 | Could    | S    | Done   |
| [US-042 — Reliable duel e2e journeys under load](stories/US-042-e2e-duels-fiables.md)          | EPIC-06 | Should   | S    | Done   |

## Feedback from games

Feedback from the project owner on 2026-10-19: a game lost without dealing a single point of damage, for lack of knowing
that you have to choose the attacker and its target.

| Story                                                                                          | Epic    | Priority | Size | Status |
| ---------------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-039 — Explain attacks and combat resolution](stories/US-039-expliquer-attaques.md)         | EPIC-04 | Must     | S    | Done   |
| [US-040 — View the details of the cards in your hand](stories/US-040-detail-cartes-main.md)    | EPIC-04 | Should   | M    | Done   |
| [US-041 — View the details of the cards on the board](stories/US-041-detail-cartes-plateau.md) | EPIC-04 | Should   | M    | Done   |

Feedback from the project owner on 2026-10-22: "almost impossible to win against the bot".

| Story                                                                                               | Epic    | Priority | Size | Status |
| --------------------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-064 — A bot a beginner can beat, a fair game for both players](stories/US-064-bot-equilibre.md) | EPIC-04 | Must     | M    | Done   |

Feedback from the project owner on 2026-10-23: unable to play Apigee AI Gateway, without knowing why.

| Story                                                                                   | Epic    | Priority | Size | Status |
| --------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-071 — Say why a card in hand cannot be played](stories/US-071-raison-carte-main.md) | EPIC-04 | Must     | M    | Done   |

## Iteration 6 (upcoming) — going online

Review of 2026-10-22 ([pre-launch review](../revues/2026-10-22-revue-mise-en-ligne.md)): hosting on Google Cloud,
Firebase Hosting and a free Neon database (ADR 0021, accepted on 2026-10-22), game open to colleagues **by invitation**
(project owner's choice on 2026-10-22). Batch 1 before the first go-live, batch 2 before sending the invitations,
batch 3 afterwards.

| Story                                                                                                                    | Epic    | Priority | Size | Batch | Status |
| ------------------------------------------------------------------------------------------------------------------------ | ------- | -------- | ---- | ----- | ------ |
| [US-046 — An API ready for Cloud Run](stories/US-046-api-prete-cloud-run.md)                                             | EPIC-09 | Must     | L    | 1     | Done   |
| [US-056 — The CI tests the API on a real PostgreSQL](stories/US-056-ci-postgresql.md)                                    | EPIC-09 | Must     | S    | 1     | Done   |
| [US-047 — The essential protections before opening](stories/US-047-protections-avant-ouverture.md)                       | EPIC-09 | Must     | M    | 1     | Done   |
| [US-048 — Sign-up by invitation](stories/US-048-inscription-sur-invitation.md)                                           | EPIC-09 | Must     | M    | 1     | Done   |
| [US-055 — A front end that is robust to cold starts and expired sessions](stories/US-055-front-robuste.md)               | EPIC-09 | Must     | M    | 1     | Done   |
| [US-049 — Free and reproducible infrastructure](stories/US-049-infrastructure-gcp.md)                                    | EPIC-09 | Must     | M    | 1     | Done   |
| [US-050 — Continuous deployment to Cloud Run and Firebase Hosting](stories/US-050-deploiement-continu.md)                | EPIC-09 | Must     | M    | 1     | Done   |
| [US-052 — Games against the bot kept in the database](stories/US-052-parties-bot-en-base.md)                             | EPIC-09 | Must     | M    | 2     | Done   |
| [US-051 — Monitoring, verified backups and security scan](stories/US-051-supervision-sauvegardes-securite.md)            | EPIC-09 | Must     | S    | 2     | Done   |
| [US-053 — Privacy page and deletion of one's account](stories/US-053-confidentialite-suppression-compte.md)              | EPIC-09 | Should   | S    | 2     | Done   |
| [US-072 — An "Invite" page reserved for the project owner](stories/US-072-page-inviter.md)                               | EPIC-09 | Must     | M    | 2     | Done   |
| [US-059 — A game board that fits on a phone screen](stories/US-059-plateau-mobile-un-ecran.md)                           | EPIC-10 | Should   | M    | 2     | Done   |
| [US-060 — Navigation designed for the phone](stories/US-060-navigation-mobile.md)                                        | EPIC-10 | Should   | S    | 2     | Done   |
| [US-065 — Nudges at the right moment](stories/US-065-coups-de-pouce.md)                                                  | EPIC-11 | Should   | S    | 2     | Done   |
| [US-066 — A hint on demand, against the bot](stories/US-066-conseil-en-partie.md)                                        | EPIC-11 | Should   | M    | 2     | Done   |
| [US-054 — Sessions that expire and data that does not pile up](stories/US-054-sessions-purge.md)                         | EPIC-09 | Should   | M    | 3     | Done   |
| [US-057 — Light requests: indexes, bounded reads, cache and on-demand loading](stories/US-057-requetes-legeres-cache.md) | EPIC-09 | Should   | M    | 3     | Done   |
| [US-058 — Fair duels: unpredictable randomness and safe matchmaking](stories/US-058-duels-equitables.md)                 | EPIC-09 | Should   | S    | 3     | Done   |
| [US-061 — A visual identity and a home page that make you want to play](stories/US-061-accueil-identite-visuelle.md)     | EPIC-10 | Should   | M    | 3     | Done   |
| [US-063 — Install the game on your phone (PWA)](stories/US-063-pwa-installable.md)                                       | EPIC-10 | Could    | S    | 3     | Done   |
| [US-062 — Opening a booster, a real moment](stories/US-062-ouverture-booster-mise-en-scene.md)                           | EPIC-10 | Could    | M    | 3     | Done   |
| [US-067 — A guided first game](stories/US-067-premiere-partie-guidee.md)                                                 | EPIC-11 | Should   | L    | 3     | Done   |

## IT culture — cards that teach

Request from the project owner (2026-10-23): the game's first goal is IT culture; the cards must be rich while staying
fun, with links to external resources.

| Story                                                                                                     | Epic    | Priority | Size | Status |
| --------------------------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-073 — A "Learn more" sheet and external links for every card](stories/US-073-fiche-en-savoir-plus.md) | EPIC-12 | Must     | M    | Done   |
| [US-074 — Enrich the content of the 71 cards of set 1](stories/US-074-contenu-cartes-set-1.md)            | EPIC-12 | Must     | L    | Done   |

## Later — changes noted on 2026-10-23

Requests from the project owner, to be refined when the time comes.

| Story                                                                                       | Epic    | Priority | Size | Status |
| ------------------------------------------------------------------------------------------- | ------- | -------- | ---- | ------ |
| [US-068 — A visual review of the whole site](stories/US-068-revue-visuelle.md)              | EPIC-10 | Should   | M    | Done   |
| [US-069 — A score and a leaderboard](stories/US-069-score-classement.md)                    | EPIC-07 | Could    | L    | Done   |
| [US-070 — Boosters given by code, to reward real work](stories/US-070-boosters-par-code.md) | EPIC-03 | Should   | M    | Done   |

## Later — cards from the IT community

Request from the project owner (2026-10-19): let other tech leads and architects propose their cards, to help IT
culture. To be handled later; ADR to plan (identity, reviewer role, path to the catalogue, welcome set).

| Story                                                                                                                                      | Epic    | Priority | Size | Status      |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------- | -------- | ---- | ----------- |
| [US-027 — Contributor guide: the rules for creating a card](stories/US-027-guide-contributeur.md)                                          | EPIC-08 | Should   | S    | Done        |
| [US-028 — Kit for the contributor's AI: card and illustration prompts](stories/US-028-proposer-carte.md)                                   | EPIC-08 | Should   | M    | Done        |
| [US-029 — Review a card proposed in its pull request](stories/US-029-relire-propositions.md)                                               | EPIC-08 | Should   | S    | Done        |
| [US-030 — A card's author in the catalogue, and a first community card](stories/US-030-integrer-carte-acceptee.md)                         | EPIC-08 | Should   | M    | In progress |
| [US-031 — Credit contributors in the game](stories/US-031-crediter-contributeurs.md)                                                       | EPIC-08 | Could    | S    | To refine   |
| [US-086 — The contributor kit in English](stories/US-086-kit-contributeur-anglais.md)                                                      | EPIC-08 | Should   | S    | Done        |
| [US-076 — Design set 2: DDD, microservices, DevOps](stories/US-076-concevoir-set-2.md)                                                     | EPIC-13 | Could    | L    | To refine   |
| [US-077 — Three new cards: API First, EDA and GraphQL API](stories/US-077-api-first-eda-graphql.md)                                        | EPIC-13 | Should   | M    | Done        |
| [US-085 — Rebalance the GraphQL API card](stories/US-085-reequilibrer-api-graphql.md)                                                      | EPIC-13 | Should   | S    | Done        |
| [US-079 — The bilingual foundation: Angular i18n, two versions of the site and a language switcher](stories/US-079-socle-bilingue.md)      | EPIC-14 | Should   | M    | Done        |
| [US-080 — The whole interface in English](stories/US-080-interface-anglais.md)                                                             | EPIC-14 | Should   | L    | Done        |
| [US-081 — The cards, abilities, sheets and rules in English](stories/US-081-contenu-anglais.md)                                            | EPIC-14 | Should   | L    | Done        |
| [US-082 — Translated error messages and journeys verified in both languages](stories/US-082-erreurs-parcours-bilingues.md)                 | EPIC-14 | Should   | S    | Done        |
| [US-083 — Build, name and keep your own decks from your collection](stories/US-083-construire-ses-decks.md)                                | EPIC-15 | Should   | L    | Done        |
| [US-084 — Play with your deck against the bot and in duels](stories/US-084-jouer-avec-son-deck.md)                                         | EPIC-15 | Should   | M    | Done        |
| [US-087 — English as the repository language: ADR, CLAUDE.md, templates and closing script](stories/US-087-english-repository-language.md) | EPIC-16 | Should   | S    | Done        |
| [US-088 — Translate the product docs, READMEs, operations guide and review](stories/US-088-translate-product-docs.md)                      | EPIC-16 | Should   | M    | Ready       |
| [US-089 — Translate the ADRs](stories/US-089-translate-adrs.md)                                                                            | EPIC-16 | Should   | M    | Ready       |
| [US-090 — Translate the backlog (method, board, epics, stories)](stories/US-090-translate-backlog.md)                                      | EPIC-16 | Should   | L    | Done        |
| [US-091 — Translate the CHANGELOG](stories/US-091-translate-changelog.md)                                                                  | EPIC-16 | Could    | S    | Ready       |
