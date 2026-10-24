# 0042 — One site per language: Angular's native i18n, `/fr/` and `/en/`, the root chooses

- **Date**: 2026-10-24
- **Status**: Proposed (direction chosen by the project owner on 2026-10-24, to be validated with US-079)

## Context

The project owner is opening HIPMaster to English-speaking colleagues at the company (EPIC-14): the game must be playable in
French or in English, interface and content. French is the reference language: the code, the documentation and the
catalogue are written in French.

Constraints:

- strict CSP in `firebase.json` (`script-src 'self'; style-src 'self'`, ADR [0028](0028-deploiement-continu.md)): no
  inline script, hence no small redirect script inside a page;
- PWA (ADR [0038](0038-pwa-service-worker-angular.md)): Angular's service worker checks the hash of every file it
  caches;
- continuous deployment (ADR 0028): publication through the Firebase Hosting REST API, from `firebase.json`;
- preferences kept by the browser, without cookies (ADR [0032](0032-preferences-interface-navigateur.md));
- no paid service; players who have already installed the game, with a service worker at the root of the site.

## Decision

1. **Angular's native i18n** (`@angular/localize`): templates carry `i18n`, code uses `$localize`. The production build
   compiles one version per language, with translations replaced at compile time: no runtime cost, nothing to load,
   and a missing translation **fails the build** (`i18nMissingTranslation: error`).
2. **Translations in Angular's JSON format**, in `apps/web/src/locale/`: `messages.json` (the French texts, extracted
   from the code by `npm run i18n:extraire`, committed) and `messages.en.json` (their translation). Identifiers are
   computed by Angular from the text: touching up a French text forces its translation to be reviewed. The shell
   before start-up (description, preview of shared links, loading message of `index.html`, and the web manifest) is
   translated in `coquille.en.json`, which Angular does not cover.
3. **One address per language**: `/fr/…` and `/en/…`, each with its own `index.html` (`lang` and `<base href>` set by
   Angular), its bundles, its manifest and its service worker. The shared files (illustrations, font, icons, logo)
   stay **only once at the root**, addressed in absolute terms (`/cartes/…`): an illustration seen in French is not
   downloaded again in English. The service worker of each language caches them by address pattern (`urls` in
   `ngsw-config.json`).
4. **The root chooses the language**: `/` and any path without a language (old links, invitations, shared duels) serve
   a small page whose script, served by the site, takes the player to the same page in their language: first the one
   chosen in the selector, then the first browser language the game speaks, and **English by default** (the game is
   open to colleagues from all countries). This page carries the preview of shared links of the French version, for
   messaging apps that do not run scripts.
5. **A FR / EN selector** in the header: the language of the page flagged with `aria-current`, the other one a link to
   the same page in its language (`lang`, `hreflang`), full reload. The choice is kept by the browser
   (`hipmaster.langue`, ADR 0032), through `PreferencesService`; the root page reads it back outside Angular.
6. **Assembly after the build** (`scripts/langues/assembler-site.ts`, run by `npm run build`): shared files at the
   root, manifest of each language (a single `id` and a `scope` at the root: one installed application, which opens in
   the last language played), translated `index.html`, then the `ngsw.json` of each language **recomputed** by
   Angular's tool (`ngsw-config`), since those files have changed.
7. **Existing players**: at the root, `ngsw-worker.js` becomes Angular's `safety-worker.js`, which empties its cache,
   uninstalls itself and reloads the page; the player then lands on the root page, then in their language.
8. **Firebase Hosting**: rewrites `/fr/**` → `/fr/index.html`, `/en/**` → `/en/index.html`, then `**` →
   `/index.html` (the root page); the immutable cache applies to the hashed files of all folders (`/**/*-…`). The
   `site` step of the deployment checks each language.
9. **CI check** (`npm run i18n:verifier`): the committed extraction is up to date, every text has its translation in
   each language, with no orphan translation, and each language has its shell. The development server serves French
   only, without a prefix; `npm run start:en` serves English.

The game content (cards, abilities, sheets, rules) comes from the API: its translation and the way the API serves a
language are the subject of a separate ADR (US-081).

## Alternatives considered

- **Transloco** (or `ngx-translate`), translations loaded at runtime: instant language switch, a single build. But
  files to download at start-up, keys to write by hand everywhere, and nothing at compile time to flag a missing
  translation; switching language is rare, a reload is enough.
- **A continuous localisation service**: third-party, paid beyond its free tier, and an account to open for a personal
  project. Angular's format remains importable if the need for a translation team arises.
- **Firebase Hosting's `i18n` setting** (language chosen by Hosting, from `Accept-Language`): it relies on a cookie
  (`firebase-language-override`) to remember the choice, which ADR 0032 rules out, and `hebergement.ts` as well as
  the e2e journeys' server would have to imitate it; the root page does the same thing in thirty lines.
- **Redirection by the server** (Cloud Run in front of the front end): one more round trip and a dependency of the
  front end on the API, for no gain.
- **XLIFF format** (Angular's default): richer, but verbose to read and to write by hand; JSON is enough for two
  languages.
- **Shared files copied into each language** (Angular's default behaviour): simpler, but each illustration would have
  two addresses, downloaded and cached twice.

## Consequences

- The production build produces two versions (≈ 2 × the JavaScript compile time, a few seconds); Hosting stores
  identical files only once (hashes).
- Every displayed text goes through `i18n` or `$localize` (US-080); a text added without an English translation breaks
  the build and the CI. Run `npm run i18n:extraire` after each text change, then translate.
- Game addresses gain a prefix: old links go through the root page, one more redirect, with nothing broken.
- Changing language reloads the page; the session (token kept by the browser) stays open.
- The first load after going live reloads the page once for players who had the game in cache.
- Adding a language: an entry in `angular.json`, `messages.<language>.json` and `coquille.<language>.json`, a rewrite
  in `firebase.json` and the language in `LANGUES` (front end and root page); the guide is given in US-082.
