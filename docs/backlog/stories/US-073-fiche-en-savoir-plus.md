# US-073 — A "Learn more" sheet and external links for every card

- **Epic**: EPIC-12
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-073-fiche-en-savoir-plus`
- **Decision**: [ADR 0036](../../decisions/0036-fiches-pedagogiques-cartes.md)

## Story

As a **curious player**, I want to **open, from any card, a sheet that really explains what it is about and where to
learn more** so that I can **learn about integration while playing, without the card itself turning into a wall of
text**.

## Design

- **Model** (`packages/domain/src/fiches/`, ADR 0036): a sheet carries `definition` (what it is, in one sentence),
  `usage` (what it is for; for an incident, how it occurs), `exemple`, `aRetenir` (the pitfall or the good practice),
  an optional company field (removed by US-097) and 1 to 3 `liens` (`titre`, `url` in
  `https`, `langue` `fr` or `en`). One file per family, indexed by card number.
- **Validation**: `problemesFiche` bounds the lengths (220 / 360 / 360 / 320 / 240 characters, 1,300 in all, i.e. less
  than a minute of reading) and checks the links; the domain tests apply it to every sheet.
- **API**: `GET /api/v1/cartes/{numero}` returns the card and its `fiche` (`CarteDetaillee` schema, OpenAPI contract
  1.1.0); the list `GET /api/v1/cartes` does not carry it, to stay light.
- **Front end**: `hip-en-savoir-plus` component, a "Learn more" button (`aria-expanded`, `aria-controls`) that unfolds
  the sheet under the "In real life" text. In a card's detail (catalogue, collection, card seen from a booster), it only
  appears if the sheet exists; in the panel of the card chosen during a game, it asks the API for the sheet on first
  opening, and announces a sheet that is still to be written.
- **External links**: `target="_blank"`, `rel="noopener noreferrer"`, `hreflang`, "(new tab)" for screen readers, and
  under each link the site and the language ("en.wikipedia.org · in English"); a sentence warns that these links open
  another site. Nothing is loaded from these sites: the CSP does not change.
- **Pilot cards** (one per family): FTP (1), webMethods Integration Server 10.15 (9), Apigee API Gateway (18),
  webMethods.io (26), Solace Event Mesh (31), MCP server (44), Dead Letter Queue (53), Prompt injection (59).

## Acceptance criteria

- [x] **Given** the domain's card model (ADR 0011), **then** a card can carry a sheet: a one-sentence definition, what
      it is for, a concrete example, a pitfall or a good practice, and a list of external links (title, address,
      language). This data is versioned with the catalogue and validated by the domain tests (`https` addresses,
      mandatory fields).
- [x] **Given** a displayed card (catalogue, collection, detail during a game, booster opening), **then** a "Learn
      more" button opens the sheet. The text visible on the card stays short and playful.
- [x] **Given** an external link, **then** it opens in a new tab (`rel="noopener noreferrer"`) and signals that the
      player is leaving the game; the site's CSP does not have to change.
- [x] **Given** a few pilot cards (at least one per family), **then** their sheet is written and reviewed, to validate
      the format before US-074.
- [x] The catalogue API returns the sheet (OpenAPI contract updated first); accessibility (keyboard, screen reader,
      375 px).

## Notes

- Tone: learn without getting bored. A sheet reads in under a minute; team humour has its place in the card's flavour
  text, the sheet stays accurate.
- Possible external resources: Wikipedia, vendor documentation (Apigee, Solace, webMethods…), standards (RFC, OpenAPI,
  AsyncAPI), _Enterprise Integration Patterns_. Prefer public and stable sources.
- Request from the project owner (2026-10-23): "the goal of the game is above all acculturation […] but they must
  still remain playful".
- From a booster, the sheet opens through the card's detail (each revealed card already leads there, US-023).
- The "At the company" texts of the pilots only use the game's universe (`docs/produit/univers.md`): to be confirmed by the
  project owner during review.

## Log

- 2026-10-23 — created, at the project owner's request.
- 2026-10-24 — refinement (design, ADR 0036) and implementation: model and validation in the domain, OpenAPI contract
  1.1.0 then API, "Learn more" component in a card's detail and during a game, 8 pilot sheets with verified links
  (200 response, right subject), unit and e2e tests.
- 2026-10-24 — delivered: "Learn more" sheet: model validated in the domain, API (contract 1.1.0), accessible
  disclosure in the detail and during a game, 8 pilot cards
- 2026-10-24 — ADR renumbered 0036: 0034 was taken in parallel by US-058 (randomness and matchmaking).
