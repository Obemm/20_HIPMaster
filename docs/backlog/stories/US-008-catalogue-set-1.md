# US-008 — Set 1 catalogue

- **Epic**: EPIC-01
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-008-catalogue-set-1`

## Story

As a **player on the integration team**, I want **to browse all the cards of set 1 on my phone**
so that **I can discover the game's universe and read through the set before being able to play it**.

## Acceptance criteria

### Domain (`packages/domain`)

- [x] The model of a card is typed: number, name, family, type (Component, Spell, Incident, Evolution of…), rarity,
      cost in Throughput, attack and HP (components and evolutions only), abilities, effect, "In real life" text, and
      source card for an evolution.
- [x] The abilities of the [rules glossary](../../produit/regles.md) are a typed list (identifier, name,
      description); a card only references known abilities.
- [x] The cards of the [draft of set 1](../../produit/cartes-set-1.md) are entered as versioned data: the 64 numbered
      cards and the 7 additional incidents (numbers 65 to 71).
- [x] Tests check the invariants of the set: unique and continuous numbers, 4 legendaries, every evolution references
      an existing card, no attack or HP on a spell or an incident, costs between 0 and 10.

### API (`apps/api`)

- [x] The OpenAPI contract of the `cartes` resource is written in `apps/api/openapi/` before the code (ADR 0007).
- [x] **Given** the API is started, **when** I call `GET /api/v1/cartes`, **then** I receive the 71 cards sorted by
      number, with their detailed abilities.
- [x] **When** I call `GET /api/v1/cartes/{numero}` with an unknown number, **then** I receive a 404 in Problem
      Details format.

### Front end (`apps/web`)

- [x] **Given** the front end, **when** I open `/cartes`, **then** I see all the cards with name, family, rarity,
      cost, attack/HP, abilities and effect, and the rarity can be read by means other than colour.
- [x] I can filter by family and by rarity; the number of cards displayed is announced to screen readers.
- [x] **When** I open a card, **then** I see its detail: description of the abilities, "In real life" text and, for an
      evolution, a link to its source card.
- [x] The page can be used with the keyboard and at a width of 375 px without horizontal scrolling; the axe-core
      audit reports no violation.
- [x] A link from the home page leads to the catalogue.

### Quality

- [x] An e2e journey covers the catalogue (list, filter, detail); `npm run check`, `npm run build` and
      `npm run test:e2e` pass.

## Notes

- No illustration (EPIC-05): the card is rendered as text, with a visual marker for family and rarity.
- The abilities are **described**, not yet **applied**: their effects belong to the combat engine (story to come).
- **Decision** ([ADR 0011](../../decisions/0011-catalogue-cartes-versionne.md)): the catalogue is versioned data in the
  code of `packages/domain`, not in the database. The database will only keep what belongs to players (collection,
  decks). The provisional `cartes` table of US-004 will be removed in the first collection story (EPIC-03).
- Provisional statistics: they will be balanced later through "bot against bot" simulations.

## Log

- 2026-10-18 — created.
- 2026-10-18 — ADR 0011; domain: card model, 23 abilities, 71 cards and invariant tests; API: contract
  `apps/api/openapi/cartes.yaml`, `GET /api/v1/cartes` and `/cartes/{numero}`; front end: home page moved into its
  own route, filterable catalogue `/cartes` and detail `/cartes/:numero`, explicit page background; 4 e2e journeys
  (mobile and desktop) with axe-core audit. In review.
- 2026-10-18 — delivered: set 1 catalogue: 71 cards as domain data (ADR 0011), /api/v1/cartes API, filterable catalogue and detail pages, e2e journeys with axe-core audit
