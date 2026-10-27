# US-080 — The whole interface in English

- **Epic**: EPIC-14
- **Status**: Done
- **ADR**: [0042](../../decisions/0042-site-bilingue-i18n-angular.md)
- **Priority**: Should
- **Size**: L
- **Branch**: `us-080-interface-anglais`

## Story

As an **English-speaking player**, I want to **read every screen, button, message and help text in English** so that I
can **play as easily as a French speaker**.

## Acceptance criteria

- [x] All the strings of the 16 screens are marked for translation (templates and TypeScript code, including the texts
      reserved for screen readers, the page titles and the messages of the nudges, the hint and the guided game).
      → 642 messages (`i18n` in the templates, `$localize` in the code); the `@angular-eslint/template/i18n` rule now
      forbids any hard-coded text in a template. The texts served by the API (cards, sheets, hint, guided-game
      bubbles) are translated by US-081, the API errors by US-082.
- [x] The English translation is complete, reviewed by the project owner, with a consistent game vocabulary (glossary:
      Throughput, SLA, booster, duel…).
      → `apps/web/src/locale/messages.en.json` complete (`npm run i18n:verifier`), glossary below; glossary and
      screenshots validated by the owner on 2026-10-24.
- [x] Dates, numbers and plurals follow the language.
      → `LOCALE` (`langue.ts`) for `Intl` (dates, percentages, relative durations, lists); plurals in ICU.
- [x] The board still fits on a phone screen in English (e2e test 375 × 667).
      → `e2e/langues.spec.ts` ("in English on a small phone"), axe audit included.

## Game glossary

British English; "tu" and "vous" both become "you"; product names are never translated.

### Game terms

| French                                  | English                      | Remark                                                     |
| --------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| SI (le système d'information du joueur) | System                       | capitalised: game term ("your System", "the bot's System") |
| SLA                                     | SLA                          | "20 SLA", "loses 3 SLA"                                    |
| Débit (l'énergie)                       | Throughput                   | "costs 3 Throughput"                                       |
| PV                                      | HP                           |                                                            |
| attaque (statistique)                   | attack                       |                                                            |
| composant (carte en jeu)                | component                    |                                                            |
| carte / main / pioche                   | card / hand / deck           | piocher → draw                                             |
| poser une carte                         | deploy a card                | "Poser" button → "Deploy"                                  |
| décommissionner                         | decommission                 |                                                            |
| finir mon tour                          | end my turn                  |                                                            |
| riposte / riposter                      | counter-attack               |                                                            |
| détruit                                 | destroyed                    |                                                            |
| capacité                                | ability                      | "Capacités en jeu" → "Abilities in play"                   |
| tour                                    | turn                         |                                                            |
| partie                                  | game                         | "Nouvelle partie" → "New game"                             |
| partie guidée / Apprendre à jouer       | guided game / Learn to play  |                                                            |
| conseil (« Un conseil ? »)              | hint ("A hint?")             |                                                            |
| coups de pouce                          | nudges                       |                                                            |
| booster                                 | booster                      | "Ouvrir un booster" → "Open a booster"                     |
| collection / catalogue                  | collection / catalogue       |                                                            |
| deck, boîte de deck                     | deck, deck box               |                                                            |
| duel / défi / défier                    | duel / challenge / challenge |                                                            |
| adversaire                              | opponent                     |                                                            |
| compte / pseudo                         | account / username           |                                                            |
| code de récupération                    | recovery code                |                                                            |
| invitation / inviter                    | invitation / invite          |                                                            |
| En savoir plus                          | Learn more                   | educational sheets                                         |
| set 1 · De FTP aux agents               | Set 1 · From FTP to agents   |                                                            |

### Rarities and families

Commune → Common · Rare → Rare · Épique → Epic · Légendaire → Legendary.
Fichiers → Files · ESB → ESB · API → API · iPaaS → iPaaS · EDA → EDA · IA agentique → Agentic AI ·
Patterns → Patterns · Bestiaire → Bestiary (incidents → incidents).

### Bots

Stagiaire → Intern · Batch de nuit → Nightly Batch · Architecte ESB → ESB Architect · Agent autonome → Autonomous Agent.
"le bot" → "the bot".

### Abilities

Batch → Batch · Vétéran → Veteran · Non conforme → Non-compliant · Sur site → On-premises · Hub → Hub ·
Point unique → Single point of failure · Garde → Guard · Quotas → Quotas · Connecteur → Connector ·
Diffusion → Broadcast · Réactif → Reactive · File durable → Durable queue · Supervision → Monitoring ·
Migration → Migration · Autonome → Autonomous · Orchestration → Orchestration · Outillage → Tooling ·
Délégation → Delegation · Contexte → Context · Garde-fous → Guardrails · Asynchrone → Asynchronous ·
Cache sémantique → Semantic cache · Routage multi-modèles → Multi-model routing.

### Card names that are translated (the others stay as they are)

Fichier CSV → CSV file · Fichier à positions fixes → Fixed-width file · Répertoire de dépôt → Drop folder ·
Fichier .ok témoin → .ok flag file · Adaptateur SAP → SAP Adapter · Adaptateur JDBC → JDBC Adapter ·
API REST → REST API · Portail développeur → Developer portal · Connecteur ERP → ERP connector ·
Connecteur SaaS → SaaS connector · Workflow low-code → Low-code workflow · Mapping de données → Data mapping ·
File d’attente → Queue · Orchestrateur multi-agents → Multi-agent orchestrator · Serveur MCP → MCP server ·
Base vectorielle → Vector database · Fenêtre de contexte → Context window · Prompt système → System prompt ·
Mot de passe en clair → Plain-text password · Certificat expiré → Expired certificate · Couplage fort → Tight coupling ·
Message poison → Poison message · Doublon → Duplicate · Fichier vide à 3 h du matin → Empty file at 3 a.m. ·
Encodage cassé → Broken encoding · Contexte saturé → Context overflow · Boucle d’agents → Agent loop ·
Facture de tokens → Token bill.

### Additions (2026-10-24, content writing)

défausse → discard pile · sort → spell · incident → incident · adverse → opposing · "Quand il est posé" → "When
deployed" · infliger X dégâts → deal X damage · deck d'initiation → Starter deck.

### Score and leaderboard (US-069, added when merging main)

classement → leaderboard · score → score · rang → rank ("1st", "2nd"… through `Intl.PluralRules`) · cote de duel →
duel rating · "Entre collègues" → "Among colleagues".

### Boosters given by code (US-070, added when merging main)

Offrir des boosters → Give boosters · code cadeau → gift code · réussite récompensée → success being rewarded ·
épuisé → used up · révoqué → revoked.

### Choices to review

"Attention :" → "Heads up:" · "En vrai" → "In real life" · "À retenir" → "Key takeaway" · abandon → "concede",
forfait → "forfeit" · "Entre joueurs" → "Player versus player" · "Lancer un défi" → "Issue a challenge" ·
"Outillé" → "Tooled" · on the board, "Votre SI : SLA 20 / 20" becomes "System: SLA 20 / 20" (under the heading "You")
to fit on one line at 375 px.

## Log

- 2026-10-24 — created, at the project owner's request (EPIC-14).
- 2026-10-24 — all strings marked and translated (642 messages), glossary, ESLint rule against hard-coded text,
  English board verified at 375 × 667.
- 2026-10-24 — delivered: The whole interface in English (688 messages), game glossary validated by the owner on
  2026-10-24, ESLint rule against hard-coded text, English board at 375 × 667
