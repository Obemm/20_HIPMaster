# 0025 — API protections before opening: rate limiting, revocable sessions, HMAC-protected codes

- **Date**: 2026-10-23
- **Status**: Accepted
- **Completes**: [0017](0017-compte-invite.md) (guest account), which deferred rate limiting "before any public
  opening"; clarifies [0014](0014-parties-en-memoire.md) (owner and eviction of in-memory games)

## Context

HIPMaster is about to be reachable on the Internet, for colleagues by invitation (ADR 0021). The review of 2026-10-22
noted, before opening (US-047):

- **no rate limiting**: 1,000 anonymous game creations evict all the games in progress from the in-memory store
  (ADR 0014), and the creation of accounts or duels is unlimited;
- **`trustProxy` is not set**: behind Firebase Hosting and Cloud Run, all requests appear to come from the same relay,
  so a per-address limit would apply to all players at once;
- **sessions cannot be revoked**: regenerating one's recovery code leaves open the sessions obtained with the old one,
  which may have leaked;
- **a game against the bot started by a signed-in player** can be read and played by anyone who knows its identifier;
- **the fingerprint of recovery codes is an unkeyed SHA-256**: 60 bits can be enumerated offline if the database leaks,
  and all accounts would fall at once. No account exists yet in production: this is the time to change;
- request bodies are accepted up to 1 MB, and no response tells the browser not to cache a token or a code.

Constraints: a single Cloud Run instance (ADR 0021); zero budget, so neither Cloud Armor nor Redis; players often
behind the same exit address, that of their office; a Neon database that must be able to sleep.

## Decision

### Rate limiting, per address

- **`@fastify/rate-limit`**, in-memory store of the instance: a fixed window per route and per IP address (an IPv6
  address counts for its /64 prefix). Beyond it: **429** in Problem Details format, with `Retry-After` (in seconds) and
  the `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset` headers.
- Production values, designed for a few dozen players many of whom share an office address, and documented in the
  OpenAPI contracts:

  | Routes                                                                     | Limit per address | What it protects                                   |
  | -------------------------------------------------------------------------- | ----------------- | -------------------------------------------------- |
  | `POST /joueurs`                                                            | 30 per hour       | mass account creation                              |
  | `POST /sessions`                                                           | 10 per minute     | recovery code guessing                             |
  | `POST /parties`                                                            | 20 per minute     | the in-memory store (1,000 games, 30 min lifetime) |
  | `POST /parties/{id}/actions`                                               | 300 per minute    | the CPU: each end of turn makes the bot play       |
  | `POST /duels`, `POST /duels/hasard`                                        | 60 per hour       | the database: each challenge is a row              |
  | `POST /duels/{id}/actions`, `/rejoindre`, `/abandon`, `DELETE /duels/{id}` | 300 per minute    | the CPU and the database                           |
  | `GET /duels/{id}`, `GET /moi/duels`                                        | 600 per minute    | polled every 3 s and 60 s (ADR 0020)               |

  With 20 games per minute, a single address never fills the store: its games expire before the thousandth.

- **Adjustable without changing the code**: `LIMITES_DEBIT` multiplies all limits (`2` doubles them) or disables them
  (`desactivees`). By default: factor 1 in production, disabled elsewhere: development and the e2e journeys create
  dozens of accounts from the same address. The API tests check them with reduced values.
- **The game store evicts anonymous games first**: at the cap, it removes the account-less game played least recently,
  and only failing that the game of a signed-in player. A flood of anonymous games, from wherever it comes, no longer
  makes a signed-in player lose their game.

### The player's address behind the relays

