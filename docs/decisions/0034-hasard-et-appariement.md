# 0034 — Game randomness: ChaCha20 with a server-drawn key; matchmaking under lock

- **Date**: 2026-10-24
- **Status**: Accepted
- **Revises**: [0013](0013-moteur-combat.md) (seeded randomness: the generator changes, replayability stays) and
  clarifies [0020](0020-duels-asynchrones.md) (random opponent)

## Context

The review of 2026-10-22 (US-058) found two flaws in duels, which the product vision promises to be fair:

- **Predictable randomness.** The engine (ADR 0013) uses mulberry32, whose state fits in 32 bits, and the API drew a
  duel's seed on 31 bits. The repository is public (ADR 0022) and so are the lent decks: a player who sees their
  starting hand and first draws can try the 2³¹ seeds in a few minutes, find the right one, then see the opponent's
  hand and every draw to come. An asynchronous duel gives them days. Games against the bot (ADR 0030), which earn
  boosters, have the same weakness.
- **"Random opponent" matchmaking (US-037).** When the queue is empty, two players searching a few milliseconds
  apart do not see the duel the other is opening: each opens their own and waits for the other. A double click
  likewise opens two duels for a single player. `SKIP LOCKED` only prevents two players from joining the same duel.
  Verified on PostgreSQL 18: 10 simultaneous searches in an empty queue leave several players waiting, and 10
  simultaneous searches by the same player open several duels.

Constraints: the domain stays pure, with no dependency on Node (ADR 0004); a game's state stays a JSON that is enough
to replay it (ADR 0013); ongoing duels, created with mulberry32, must finish normally; the "bot versus bot"
simulations play thousands of games.

## Decision

### Randomness

- **ChaCha20** (RFC 8439) becomes the generator of games played online, duels and games against the bot. Its state,
  kept in `EtatPartie.alea`, is a **256-bit key and a block counter**; each draw consumes one block (a 32-bit word,
  like mulberry32: `tirer`, `tirerIndex` and `melanger` do not change in use). Recovering the key from the outputs
  amounts to breaking ChaCha20: a player can neither guess it nor predict what follows.
- **The key is drawn by `node:crypto`** (`randomBytes(32)`) when the duel or game starts, on the server side. It
  lives in the database, in the state, and **is never sent**: a player's view (`vueDe`) does not contain the
  generator.
- **Implementation in the domain**, in pure TypeScript (about sixty lines), checked against the RFC 8439 test vector
  and OpenSSL's key stream.
- **Replayable as before**: the same key and the same actions give the same game again (ADR 0013 unchanged on this
  point). `creerPartie` accepts an integer seed (mulberry32) or an 8-word key (ChaCha20).
- **mulberry32 stays** for integer seeds: simulations and tests (fast and readable), and duels or games created
  before this change, which finish with their generator. No data is migrated.

### Matchmaking

- **Opponent searches go through one at a time**: the `POST /duels/hasard` transaction first takes a **transaction
  advisory lock** (`pg_advisory_xact_lock`, key `hipmaster:appariement`), released at its end, even on failure. The
  next search then sees the duel opened by the previous one: two simultaneous players end up in the same duel, a
  double click returns the same open duel. Self-matching stays excluded (a player never joins their own duel).
- The `FOR UPDATE SKIP LOCKED` on the candidates is kept: an open challenge joined at the same instant through its
  link (`POST /duels/{id}/rejoindre`, which does not take this lock) is left aside.

### Reward against an opponent already faced

- The rule of US-038 (no booster for a win by abandonment or forfeit against an opponent already faced the same day)
  is evaluated **on the day the duel ends**: the other duels between the two players created that day (UTC), before
  this end, count. Reading the result the next day no longer bypasses it, and the result no longer depends on the
  date of reading.

## Alternatives considered

- **A fast 128-bit generator** (xoshiro128\*\*, sfc32): exhaustive search becomes impossible, but these generators
  are not designed against an adversary; their state can be reconstructed algebraically from enough outputs, and a
  duel shows many. Rejected in favour of a generator for which this is the guaranteed property.
- **Drawing randomness on demand from `node:crypto`**, stateless: unpredictable, but the game would no longer be
  replayable, and the domain would depend on Node (ADR 0004, 0013). Rejected.
- **HMAC-SHA-256 or AES-CTR as the generator**: just as safe, but SHA-256 or AES would have to be rewritten in the
  domain (the domain has no `node:crypto`), longer and slower; ChaCha20 is made of additions, rotations and
  exclusive ORs on 32 bits, which are simple in JavaScript.
- **Keeping a 16-word block in reserve** in the state: 16 times less computation, but a bigger state and one more
  case. A block costs a few microseconds and a game draws about forty: rejected until measurement justifies it.
- **Migrating ongoing duels to ChaCha20**: a key would have to be invented and the game would change midway. They
  finish with mulberry32; duels expire after 72 hours without a move (ADR 0020).
- **A unique index "only one open duel per player"**: it prevents the double click, not the two players waiting for
  each other; and expired open duels (read as expired, never deleted before US-054) would block it. Rejected in
  favour of the lock, which settles both cases.
- **`SERIALIZABLE` on the matchmaking transaction**: also correct, but conflicts turn into errors to replay, which
  PGlite (a single connection) does not reproduce in tests. The lock makes callers wait instead of failing.

## Consequences

- A player can no longer compute the opponent's hand or the draws to come, even with the source code; a dispute
  remains replayable on the server side from the state in the database.
- A game's state grows by about a hundred bytes (the key); each draw computes one ChaCha20 block. Measured on
  2026-10-24 over 200 "bot versus bot" games: about forty draws per game, and no measurable difference in duration
  from mulberry32 (about 15 ms per whole game in both cases).
- Opponent searches are serialised for the whole API: they last only a few requests and remain rare (60 per hour
  per address, ADR 0025). The lock also holds across several instances, since it is taken in the database; it
  assumes a direct connection, already required by ADR 0023 (no PgBouncer in transaction mode).
- Simulations and tests that pass an integer seed keep mulberry32 and their results.
- The rule about an opponent already faced no longer depends on the reading clock.
