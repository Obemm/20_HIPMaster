# US-080 — Toute l'interface en anglais

- **Epic** : EPIC-14
- **Statut** : Faite
- **ADR** : [0042](../../decisions/0042-site-bilingue-i18n-angular.md)
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-080-interface-anglais`

## Récit

En tant que **joueur anglophone**, je veux **lire chaque écran, bouton, message et aide en anglais** afin de **jouer
aussi facilement qu'un francophone**.

## Critères d'acceptation

- [x] Toutes les chaînes des 16 écrans sont marquées pour la traduction (gabarits et code TypeScript, y compris les
      textes réservés aux lecteurs d'écran, les titres de page et les messages des coups de pouce, du conseil et de
      la partie guidée).
      → 642 messages (`i18n` dans les gabarits, `$localize` dans le code) ; la règle `@angular-eslint/template/i18n`
      interdit désormais tout texte en dur dans un gabarit. Les textes servis par l'API (cartes, fiches, conseil,
      bulles de la partie guidée) sont traduits par US-081, les erreurs de l'API par US-082.
- [x] La traduction anglaise est complète, relue par le porteur du projet, avec un vocabulaire du jeu constant
      (glossaire : Débit, SLA, booster, duel…).
      → `apps/web/src/locale/messages.en.json` complet (`npm run i18n:verifier`), glossaire ci-dessous ; glossaire et
      captures validés par le porteur le 2026-10-24.
- [x] Les dates, nombres et pluriels suivent la langue.
      → `LOCALE` (`langue.ts`) pour `Intl` (dates, pourcentages, durées relatives, listes) ; pluriels en ICU.
- [x] Le plateau tient toujours dans un écran de téléphone en anglais (test e2e 375 × 667).
      → `e2e/langues.spec.ts` (« en anglais sur un petit téléphone »), audit axe compris.

## Glossaire du jeu

Anglais britannique ; « tu » et « vous » deviennent « you » ; les noms de produits ne se traduisent jamais.

### Termes du jeu

| Français                                | Anglais                      | Remarque                                                         |
| --------------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| SI (le système d'information du joueur) | System                       | majuscule : terme de jeu (« your System », « the bot's System ») |
| SLA                                     | SLA                          | « 20 SLA », « loses 3 SLA »                                      |
| Débit (l'énergie)                       | Throughput                   | « costs 3 Throughput »                                           |
| PV                                      | HP                           |                                                                  |
| attaque (statistique)                   | attack                       |                                                                  |
| composant (carte en jeu)                | component                    |                                                                  |
| carte / main / pioche                   | card / hand / deck           | piocher → draw                                                   |
| poser une carte                         | deploy a card                | bouton « Poser » → « Deploy »                                    |
| décommissionner                         | decommission                 |                                                                  |
| finir mon tour                          | end my turn                  |                                                                  |
| riposte / riposter                      | counter-attack               |                                                                  |
| détruit                                 | destroyed                    |                                                                  |
| capacité                                | ability                      | « Capacités en jeu » → « Abilities in play »                     |
| tour                                    | turn                         |                                                                  |
| partie                                  | game                         | « Nouvelle partie » → « New game »                               |
| partie guidée / Apprendre à jouer       | guided game / Learn to play  |                                                                  |
| conseil (« Un conseil ? »)              | hint (« A hint? »)           |                                                                  |
| coups de pouce                          | nudges                       |                                                                  |
| booster                                 | booster                      | « Ouvrir un booster » → « Open a booster »                       |
| collection / catalogue                  | collection / catalogue       |                                                                  |
| deck, boîte de deck                     | deck, deck box               |                                                                  |
| duel / défi / défier                    | duel / challenge / challenge |                                                                  |
| adversaire                              | opponent                     |                                                                  |
| compte / pseudo                         | account / username           |                                                                  |
| code de récupération                    | recovery code                |                                                                  |
| invitation / inviter                    | invitation / invite          |                                                                  |
| En savoir plus                          | Learn more                   | fiches pédagogiques                                              |
| set 1 · De FTP aux agents               | Set 1 · From FTP to agents   |                                                                  |

### Raretés et familles

Commune → Common · Rare → Rare · Épique → Epic · Légendaire → Legendary.
Fichiers → Files · ESB → ESB · API → API · iPaaS → iPaaS · EDA → EDA · IA agentique → Agentic AI ·
Patterns → Patterns · Bestiaire → Bestiary (incidents → incidents).

### Bots

Stagiaire → Intern · Batch de nuit → Nightly Batch · Architecte ESB → ESB Architect · Agent autonome → Autonomous Agent.
« le bot » → « the bot ».

### Capacités

Batch → Batch · Vétéran → Veteran · Non conforme → Non-compliant · Sur site → On-premises · Hub → Hub ·
Point unique → Single point of failure · Garde → Guard · Quotas → Quotas · Connecteur → Connector ·
Diffusion → Broadcast · Réactif → Reactive · File durable → Durable queue · Supervision → Monitoring ·
Migration → Migration · Autonome → Autonomous · Orchestration → Orchestration · Outillage → Tooling ·
Délégation → Delegation · Contexte → Context · Garde-fous → Guardrails · Asynchrone → Asynchronous ·
Cache sémantique → Semantic cache · Routage multi-modèles → Multi-model routing.

### Noms de cartes qui se traduisent (les autres restent tels quels)

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

### Ajouts (2026-10-24, rédaction du contenu)

défausse → discard pile · sort → spell · incident → incident · adverse → opposing · « Quand il est posé » → « When
deployed » · infliger X dégâts → deal X damage · deck d'initiation → Starter deck.

### Score et classement (US-069, ajoutés à la fusion de main)

classement → leaderboard · score → score · rang → rank (« 1st », « 2nd »… par `Intl.PluralRules`) · cote de duel →
duel rating · « Entre collègues » → « Among colleagues ».

### Boosters offerts par code (US-070, ajoutés à la fusion de main)

Offrir des boosters → Give boosters · code cadeau → gift code · réussite récompensée → success being rewarded ·
épuisé → used up · révoqué → revoked.

### Choix à relire

« Attention : » → « Heads up: » · « En vrai » → « In real life » · « À retenir » → « Key takeaway » · abandon →
« concede », forfait → « forfeit » · « Entre joueurs » → « Player versus player » · « Lancer un défi » → « Issue a
challenge » · « Outillé » → « Tooled » · sur le plateau, « Votre SI : SLA 20 / 20 » devient « System: SLA 20 / 20 »
(sous le titre « You ») pour tenir sur une ligne à 375 px.

## Journal

- 2026-10-24 — création, à la demande du porteur du projet (EPIC-14).
- 2026-10-24 — toutes les chaînes marquées et traduites (642 messages), glossaire, règle ESLint contre le texte
  en dur, plateau anglais vérifié en 375 × 667.
- 2026-10-24 — livrée : Toute l'interface en anglais (688 messages), glossaire du jeu validé par le porteur le 2026-10-24, règle ESLint contre le texte en dur, plateau anglais en 375 × 667
