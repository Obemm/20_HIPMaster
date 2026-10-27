# US-082 — Translated error messages and journeys verified in both languages

- **Epic**: EPIC-14
- **Status**: Done
- **ADR**: [0042](../../decisions/0042-site-bilingue-i18n-angular.md), [0043](../../decisions/0043-contenu-traduit-domaine-langue-api.md)
- **Priority**: Should
- **Size**: S
- **Branch**: `us-082-erreurs-parcours-bilingues`

## Story

As a **player**, I want to **understand errors in my language** so that I **know what to do when an action is
refused**.

## Acceptance criteria

- [x] API errors (Problem Details) carry a stable code that the front end translates; the French text remains as a
      fallback.
      → `apps/api/src/problemes.ts`: every error carries `code` (reason for the refusal, engine code for a refused
      action, `requete-invalide`, `trop-de-requetes`…), described in each OpenAPI contract; the front end translates
      action refusals by code (`reseau/probleme.ts`) and keeps the API's French text as a fallback. The front end's
      other error messages, chosen from the HTTP status, have been translated since US-080.
- [x] The main e2e journeys run in both languages, accessibility audit included.
      → `e2e/parcours-anglais.spec.ts` (account, booster, collection, card and sheet, game against the bot, guided
      game) and `e2e/langues.spec.ts` in English; the existing series covers French.
- [x] The operations guide and the CHANGELOG say how to add a language.
      → "Les langues du jeu" in `docs/exploitation/README.md`.

## Log

- 2026-10-24 — created, at the project owner's request (EPIC-14).
- 2026-10-24 — stable error codes, action refusals translated by code, English journeys, guide to add a language.
- 2026-10-24 — delivered: Stable error codes in every Problem Details, action refusals translated by code, main
  journeys verified in English, guide to add a language