- **`PROXYS_DE_CONFIANCE`**: the number of relays that precede the API and each append the address of their peer to
  `X-Forwarded-For`. The API keeps the address located just before them (Fastify's `trustProxy` option): what a client
  adds to the header itself stays further left and is never read.
- **Expected value in production: 2**, Firebase Hosting then Cloud Run's front end. It is **mandatory in production**:
  if forgotten, all players would have the address of Google's front end, hence a single limit for everyone. Elsewhere,
  it is 0 (the connection's address).
- It will be checked by a real test after the first deployment (US-050), following the procedure of story US-047: the
  logged address must be the player's, even with a made-up `X-Forwarded-For`.

### Sessions and games

- **Regenerating one's recovery code closes all the other sessions** of the account, in the same transaction: a session
  opened with a code that leaked does not survive its replacement.
- **"Sign out my other devices"** (`DELETE /sessions/autres`) closes all the account's sessions except that of the
  device making the request; that one closes with "Sign out". Closing everything in one gesture would make a player
  who no longer has their code lose their account (ADR 0017).
- **A game against the bot started by a signed-in player belongs to the session that created it**: the store keeps
  the fingerprint of its token in memory, and answers 404 to another session as to a request without a token, without
  saying the game exists. No extra database read per action. An anonymous game stays with whoever knows its identifier
  (ADR 0014).

### Code fingerprints

- **Recovery codes: HMAC-SHA-256** with a secret 256-bit key, prefixed with the code's purpose (`recuperation:`): the
  same key can serve other codes without possible confusion. Without the key, a copy of the database no longer allows
  trying codes offline.
- **The key comes from `CLE_CODES_RECUPERATION`**, supplied in production by the `cle-codes-recuperation` secret in
  Secret Manager. The infrastructure script generates it randomly and stores it without ever displaying it, and only
  the API's account can read it (ADR 0024). In production, the API **refuses to start** without it (at least
  32 characters); in development and tests, a fixed, public key is used by default.
- **Session tokens: SHA-256, unchanged.** 256 random bits cannot be guessed, even offline: an HMAC would add nothing,
  whereas this fingerprint is computed on every request.

### Responses

- **`Cache-Control: no-store`** on all API responses, except those of a route that declares its own cache policy (the
  public catalogue may be cached: US-057). Tokens, codes and player data thus stay in no cache.
  **`X-Content-Type-Options: nosniff`** on all responses.
- **Request body: 16 KB at most** (413 beyond). The largest legitimate body, a game action, weighs less than 1 KB.

## Alternatives considered

- **Cloud Armor** (firewall and limits in front of the API): requires a load balancer, ≈ $18 per month (ADR 0021).
  Rejected.
- **Shared counter store** (Redis, database table): pointless with a single instance; a table would wake the Neon
  database on every request and prevent it from sleeping. Rejected.
- **Limit per account rather than per address**: registration, sign-in and anonymous games have no account, and each
  made-up token would have its own counter. Rejected.
- **A single limit for the whole API**: a single abuser would block everyone. Rejected.
- **Slow hashing of codes** (scrypt, Argon2): costly at every sign-in, and an open door to CPU exhaustion; with
  60 bits of entropy, the HMAC is enough to make offline guessing impossible without the key. Rejected.
- **Key derived from `DATABASE_URL` or the database password**: a leak of the database and a leak of its address often
  go together. Rejected.
- **"Sign out all my devices", this one included**: a player without a code would lose their account. Rejected in
  favour of "my other devices", followed if needed by "Sign out".
- **Checking the session in the database on every move of a game against the bot**: one more query per action, for no
  gain: a signed-out browser forgets its token. Rejected.
- **Reading the address from the whole of `X-Forwarded-For`** (the first link) or from a CDN-specific header: the
  client writes them itself. Rejected.

## Consequences

- A player in too much of a hurry receives a 429 and the waiting time, which the front end explains (US-055). If
  colleagues in the same office get in each other's way, `LIMITES_DEBIT` can be raised without changing the code.
- Counters restart from zero each time the instance starts (deployment, scale-down to zero): irrelevant for windows of
  one minute or one hour.
- An abuser with many addresses (an entire IPv6 block, for example) slips through the mesh: invitations (US-048), then
  games kept in the database (US-052), remain the real protections.
- `PROXYS_DE_CONFIANCE` depends on the hosting: to be re-checked if the relay chain changes. As long as the service's
  `run.app` address stays directly reachable, an `X-Forwarded-For` made up through that path skews the address kept:
  the verification procedure tries to disable that address.
- Changing the code key invalidates all recovery codes, but no session: to be done only in case of a leak, by inviting
  players to regenerate their code from a signed-in device. Existing development databases are in this situation:
  their codes from before this change no longer work.
- The deployment (US-050) provides `CLE_CODES_RECUPERATION` (secret `cle-codes-recuperation`) and
  `PROXYS_DE_CONFIANCE=2`; without them, the new revision does not start and the old one keeps serving.
