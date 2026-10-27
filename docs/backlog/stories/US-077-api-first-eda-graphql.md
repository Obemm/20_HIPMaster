# US-077 — Three new cards: API First, EDA and GraphQL API

- **Epic**: EPIC-13
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `claude/us-077-api-first-eda-graphql-ca8e3f`

## Story

As a **player**, I want to **find the "API First", "EDA" and "GraphQL API" cards in the game** so that I can
**discover these approaches that are missing from the catalogue**.

## Acceptance criteria

- [x] **Given** the catalogue, **then** the three cards are in it (family, rarity, cost, attack and HP or effect,
      abilities, "In real life" text): "API First" and "GraphQL API" in the API family, "EDA" in the Event-driven
      family; a type (component, spell) is chosen for each and justified.
- [x] **Given** the game's balance, **then** a simulation against the bots shows that none of the three unbalances the
      decks (ADR 0010).
- [x] **Given** each card, **then** it has its "Learn more" sheet (EPIC-12) with at least one verified link, its
      illustration prompt and its illustration.
- [x] They enter the booster draw; existing collections do not change.

## Design (validated by the project owner on 2026-10-25)

- **Extension of set 1, numbers 72 to 74**, rather than opening set 2: the three topics belong to the API and
  Event-driven families of set 1; set 2 (US-076) will cover DDD, microservices and DevOps. All the code assumes a
  single set (`SET_1`, `/illustrations/set-1/`, collection and decks by number): a set 2 for three cards would have
  required an ADR and plumbing for no gain. The numbers follow the rule of ADR 0011 (never renumber): no new ADR.
- **Types**: API First and EDA are ways of designing, hence **spells** applied at a given moment, like the Patterns;
  GraphQL is a technology, hence a **component**.
- **Cards** (details and simulations: [cartes-set-1.md](../../produit/cartes-set-1.md#extension-api-first-eda-and-graphql-api-us-077-2026-10-25)):
  - 72 **API First** — rare spell, cost 3: draw the first two API cards of your deck, then one of your API components
    gains +1 attack (the contract first, then provider and consumers in parallel).
  - 73 **EDA** — epic spell, cost 3: each of your EDA components deals 1 damage to a randomly drawn opposing component
    (one fact published, each subscriber reacts on its own).
  - 74 **GraphQL API** — rare component, cost 3, 2/3: when deployed, draw one card per other component you have in
    play, 2 at most (one query, several sources).
- **No new ability**: the effects reuse targeted drawing (API Hub), reinforcement (OpenAPI), drawing per component in
  play (CDC) and effect damage (Splitter).
- **Creatures**: an architect weaverbird that stretches the nest plan before two teams each weave one half (72); a wolf
  whose howl, in violet waves, makes the wolves of the neighbouring ridges each react in their own way (73); a gourmet
  anteater that pricks three berries in three bushes with a single tongue and gathers them on a plate (74).
- **Boosters**: the draw reads the catalogue; 27 rares instead of 25 and 7 epics instead of 6. Collections reference
  cards by number: nothing changes for the cards already obtained.
- **Loaner decks** unchanged: their measured balance (US-064) remains valid.

## Notes

- Cards requested by the project owner on 2026-10-24.
- Illustrations generated with Gemini (ADR 0047), plate validated by the project owner on 2026-10-26; originals in
  `originaux/72-api-first.jpeg`, `73-eda.jpeg`, `74-api-graphql.jpeg`. `npm run illustrations` rerun in a worktree
  rewrote the 284 existing files with different bytes (originals or local `sharp` differing from those of the last
  generation): only the 12 files of cards 72 to 74 were kept, and the manifest regenerated from the files present
  (US-078's test checks it).

## Log

- 2026-10-24 — created, at the project owner's request.
- 2026-10-25 — refinement: design proposed and validated by the project owner (extension of set 1, 72 to 74), balance
  checked by simulation on two seeds; catalogue, effects, bot moves, fr and en sheets, translations, illustration
  prompts and tests.
- 2026-10-26 — delivered: cards 72 to 74 (API First, EDA, GraphQL API) added to set 1: effects, bot moves, fr/en
  sheets and texts, Gemini illustrations, balance checked on two seeds.
