# 0039 — Light requests: measured indexes, catalogue in public cache, compressed responses

- **Date**: 2026-10-24
- **Status**: Accepted
- **Completes**: [0023](0023-postgresql-production.md) (short connections), [0038](0038-pwa-service-worker-angular.md)
  (the API never in the service worker's cache)

## Context

The game runs on free quotas (ADR 0021): Cloud Run bills request time, Neon the compute hours of a database that only
goes to sleep after 5 minutes without a connection. The review of 2026-10-22 and the measurements of US-057 (on
PostgreSQL 18, with a regular player and their 400 duels among 6,000, and on the live site) found:

- **no secondary index**: each query on a player's duels, rewards or sessions scans its table; at this volume it
  stays under a millisecond, but grows with the history, kept with no limit;
- **"My duels"**, called by every signed-in client every 60 s, read all the player's duels and decompressed the state
  of each (10 KB) to extract four fields: 40 ms and 4,821 blocks, before keeping only 20 finished ones;
- **the duel screen** polls every 3 to 5 s; a 304 was only decided after reading the state, the nicknames and the
  reward;
- **the catalogue** (cards, decks, levels, rarities) is re-read at every screen, 9 times in the front end; its
  21.5 KB go out **uncompressed**: neither Cloud Run nor Firebase Hosting compresses the API's responses (measured on
  `hipmaster.web.app`), and everything is `no-store` (US-047).

## Decision

- **Indexes where a query uses them**, and only there (measured by `apps/api/src/mesurer-requetes.ts`): duels by
  creator and by opponent with their update date, pending challenges (partial index, queue of open duels and purge),
  a player's rewards by date, a player's sessions and games (cascade deletions). A migration that only adds indexes
  stays compatible with the live version (ADR 0028).
- **Lists are bounded in the database**: "My duels" first chooses its duels without their state (those not finished,
  200 at most, then the last 20 finished) and only decompresses the state of those.
- **An unchanged duel answers 304 after reading only its version** (and the fields that decide its visibility, a
  challenge's expiry and forfeit); as soon as a rule needs the state, the full read takes over.
- **The catalogue goes out in a 5-minute public cache** (`Cache-Control: public, max-age=300`) with a **common
  `ETag`** for all its routes, a fingerprint of everything they serve, computed at startup; a known `If-None-Match`
  answers 304 as soon as the request is received. Firebase Hosting's relay keeps it too: most reads no longer reach
  Cloud Run. An error (unknown card) and **any player data stay `no-store`**.
- **Responses over 1 KB are compressed** (`@fastify/compress`), Brotli at quality 5 or gzip depending on
  `Accept-Encoding`: 21.5 KB → 5 KB for the catalogue, in 0.7 ms.
- **The front end keeps the catalogue in memory for the session** (HTTP interceptor): one read per session and per
  route, even when requested by several screens at once; a failed read is forgotten, to be retried. The service
  worker still caches **no API response** (ADR 0038 unchanged).

## Alternatives considered

- **Long catalogue cache (one year, `immutable`) with the version in the URL**: ideal for fingerprinted files, but
  the API routes are stable and the front end does not know the catalogue version before reading it; 5 minutes and an
  `ETag` are enough to avoid almost all reads, and a new version arrives within 5 minutes at most.
- **Copying the active player, the turn and the outcome of duels into columns**, so "My duels" never reads the state
  again: faster still, but every write would have to keep them up to date, and the version still live during a
  deployment would not do it (ADR 0028). Bounding the read is enough: 2.6 ms instead of 40.
- **Brotli at quality 11** (Node's default): 10% smaller, but 21 ms of computation per response; **compressing
  nothing** and counting on the relay: Firebase Hosting does not compress Cloud Run's responses.
- **Putting the catalogue in the service worker's cache**: rejected by ADR 0038 (stale state), and useless with the
  HTTP cache and the front end's memory.
- **Paginating "My duels"**: the front end only shows the last 20 finished duels; pagination will come with a full
  history, if requested.

## Consequences

- At equal volume, "My duels" goes from 40 ms and 4,821 blocks to 2.6 ms and 531 blocks; searches for duels,
  rewards and sessions go from a table scan to an index (from 110 to 187 blocks down to under 25). The detail is in
  US-057; the measurement can be replayed with `npm run mesurer -w @hipmaster/api`, to keep up to date with the SQL.
- Polling an unchanged duel makes two database queries (session, version) instead of three to five.
- After a deployment that changes the catalogue, a browser or the relay may serve the old one for 5 minutes; a tab
  left open keeps it until the next reload, which the service worker offers at each new version.
- Responses are compressed above 1 KB: those carrying a token or a code (account creation, sign-in) stay below it,
  which rules out size-measurement attacks (BREACH).
- A signed-in client that keeps a screen visible still polls the API every 60 s, and every request from a player
  reads their session in the database: as long as a screen is open, Neon does not go to sleep. Stopping polling on a
  hidden tab (US-055) limits the effect; lengthening the interval is a product decision, not taken here.
