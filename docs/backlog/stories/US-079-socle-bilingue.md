# US-079 — The bilingual foundation: Angular i18n, two versions of the site and a language switcher

- **Epic**: EPIC-14
- **Status**: Done
- **ADR**: [0042](../../decisions/0042-site-bilingue-i18n-angular.md)
- **Priority**: Should
- **Size**: M
- **Branch**: `us-079-socle-bilingue`

## Story

As an **English-speaking colleague**, I want **the site to open in my language and to be able to change it** so that I
can **play without a language barrier**.

## Acceptance criteria

- [x] An ADR, after consulting the the company reference (ADR 0005), fixes the tool (Angular's native i18n, or Transloco if
      the analysis justifies it), the organisation of the translations and the place of French as the reference
      language.
      → [ADR 0042](../../decisions/0042-site-bilingue-i18n-angular.md): `@angular/localize`, JSON translations in
      `apps/web/src/locale/`, French as the source language; the company [ref] (Localazy) adapted.
- [x] **Given** the production build, **then** a French and an English version are produced and served by Firebase
      Hosting (`/fr/`, `/en/`, and the root which redirects according to the browser's language), under the same
      strict CSP, with the PWA working in both languages.
      → `npm run build` compiles both languages then `scripts/langues/assembler-site.ts` assembles the site (shared
      files at the root, manifest and `ngsw.json` per language, English `index.html`, root page);
      `e2e/langues.spec.ts` and `e2e/pwa.spec.ts` on the production build, with no CSP violation.
- [x] **Given** a player, **when** they choose FR or EN in an accessible switcher, **then** they switch to the same
      page in the other language, and this choice is kept (browser preference, ADR 0032).
      → `hip-choix-langue` in the banner (`aria-current`, `lang`, `hreflang`, 44 px), `hipmaster.langue` read back by
      the root page; axe audit of the page in English.
- [x] `lang` is right on every page; the CI fails if a translation is missing.
      → `lang` set by Angular on each version; `i18nMissingTranslation: error` at build time and
      `npm run i18n:verifier` (extraction up to date, no missing or orphan translation) in the CI.
- [x] Continuous deployment (ADR 0028) publishes both versions.
      → `firebase.json` (rewrites per language, immutable cache in the sub-folders); the `site` step of `deployer.sh`
      checks `/`, `/fr/` and `/en/` after each publication.

## Notes

- Existing players have a service worker at the root: it is replaced there by Angular's `safety-worker.js`, which
  uninstalls itself and reloads the page once.
- Old links without a language (invitations, shared duels) go through the root page and keep their page, parameters
  and anchor.
- Apart from the switcher ("Language"), the interface stays in French in the English version: its translation is
  US-080.

## Log

- 2026-10-24 — created, at the project owner's request (EPIC-14).
- 2026-10-24 — Verified: CI of PR #88 green (e2e journeys and CSP on the production build included).
- 2026-10-24 — ADR 0042 (the company reference consulted: [ref] Localazy adapted, [ref] and [ref] kept), Angular
  i18n, `/fr/` and `/en/`, root page, switcher, translation check in the CI.
- 2026-10-24 — delivered: Two versions of the site (/fr/, /en/) through Angular i18n, root page that chooses the
  language, FR / EN switcher, translation check in the CI (ADR 0042)
