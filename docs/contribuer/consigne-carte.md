# Prompt for your AI coding assistant: writing the card

This prompt is for an **AI coding assistant working in your clone of the repository** (Claude Code, GitHub Copilot in
agent mode, Cursor…): it reads files, edits them and runs commands. It starts from your **filled-in proposal**, following
the [guide's template](regles-cartes.md#proposal-template), and produces everything a card needs except the picture
itself (see the [illustration prompt](consigne-illustration.md)).

## How to use it

1. Fill in the template and check it against the [content rules](regles-cartes.md#content-rules): nothing
   confidential, since everything you give the AI ends up in a public pull request.
2. In your clone, on a `carte-<card-name>` branch, start your assistant at the root of the repository.
3. Copy the prompt below, paste your proposal where indicated, and send it.
4. Read what it wrote (above all the "In real life" text, the sheet and the English texts; the project owner will
   review the French ones), then run `npm run check` yourself, and `npm run start:en` to see the card in the English
   catalogue (<http://localhost:4200>).

## The prompt

```text
You are working in the HIPMaster repository, a collectible card game about enterprise integration and IT architecture.
First read CLAUDE.md, docs/contribuer/regles-cartes.md and docs/produit/regles.md: they are authoritative.
The repository is written in British English (ADR 0051): code comments, documentation and commits. The game texts
exist in French (the reference language) and in British English: write both, even if the proposal is in English only.
A proposed card belongs to EPIC-08 (ADR 0050): do not write any story or epic in docs/backlog.

Your task: add to the catalogue the card described in the proposal below, and nothing else.

=== PROPOSAL ===
(paste your filled-in template here)
=== END OF PROPOSAL ===

Mandatory rules: stop and tell me, without writing anything, if
- the proposal needs an ability that does not exist (IDS_CAPACITE in packages/domain/src/capacites.ts; the English
  names are in packages/domain/src/langues/en/capacites.ts);
- its effect cannot be written with what the engine already does (damage, draw, attack or HP bonus, immobilisation,
  loss of abilities, return to hand, destruction, Throughput) and would need a new state, status or field in
  packages/domain/src/combat/types.ts: that touches the API, the OpenAPI contract and the game screen, and is a
  separate piece of work;
- it contains confidential data (server, address, customer, vulnerability, internal figure, person's name).
Also point out, without fixing them yourself, stats clearly outside the typical values of the guide, and an effect that
beats an existing card's at the same cost and rarity.
Do not change any existing card and never renumber a card.
Code: no enum or namespace (erasableSyntaxOnly); relative imports with the .ts extension. Game texts: typographic
apostrophe ’, like the existing cards.

Files to write or change (use cards 72 to 74 as a model, added by commit f189195):
1. packages/domain/src/set-1.ts: the card, at the end of the array, with the number following the last one (French
   name, family, type, rarity, cost, attack and HP for a component or an evolution, abilities, optional effect in
   French, enVrai in French of 110 characters at most, and auteur: the displayed author of the proposal, 40 characters
   at most), under a comment "// Community cards (EPIC-08)" to create if missing.
2. packages/domain/src/langues/en/cartes.ts: its name (product names are not translated), its "In real life" text and
   optional effect in British English, following the glossary at the top of the file, under the same comment; update
   the number of cards in the header.
3. packages/domain/src/fiches/<family>.ts: its "Learn more" sheet in French (definition, usage, exemple, aRetenir,
   enInterne only if the proposal gives it, 1 to 3 https links that you have opened), within LIMITES_FICHE
   (fiches/fiche.ts); and its English version in packages/domain/src/langues/en/fiches/<family>.ts. When a resource
   exists in both languages, the French sheet links to the French version, the English sheet to the English one.
4. If the card has an effect (every spell and incident, and components that have one):
   - the effect in the engine: packages/domain/src/combat/effets.ts (spells and incidents, EFFETS table) or
     packages/domain/src/combat/effets-composants.ts (components), reusing the functions of a similar effect; if you
     reuse an existing status, check that its text in apps/web/src/app/jeu/journal.ts stays correct for this card
     (some give a fixed value); otherwise stop and tell me;
   - the card number in SORTS_ET_INCIDENTS_PRIS_EN_CHARGE or COMPOSANTS_A_EFFET
     (packages/domain/src/combat/prise-en-charge.ts);
   - for a spell or an incident, its score for the bot in packages/domain/src/combat/bot-sorts.ts, modelled on the
     similar effect (the bot plays a card from 20; aim for 20 to 40 for a useful effect, 0 when it is useless);
   - tests of the effect in effets.test.ts or effets-composants.test.ts.
5. Card counts written in the code: look for the current number of cards (for instance 74) and the count per rarity in
   packages/domain/src/set-1.test.ts, packages/domain/src/booster.test.ts,
   packages/domain/src/combat/effets-composants.test.ts, apps/api/src/app.test.ts, e2e/catalogue.spec.ts (and the
   number of cards of the filtered family), e2e/collection.spec.ts and e2e/robustesse.spec.ts, and update them.
6. docs/produit/cartes-set-1.md: a row for the card in a section "Community cards (EPIC-08)", placed just before
   "Points to settle during balancing" (create it if missing), as a table modelled on the
   US-077 extension ("En vrai" shortened), with an Auteur column. Do not change the family headings.
7. CHANGELOG.md: one line under "Unreleased", "Added", naming the card and its author.

If you had to add an interface text (which should not happen with the rules above), run `npm run i18n:extraire` and
translate it in apps/web/src/locale/messages.en.json.

Checks: run `npx prettier --write` on the changed files, then `npm run check` at the root, and fix until it passes.
Do not touch the illustrations, which have their own prompt: until the picture is added, exactly one test stays red,
"chaque carte du set 1 a son illustration" (packages/illustrations/src/versionnees.test.ts), and that is expected;
since it stops `npm test` before the front-end tests, also run `npm test -w @hipmaster/web`.

To finish, give me in English: the card as it will be displayed (French and English texts), the list of changed
files, anything you are unsure about (technical accuracy, balance, translation), and what you changed compared with
the proposal (a replaced link, a shortened text).
```

## Next steps

- **The illustration**: follow the [illustration prompt](consigne-illustration.md); once the picture is added,
  `npm run check` passes entirely. You may open the pull request before, saying so: the CI will stay red on the
  illustration test only.
- **The pull request**: commit (for instance `feat(carte): add the circuit breaker card`, lowercase subject), push to
  your fork and open the pull request against `main` with the "card" template (see
  [CONTRIBUTING.md](../../CONTRIBUTING.md)). The CI measures the card's balance; you can do it beforehand with
  `npm run simuler:carte -- <card number>`.

This prompt follows the game's code: if it misses a file (a failing test, a new language), say so in your pull
request and it will be fixed.
