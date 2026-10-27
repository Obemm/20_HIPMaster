# US-055 — A front end that is robust to cold starts and expired sessions

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-055-front-robuste`

## Story

As a **player**, I want **the game to tell me clearly when the server is slow, unavailable or my session has expired,
and let me retry** so that **I never lose my account nor stay stuck on "Loading…"**.

## Context

Front end review of 2026-10-22, findings verified (live, Cloud Run cold-starts in 1 to 3 s, redeploys often, and will
return 429s with US-047):

- **risk of losing an account**: if `GET /api/v1/moi` fails other than with a 401 (temporary outage, deployment, 429),
  `CompteService.charger()` treats the player as signed out; the screen offers "Create an account", and a new account
  **overwrites the token** of the old one, which can then only be recovered with the recovery code;
- the home page shows players a developer message: "L'API ne répond pas : lance-la avec `npm run dev`";
- a 401 in the middle of a session is displayed as an outage, without forgetting the session; several screens stay on
  "Loading…" forever if a request fails (collection, game, my duels); no screen offers "Retry";
- if the catalogue could not be loaded, opening a booster **consumes the booster without showing any card**;
- game and duel identifiers taken from the URL are pasted unencoded into API URLs:
  `/jouer/..%2F..%2Fv1%2Fraretes` makes it call `GET /api/v1/raretes` with the player's token;
- the screen stays blank while the JavaScript loads; the session is not synchronised between tabs.

## Acceptance criteria

- [x] **Given** a kept token and `/moi` failing (other than 401), **then** the screen says "Server unreachable" with
      "Retry" (and retries by itself a few times); account creation is **never** offered as long as a token exists.
- [x] **Given** a 401 on an authenticated route, **then** the session is forgotten and the player is sent to "My
      account" with the message "Session expired", then brought back to their page after signing in again.
- [x] **Given** a 429, **then** the message says to wait (duration taken from `Retry-After`).
- [x] **Given** a read (GET) that fails, **then** it is retried twice with an increasing delay; each screen in error
      shows an understandable message and a "Retry" button; no "Loading…" stays displayed indefinitely.
- [x] **Given** the catalogue not loaded, **then** "Open a booster" is disabled.
- [x] **Given** a hidden tab, or no gesture from the player for 10 minutes, **then** periodic polling ("My duels", duel
      screen) stops, and resumes as soon as the player returns. Without this, a forgotten tab would wake the free
      database every minute, day and night, and exhaust its quota (ADR 0021).
- [x] **Given** a game or duel identifier in the URL, **then** it is checked (UUID form) and encoded; otherwise the
      screen displays "Game not found".
- [x] **Given** the first load, **then** `index.html` displays a loading text, a `<noscript>` message, and declares
      `<meta name="color-scheme" content="light dark">` (no white flash in dark theme); **given** a sign-out in another
      tab, **then** this tab learns of it (`storage` event).
- [x] The developer message on the home page disappears. The supported browsers (Tailwind 4 requirements: Safari 16.4,
      Chrome 111, Firefox 128) are written in the documentation.
- [x] Unit tests of the interceptor and the account service; e2e journey with an API that answers 503 then 200.

## Notes

What was built (`apps/web/src/app/`):

- **Network** (`reseau/reseau.ts`): `intercepteurReseau` retries twice an API read (GET) in temporary outage (network
  cut, timeout, 408, 5xx), after 1 s then 3 s, and gives up on each attempt left 15 s without a response: at worst,
  the screen speaks of an outage after 49 s, never an endless "Loading…". Writes are never replayed (a booster opened
  twice). A 429 is not retried: `Retry-After` (seconds or HTTP date, one minute by default) pauses background polling.
  `expliquer()` translates each error for the player ("Serveur injoignable…", "Trop de demandes en peu de temps :
  patientez 30 s…").
- **Session** (`compte/compte.service.ts`): only a 401 makes the session forgotten. Any other error of
  `GET /api/v1/moi` keeps the token and gives the "session not verified" state: three new automatic checks (after 5,
  15 and 45 s), then at each navigation, when the network returns (`online`) and on "Retry". `creer()` and
  `recuperer()` refuse to replace a kept token, and no screen then offers to create an account
  (`<hip-etat-session>`). `intercepteurJeton` handles the 401 of an authenticated route (except `/sessions`, where it
  means "unknown code" or "session already closed"): session forgotten, redirect to `/compte?retour=…` with "Session
  expired", return to the page after signing in again; a 401 coming from an old session does not erase the new one.
  The `storage` event makes each tab follow a sign-in or sign-out made in another.
- **Presence** (`presence.ts`): the player is there if the tab is visible and they have made a gesture (touch, click,
  mouse, keyboard, scroll) less than 10 minutes ago. `interroger()` carries the polling of "My duels" (60 s), of the
  wait for a challenge (5 s) and of the duel (3 s): nothing in their absence, resumed immediately on their return if
  the period has elapsed, never two passes at once. Re-reading the booster stock on reload also waits for their return.
- **Screens**: `<hip-erreur-chargement>` (what is missing, why, "Retry") on the home page, the catalogue, a card's
  detail, the deck and level choice, the game, the duel, the boosters (stock and catalogue), the collection, "My
  duels" and the new challenge. "Open a booster" stays disabled as long as the catalogue is missing.
- **Identifiers** (`identifiant.ts`): UUID form checked, then `encodeURIComponent`; otherwise "Game not found" or
  "Challenge not found", without any request.
- **`index.html`**: loading text (hidden without JavaScript by Tailwind's `noscript:` variant), `<noscript>`,
  `<meta name="color-scheme" content="light dark">`; no inline style or script, which the CSP of US-050 will forbid.
- Supported browsers written in the README.

No ADR: these choices apply consequences already settled, those of ADR 0021 (polling stopped when the tab is hidden or
the player inactive, new attempt when the server wakes) and of ADR 0017 (401: unknown session), changing nothing in
the architecture; the polling through conditional `GET` of ADR 0020 is kept.

## Log

- 2026-10-22 — created, from the front end review before going live.
- 2026-10-22 — in progress (batch 1 front end session, branch `us-055-front-robuste`): interceptors, "session not
  verified" state, player presence, "Retry" on each screen, identifiers checked, `index.html`; front end unit tests
  (106) green.
- 2026-10-22 — delivered: only a 401 makes the session forgotten, otherwise "session not verified" with "Retry" and new checks; 401: "Session expired" then return to the page; GETs retried twice (1 s, 3 s), 15 s at most per attempt, 429 and Retry-After; "Retry" on each screen in error; booster disabled without catalogue; identifiers checked (UUID) and encoded; polling stopped on hidden tab or after 10 min without a gesture; index.html (loading, noscript, color-scheme); session followed between tabs; browsers in the README. 106 front end unit tests, e2e 93/93
