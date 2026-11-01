# EPIC-14 — A game in French and English

- **Status**: Done
- **Priority**: Should

## Goal

The project owner wants to open HIPMaster to English-speaking colleagues (decision of 2026-10-24): the game
must be playable **in French or English**, interface and content alike (cards, abilities, "Learn more" sheets, rules).
The project documentation, backlog, ADRs and commits stay in French (project rule at the time).

Direction proposed by Claude and adopted by the project owner, to be recorded in an ADR after consulting the company
reference (ADR 0005):

- **interface**: Angular's native i18n (`@angular/localize`, `ng extract-i18n`), one compiled version per language
  served under `/fr/` and `/en/`; no runtime cost, compatible with the strict CSP (ADR 0028) and the PWA
  (ADR 0038). Fallback studied: Transloco, if switching language must be instant;
- **game content**: translations in the domain (`packages/domain`), by language and card number, French being
  authoritative and serving as the fallback; the API serves the requested language; product names are not translated;
- **language choice**: the browser's language on the first visit, then an FR / EN selector kept as a browser
  preference (ADR 0032);
- **translations**: written by Claude, reviewed by the project owner; no paid translation service.

## Success indicator

- An English-speaking player goes through the whole journey (account, boosters, collection, game, duel, sheets)
  without coming across a word of French, and vice versa.
- No hard-coded interface string: `ng extract-i18n` leaves no text without an identifier, and a CI check verifies
  that each language has all its translations.
- The e2e journeys pass in both languages, accessibility audit included (correct `lang` on every page).

## Stories

- [x] US-079 — The bilingual foundation: Angular i18n, two versions of the site and a language switcher
- [x] US-080 — The whole interface in English
- [x] US-081 — The cards, abilities, sheets and rules in English
- [x] US-082 — Translated error messages and journeys verified in both languages

Order: US-079 first (foundation and ADR), then US-080 and US-081 (independent), and US-082 to finish.

## Out of scope

- Other languages: the foundation must allow them, without delivering them.
- Translation of the project documentation.
