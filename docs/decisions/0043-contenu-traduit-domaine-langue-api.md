# 0043 — Game content translated in the domain, served by the API according to the `langue` parameter

- **Date**: 2026-10-24
- **Status**: Proposed (direction chosen by the project owner on 2026-10-24, to be validated with US-081)

## Context

The interface is translated in the front end (ADR 0042), but the game's texts come from the API: names, effects and
"In real life" texts of the 71 cards, abilities, "Learn more" sheets (ADR [0036](0036-fiches-pedagogiques-cartes.md)),
loaned decks, bot levels, guided-game bubbles (ADR 0041) and hint sentences (ADR 0040). The catalogue is versioned
data of the domain (ADR 0011) and is sent with a public HTTP cache, in the browser and at Firebase Hosting (US-057,
ADR 0039). Game views only carry card numbers: the front end reads their texts from the catalogue.

## Decision

1. **Translations live in the domain**, next to the French which is authoritative: `packages/domain/src/langues/`
   (`textes.ts` for the types and the languages, `en/` for English: cards and abilities by number or identifier, one
   sheet per card filed by family, decks and levels by identifier). Rules (costs, statistics, abilities, identifiers)
   are never translated: only a catalogue card carries one, and its translation holds texts only.
2. **French serves as a fallback**, field by field (`traduireCarte`, `texteCapacite`, `ficheDe`, `traduireNomme`), and
   **a test forbids it from being used**: each language translates every card, ability, sheet (within the reading
   bounds of ADR 0036), deck, level and bubble.
3. **Computed sentences** (hint, guided game) take the language as a parameter, French by default: bots and
   simulations see nothing of it.
4. **The API serves the language requested by the `langue` query parameter** (`fr`, `en`), French by default or for an
   unknown value (no 400: an old client or a link without a language is still served). It applies to the catalogue
   (`/cartes`, `/cartes/{numero}`, `/decks`, `/niveaux`), the guided game (`guide` of each game response) and the
   hint. The front end adds it to every API call in the English version; the French version sends nothing and keeps
   the earlier addresses.
5. **One `ETag` per language**: each language is another representation of the catalogue, with its own hash; the
   5-minute public cache stays (US-057).
6. **Product names are not translated**; links in the English sheets point to an English resource when one exists (a
   single link stays in French: the CNIL has no English version).

## Alternatives considered

- **`Accept-Language`**: the HTTP standard, without touching addresses. But one address would have several
  representations: it would need `Vary: Accept-Language`, which Firebase Hosting's cache does not guarantee to honour
  for a Cloud Run response, and a browser set to French would read French on `/en/`. The parameter makes the language
  explicit and tells languages apart in every cache.
- **Translating in the front end** (Angular i18n files): the content would be in two places, and the hint or the
  guided game, computed by the server (ADR 0004), would stay in French.
- **A translation table in the database**: editable without a deployment, but the content would leave code review and
  tests, which ADR 0011 already rules out for cards.
- **The whole catalogue in all languages in a single response**: a single cache, but a catalogue twice as heavy for
  every player, who reads only one.

## Consequences

- Adding or touching up a card, a sheet or a deck requires its translation in each language: the domain test fails
  otherwise.
- The alternative texts of the illustrations, produced by the illustration pipeline (ADR 0015), remain to be translated
  once that pipeline is stable (US-081, deferred criterion).
- The error messages of refused actions (`ErreurAction`) stay in French: their stable code and their translation by
  the front end belong to US-082.
- The English catalogue weighs about as much as the French one; the server keeps both in memory, computed on demand.
