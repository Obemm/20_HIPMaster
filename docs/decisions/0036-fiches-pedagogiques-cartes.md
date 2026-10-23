# 0036 — "Learn more" sheets are versioned with the catalogue and served with a card's detail

- **Date**: 2026-10-24
- **Status**: Accepted

## Context

The game's primary goal is acculturation (EPIC-12): each card must teach something accurate, without becoming a
wall of text. US-073 adds to each card a "Learn more" sheet (definition, usage, example, pitfall, external
resources), and US-074 writes it for the 71 cards. We must decide where this content lives, how it is validated, how
the API serves it and how the front end opens links to other sites. The catalogue is already versioned data in the
domain (ADR 0011); the `GET /cartes` list is loaded by the game, the boosters and the catalogue, often on a phone.
The repository is public (ADR 0022) and the site is subject to a strict CSP (`firebase.json`).

## Decision

- **The sheets live in `packages/domain/src/fiches/`**, in typed TypeScript, **one file per family**, indexed by card
  number. They touch neither rules nor statistics: a sheet is reviewed and corrected without reviewing `set-1.ts`,
  family by family (US-074).
- **A pure function `problemesFiche` sets the format**, and the domain tests apply it to every sheet: fields filled
  in, bounded lengths (under a minute's reading), 1 to 3 distinct, titled `https` links, in French or English, and
  each sheet filed in the file of its card's family.
- **The "At the company" field is optional** and only reuses facts already public in the repository
  (`docs/produit/univers.md`, `cartes-set-1.md`): nothing is invented or taken from internal documents.
- **The API serves the sheet with a card's detail** (`GET /api/v1/cartes/{numero}`, schema `CarteDetaillee`) and
  **not in the list** `GET /api/v1/cartes`, which stays light. The OpenAPI contract moves to 1.1.0.
- **The front end unfolds the sheet on demand**: a "Learn more" button (`aria-expanded`) under the "In real life"
  text of the detail (catalogue, collection, card seen from a booster) and of the panel of the card chosen in a game.
  In a game, the sheet is requested on first opening only.
- **External links** open in a new tab with `rel="noopener noreferrer"` and `hreflang`, announce the new tab to
  screen readers, and show the site and the language before the click. The site loads nothing from these sites (no
  preview, no favicon): **the CSP does not change**, a top-level navigation not being subject to it.

## Alternatives considered

- **A `fiche` field in each card of `set-1.ts`**: everything in one place, but a file of over 2,000 lines where the
  teaching text mixes with the rules, and a more painful review by family.
- **Content in Markdown or in the database**: more flexible to write, but outside the domain tests (ADR 0011); the
  database would impose an editing tool with no real need.
- **Sheet included in the catalogue list**: one round trip fewer in a game, but a list four times heavier (21 KB of
  JSON today, about 90 KB with 71 sheets of one kilobyte), loaded at every game and every booster opening, for
  content read on demand.
- **A dedicated modal window for the sheet**: a window on top of the detail window, heavier with a keyboard and on a
  phone than a simple disclosure.

## Consequences

- Correcting a sheet takes a PR, like a card; that is also what guarantees it gets reviewed.
- Link validation in the tests is offline (`https` form): checking that a link responds and covers the right topic
  remains a writing step (`npm run fiches:liens`, US-074).
- In a game, opening a sheet costs one request; offline, the sheet shows an error with "Retry".
- Future community cards (EPIC-08) will follow the same sheet model.
