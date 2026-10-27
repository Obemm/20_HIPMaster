# US-081 — The cards, abilities, sheets and rules in English

- **Epic**: EPIC-14
- **Status**: Done
- **ADR**: [0043](../../decisions/0043-contenu-traduit-domaine-langue-api.md)
- **Priority**: Should
- **Size**: L
- **Branch**: `us-081-contenu-anglais`

## Story

As an **English-speaking player**, I want to **read the cards, their abilities and their "Learn more" sheets in
English** so that I can **learn while playing, like French speakers**.

## Acceptance criteria

- [x] The domain carries the texts of the 71 cards, the abilities, the "Learn more" sheets and the rules in French
      (reference) and in English; a test checks that no card lacks a translation.
      → `packages/domain/src/langues/` (cards, abilities, 71 sheets, decks, levels, guided-game bubbles, hint
      sentences); `langues/traductions.test.ts` fails on any missing text or text outside the reading bounds. The short
      "rules" is an interface text, translated in US-080.
- [x] The API serves the requested language (OpenAPI contract first), falling back to French; the catalogue's HTTP
      cache (US-057) distinguishes the languages.
      → `langue` parameter in `cartes.yaml` (1.3.0) and `parties.yaml` (1.6.0); one `ETag` per language;
      `apps/api/src/langues.test.ts`.
- [x] Product names are not translated; the sheets' external links point to an English resource when one exists.
      → product names kept (test); all the links of the English sheets are English, except the CNIL page on
      passwords, which has no English version.
- [x] The illustrations' alternative texts exist in both languages.
      → postponed until US-017 regenerated the 71 images, then delivered: each entry of `set-1.json` carries `alt`
      (French) and `altEn` (English, mandatory, same bounds of 10 to 200 characters); the generated manifest
      `illustrations.generated.ts` stores the texts by language and `ILLUSTRATIONS_CARTES` takes those of the site's
      language (`LANGUE`). The provisional illustration generator (US-018) also writes both languages.
      Tests: `chaine.test.ts`, `dessin.test.ts`, `versionnees.test.ts` (manifest up to date), `illustrations.spec.ts`.

## Glossary and choices to review

Glossary shared with US-080 (see that story). Choices specific to the content, to be validated by the owner:

- examples translated to stay readable (`orders.csv`, `/drop/incoming`, topics `sales/order/validated/v1/FR`, tool
  `search_api`); the source field `dateCommande` is kept to show two systems that do not speak the same way;
- sheet 51: the example system prompt says "Answer in English" (adaptation to the reader);
- sheet 60: the example password becomes `Summer2012`;
- decks: Héritage → Legacy, Moderne → Modern, Hybride → Hybrid, Initiation → Starter;
- alternative texts: British English like the rest of the site (`en-GB`: armoured, colour, organisation), "lumineux"
  rendered as _glowing_, "mécanique" as _mechanical_, with no card or product name.

## Log

- 2026-10-24 — created, at the project owner's request (EPIC-14).
- 2026-10-24 — ADR 0043; English catalogue texts in the domain, API according to `langue`, ETag per language, hint and
  guided game bilingual; alternative texts postponed (illustrations in progress).
- 2026-10-24 — delivered: Game content in English in the domain (cards, abilities, sheets, decks, levels, guided game,
  hint), API according to ?langue= with one ETag per language, validated by the owner on 2026-10-24; illustrations'
  alternative texts postponed
- 2026-10-24 — postponed criterion delivered: alternative texts of the 71 illustrations in English (`altEn` in
  `set-1.json`, manifest per language, the front end reads that of the site's language).
