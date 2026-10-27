# US-057 — Light requests: indexes, bounded reads, cache and on-demand loading

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-057-requetes-legeres`

## Story

As a **player on a phone**, I want **screens that display quickly, even on an average network**, and as the **project
owner**, I want **each player to cost few requests** so that **we stay within the free quotas, Neon database
included**.

## Context

Review of 2026-10-22:

- **database**: no secondary index (PostgreSQL does not index foreign keys). "My duels", called by every signed-in
  client every 60 s and at each navigation, sweeps the whole `duels` table, brings back all the player's duels since
  forever (the cut to 20 is done in JavaScript) and re-reads the full state of each; the duel screen polls every 3 to 5
  s, and the `If-None-Match` is compared only after loading everything;
- **network**: each page reloads the catalogue (21.5 KB, 5 KB compressed) and the decks; responses are neither
  compressed nor accompanied by `Cache-Control` or `ETag`; polling continues when the tab is hidden;
- **front end**: the 11 pages are in a single 382 KB bundle (98.5 KB transferred), none is loaded on demand;
  illustrations have no fingerprint in their name, which forbids a long cache, and share the `/cartes/` prefix with an
  Angular route.

Refinement of 2026-10-24, on measurements (see "Measurements"): the board, the duel and the "Invite" page were already
loaded on demand (US-061, US-072), and stopping polling on a hidden tab is delivered (US-055). Fingerprinted
illustrations go into a story of their own, [US-078](US-078-illustrations-empreinte-cache.md): their pipeline (US-015)
is under heavy work with US-017, and their file name changes with it. The deck list as a single component is
dropped: the catalogue interceptor already removes repeated reads, and this component would touch the game screen,
under construction (US-066, US-067).

## Acceptance criteria

- [x] **Given** the duel, reward and session queries, **then** indexes serve them (`duels` by creator and by opponent,
      queue of open duels, rewards of the day, sessions and games per player); "My duels" is bounded in SQL and
      decompresses the state only of the duels returned.
- [x] **Given** a poll of a duel that has not changed, **then** the API answers 304 after a light read of the version,
      without loading the state; a passed deadline still makes the forfeit apply.
- [x] **Given** the catalogue, decks, levels and rarities, **then** the API sends them compressed, with
      `Cache-Control: public, max-age=300` and an `ETag` (bodyless 304 to whoever knows it); personal responses and
      errors stay `no-store`.
- [x] **Given** the front end, **then** the catalogue (cards, detail, decks, levels, rarities) is requested only once
      per session, even by several screens at once.
- [x] **Given** the Angular routes, **then** all pages except the home page are loaded on demand (`loadComponent`) and
      the initial bundle budgets are tightened.
- [x] **Given** an API request, **then** its measurement (`EXPLAIN ANALYZE` on PostgreSQL 18) can be replayed with
      `npm run mesurer -w @hipmaster/api`, and each gain is proven by a test or a measurement.

## Design

ADR [0039](../../decisions/0039-requetes-legeres-cache-compression.md).

- **Migration `0013_index_requetes`** (indexes only, compatible with the live version): `duels_createur` and
  `duels_adversaire` (player, `maj_le`), `duels_attente` (partial, `cree_le` of pending challenges),
  `recompenses_joueur` (player, `accordee_le`), `sessions_joueur`, `parties_joueur`, `parties_session`.
- **"My duels"** (`lireMesDuels`): two queries, each choosing its duels through a subquery without the state (not
  finished: 200 at most, safeguard; finished: the last 20), then extracting the JSON fields only for them.
- **Unchanged duel** (`duelInchange`): reads status, version, players and dates; 304 if the version is known, the
  player sees the duel, the challenge has not expired and no forfeit is due. Otherwise, full read.
- **Catalogue** (`cache-catalogue.ts`): a common `ETag`, SHA-256 fingerprint of everything served by `/cartes`,
  `/cartes/{numero}`, `/decks`, `/niveaux` and `/raretes`, computed at startup; 304 as of `onRequest`.
- **Compression**: `@fastify/compress`, beyond 1 KB, Brotli quality 5 or gzip.
- **Front end**: `intercepteurCatalogue` (`reseau/catalogue.ts`) keeps in memory the response of each catalogue read and
  shares it (`shareReplay`); no screen changed. All routes in `loadComponent`, except the home page; initial budget:
  warning at 420 KB, error at 500 KB (instead of 500 KB and 1 MB).
- **Expired session** (US-055): with pages loaded on demand, the startup 401 arrives before the end of the first
  navigation; the return after signing in again therefore targets the page being navigated to
  (`router.currentNavigation()`), no longer only the displayed page (found by the e2e `robustesse.spec.ts`).

## Measurements

Measurement base (`npm run mesurer -w @hipmaster/api`, local PostgreSQL 18): 300 players, 6,000 duels of which 400 for
an assiduous player, 9.9 KB state per duel (a real 40-move game), 20,000 rewards, 1,000 games against the bot. Second
pass (warm cache), execution time and blocks read:

| Query                               | Before                       | After                              |
| ----------------------------------- | ---------------------------- | ---------------------------------- |
| "My duels": the list                | 40.2 ms, 4,821 blocks (seq.) | 2.6 ms, 531 blocks (2 queries)     |
| Overdue duels (forfeit)             | 0.26 ms, 110 blocks (seq.)   | 0.31 ms, 11 blocks (index)         |
| Opponent already faced that day     | 0.67 ms, 110 blocks (seq.)   | 0.13 ms, 7 blocks (index)          |
| Random: already in the queue        | 0.22 ms, 110 blocks (seq.)   | 0.08 ms, 5 blocks (index)          |
| Random: last opponent               | 0.30 ms, 110 blocks (seq.)   | 0.19 ms, 15 blocks (index)         |
| Random: queue of open duels         | 0.28 ms, 130 blocks (seq.)   | 0.06 ms, 22 blocks (partial index) |
| Reward: victories of the day        | 0.56 ms, 187 blocks (seq.)   | 0.08 ms, 4 blocks (index)          |
| Closing one's other sessions        | 0.24 ms, 16 blocks (seq.)    | 0.27 ms, 9 blocks (index)          |
| Purge: expired challenges           | 0.26 ms, 124 blocks (seq.)   | 0.13 ms, 1 block (partial index)   |
| Session, reading a duel, collection | already by primary key       | unchanged                          |

At this volume, the indexes gain little in time (everything fits in memory) but read 5 to 40 times fewer blocks, and
no longer grow with the history. The real database gain is "My duels": 15 times faster, 9 times fewer blocks.

Network and front end:

- **Compressed catalogue**: `/api/v1/cartes` 21,541 → 5,014 bytes in Brotli (gzip: 5,110), 0.7 ms of computation;
  before, the live site sent it raw (measured on `hipmaster.web.app` on 2026-10-24);
- **Cached catalogue**: 5 minutes in the browser and at Firebase Hosting's relay, then bodyless 304; in the front end,
  a single read per session instead of one per screen (9 screens read it);
- **Poll of an unchanged duel**: 2 database queries (session, version) instead of 3 to 5 (session, full duel,
  nicknames, reward), without decompressing the 10 KB of state nor computing the view;
- **Initial bundle**: 457.6 → 380.5 KB (117.8 → 100.7 KB transferred), each page loaded at its first opening (1.7 to
  4.2 KB transferred).

Tests: `cache-catalogue.test.ts` (headers, 304, `no-store` of a player's responses and of errors, compression),
`duels.test.ts` (last 20 finished after the duels in progress; 304 refused to a third party; forfeit applied despite a
known version), `reseau/catalogue.spec.ts` (one read per session, shared, retried after a failure, never for a
player's data). E2e on the production build: 139 journeys green, without CSP violation.

## Decision: monitor before lengthening the interval

A visible screen polls the API every 60 s ("My duels") and each player request reads their session in the database: as
long as a screen is open, Neon does not fall asleep (sleep after 5 minutes without a request).

Decision of the project owner (2026-10-24): **change nothing for now and monitor consumption** with the
`hipmaster-consommation` job (US-051), which alerts by e-mail from 70% of the quota. If the alert fires because of the
polling, the planned response is to lengthen the interval to 10 minutes (`RAFRAICHISSEMENT_MS` of
`mes-duels.service.ts`): beyond 5 minutes, the database falls asleep between two polls; below, lengthening is
pointless. Dropped for now: polling only on the home page and "My duels", or combining the two.

## Log

- 2026-10-22 — created, from the API and front end review before going live.
- 2026-10-24 — refinement on measurements (PostgreSQL 18 and the live site); fingerprinted illustrations postponed to
  US-078.
- 2026-10-24 — delivered: measured indexes, bounded "My duels" (40 → 2.6 ms), light 304 for duels, catalogue compressed
  and in public cache with ETag, kept in memory by the front end, pages on demand (initial bundle 457 → 380 KB)
  (ADR 0039).
- 2026-10-24 — decision: monitor Neon's consumption before lengthening the polling interval.
