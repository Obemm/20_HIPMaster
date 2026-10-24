# 0038 — Installable game: web manifest and Angular's service worker, never the API in cache

- **Date**: 2026-10-24
- **Status**: Accepted (validated by the project owner on 2026-10-24)

## Context

ADR 0006 announces a front end "delivered as a PWA", but the site had no manifest, no service worker and no icons: it
could not be installed on a phone's home screen (review of 2026-10-22). Constraints: the server is authoritative
(ADR 0004), so a cached game must never show a stale game state; strict CSP (`'self'` only); continuous deployment
(ADR 0028): a new version must reach the players who keep the game open.

## Decision

- **A web manifest** (`public/manifest.webmanifest`): name, short name "HIPMaster", `lang` `fr`, `standalone`
  display, colours of the night shell (`#0b1029`, ADR 0037), 192 and 512 px icons and a maskable icon (logo in the
  safe zone), taken from the logo.
- **Angular's service worker** (`@angular/service-worker`, `ngsw-config.json`), active only in the production build,
  registered once the application is stable (30 s at most after loading):
  - the interface (HTML, JS, CSS, font, logo, manifest) is cached from installation;
  - illustrations and icons on demand;
  - **no `dataGroup`**: calls to `/api/` always go through the network, never through the cache; a navigation to
    `/api/` is not served by `index.html` either.
- **Update**: the service worker looks for a new version at every load and every return to the tab; when it is
  ready, a banner offers "Reload".
- **Offline**: the interface opens from the cache and a banner says the game is played online (your cards and your
  games are kept by the server); each screen keeps its failure messages (US-055).
- **Tests**: the e2e journeys block the service worker (its requests would escape the failures simulated by
  `page.route`); a dedicated journey re-enables it and checks, on the production build, installability according to
  Chrome (`Page.getInstallabilityErrors`), opening offline and the absence of the API from the cache. Lighthouse has
  had no PWA category since version 12: this Chrome check replaces it.

## Alternatives considered

- **A hand-written service worker** or **Workbox**: more freedom, but to maintain and test yourself; Angular's
  follows the build versions (fingerprints, `ngsw.json`) and handles updates.
- **Caching some API reads** (catalogue, levels): faster offline, but the game is not played offline, and the
  catalogue already has its HTTP cache (US-057); the risk of a stale state outweighs it.
- **Publishing on application stores** (TWA, Capacitor): out of place for an invitation-only game.

## Consequences

- About 17 KB more JavaScript at first load (service worker module); the initial bundle stays under budget (455 KB).
- `ngsw-worker.js` and `ngsw.json` must stay revalidated at each visit: this is already the case (`no-cache` for
  everything except `/api/**` in `firebase.json`). To switch off the service worker in an emergency, publish
  `safety-worker.js` (provided by Angular) under the name `ngsw-worker.js`.
- A player who keeps the game open receives the new version at the next "Reload", sooner than before (they had to
  reload by themselves).
