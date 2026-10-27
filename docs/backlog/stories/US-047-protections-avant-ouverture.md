# US-047 — The essential protections before opening

- **Epic**: EPIC-09
- **Status**: Done, except the real trial of `trustProxy`, to be done after the first deployment (US-050)
- **Priority**: Must
- **Size**: M
- **Branch**: `us-047-protections-avant-ouverture`

## Story

As the **project owner**, I want **the API to withstand simple abuse and protect accounts** so that **a script or a
leaked code does not spoil the game for everyone**.

## Context

Review of 2026-10-22 ([review](../../revues/2026-10-22-revue-mise-en-ligne.md)):

- no rate limiting, whereas ADR 0017 required it "before any public opening". Example: 1,000 anonymous game creations
  (1.5 ms of computation each) evict all the games in progress from the in-memory store (ceiling of ADR 0014), and
  players get a 404 in the middle of a game;
- `trustProxy` is not set: behind the Google front end, all requests seem to come from the same address;
- regenerating one's recovery code does not close the other sessions: a session opened with a code that has leaked
  stays valid for life;
- a game against the bot started by a signed-in player can be read and played by anyone who knows its identifier;
- the fingerprint of recovery codes is a SHA-256 without a secret: if the database leaked, all the accounts would be
  attacked at once. No account existing yet in production, now is the time to change;
- request bodies limited to 1 MB, when 16 KB is enough.

## Acceptance criteria

- [x] **Given** account creation, sign-in by code, game creation and the duel routes, **when** one address exceeds its
      limit, **then** the API answers **429** in Problem Details format with the `Retry-After` header; the limits are
      configurable and documented in the OpenAPI contracts.
- [ ] **Given** the API behind Firebase Hosting and Cloud Run, **then** `trustProxy` counts the right number of
      relays, verified by a real trial (the logged address is the player's and cannot be forged by an added
      `X-Forwarded-For`).
      _Done: configurable number of relays (`PROXYS_DE_CONFIANCE`, mandatory in production, 2 expected), tested with
      simulated headers. The real trial remains, after the first deployment of US-050: procedure below._
- [x] **Given** a player who regenerates their recovery code, **then** all their other sessions are closed; the "My
      account" page says so, and also offers "Sign out all my devices" (now "Sign out my other devices", see the
      notes).
- [x] **Given** a game against the bot started by a signed-in player, **when** another session (or none) reads it or
      plays in it, **then** the API answers 404.
- [x] **Given** the recovery codes, **then** their fingerprint is an HMAC-SHA-256 with a secret supplied by Secret
      Manager in production (ADR 0017 completed by an ADR). Session tokens, random over 256 bits, keep their SHA-256.
- [x] **Given** a response that contains a token, a code or personal data, **then** it carries
      `Cache-Control: no-store`; all responses carry `X-Content-Type-Options: nosniff`.
- [x] The size of request bodies is limited to 16 KB. API tests for each point.

## Notes

- The `@fastify/rate-limit` store is specific to each instance: enough as long as Cloud Run runs with few instances. A
  global limit would require Redis or Cloud Armor (outside the budget, ADR 0021).
- The front end must understand the 429 (US-055).
- Decisions: [ADR 0025](../../decisions/0025-protections-api.md). Values of the limits in the OpenAPI contracts and
  `apps/api/src/limites.ts`; `LIMITES_DEBIT` multiplies them (or `desactivees`), without changing the code.
- "Sign out all my devices" became **"Sign out my other devices"**: the device that asks stays signed in ("Sign out"
  is right next to it). Closing everything in one gesture would make a player who no longer has their code lose their
  account (ADR 0017).
- In addition to the creation limit, the in-memory store evicts anonymous games first: a flood of games without an
  account no longer makes a signed-in player lose theirs (ADR 0025).
- Deployment (US-050) supplies `CLE_CODES_RECUPERATION` (secret `cle-codes-recuperation`, created by
  `scripts/gcp/infrastructure.sh`) and `PROXYS_DE_CONFIANCE=2`: without them, the API refuses to start.

## Checking the player's address in production

To be done once US-047 and US-050 are live (the name of the Cloud Run service is set by US-050). The commands always
target the dedicated `gcloud` configuration.

1. Note your public address: `curl -s https://api.ipify.org`.
2. Two requests through Firebase Hosting, the second with an invented link in the chain:

   ```bash
   curl -sS https://hipmaster.web.app/api/v1/sante
   curl -sS -H 'X-Forwarded-For: 203.0.113.99' https://hipmaster.web.app/api/v1/sante
   ```

3. Read the address the API retained for these two requests:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.message="incoming request" AND jsonPayload.req.url="/api/v1/sante"' --freshness=10m --limit=4 --format='value(timestamp, jsonPayload.req.remoteAddress)' --configuration=hipmaster
   ```

   Both lines must show the address from step 1. A Google address (`35.…`, `130.211.…`, `2600:1900:…`): there is one
   more relay, set `PROXYS_DE_CONFIANCE` to 3. The address `203.0.113.99`: one relay fewer, set it to 1. Redeploy,
   then start again.

4. The `run.app` address of the service, called directly, lets the address be invented (ADR 0025): check it with the
   same request and an invented `X-Forwarded-For`. Closing it
   (`gcloud run services update hipmaster-api --no-default-url --region=europe-west3 --configuration=hipmaster`)
   would also remove the address of the trial revision, through which the deployment probe goes (US-050): only do so
   with another probe, then check that `https://hipmaster.web.app/api/v1/sante` still answers, and if not, roll back
   (`--default-url`) and note here that the limit remains.
5. Tick the criterion and note the result in the log below.

## Log

- 2026-10-22 — created, from the review before going live.
- 2026-10-23 — refined and started: ADR [0025](../../decisions/0025-protections-api.md), OpenAPI contracts first.
- 2026-10-23 — delivered: rate limiting per address (429 with Retry-After, configurable through LIMITES_DEBIT), player's address behind the relays (PROXYS_DE_CONFIANCE), recovery codes under HMAC (cle-codes-recuperation key in Secret Manager, created by the infrastructure script), a new code and "Sign out my other devices" close the other sessions, games against the bot tied to their session, no-store and nosniff, 16 KB bodies; the real trial of trustProxy remains after the first deployment (US-050)
