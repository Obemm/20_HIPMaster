# US-058 — Fair duels: unpredictable randomness and safe matchmaking

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-058-duels-equitables`

## Story

As a **duel player**, I want **to be sure my opponent can neither predict my cards nor get around the rules** so that
**the game stays fair, as the product vision promises**.

## Context

API review of 2026-10-22:

- **predictable randomness**: the engine uses mulberry32, a generator whose state fits in 32 bits, and a duel's seed
  is drawn on 31 bits (`apps/api/src/duels/duels.ts`). Lent decks are public. A player who knows the algorithm (the
  repository is public) can recover the seed from their hand and their first draws, by trying the 2³¹ seeds, then see
  the opposing hand and every draw to come. An asynchronous duel gives them days to do it;
- **matchmaking**: when the "random opponent" queue is empty, two players searching a few milliseconds apart each
  create an open duel and wait for each other; a double click can put a player in two duels;
- the rule "no booster against an opponent already faced the same day" is only evaluated when the winner first reads
  the result: reading it the next day gets around it (the daily cap of 3 boosters holds).

## Acceptance criteria

- [x] **Given** a new duel, **then** its randomness comes from a generator whose state cannot be recovered from what a
      player sees (state of at least 128 bits, seed drawn by `node:crypto`); games remain replayable from their state
      (ADR 0013, revised by a new ADR).
- [x] **Given** two simultaneous opponent searches, **then** they result in a single duel between the two players; a
      player cannot have two open duels waiting.
- [x] **Given** a finished duel, **then** the already-faced-opponent rule is evaluated on the date the duel ended,
      whatever the date it is read.
- [x] Ongoing duels created with the old generator finish normally. Tests on PostgreSQL (US-056).

## Design

- **Randomness** (ADR [0034](../../decisions/0034-hasard-et-appariement.md), which revises ADR 0013): the engine gains
  a **ChaCha20** generator (RFC 8439) written in pure TypeScript in `packages/domain/src/combat/alea.ts`. Its state
  (a 256-bit key and a block counter) lives in `EtatPartie.alea`: the game stays replayable. The API draws the key
  with `randomBytes(32)` (`apps/api/src/hasard.ts`) when launching a duel **and** a game against the bot (which also
  earns boosters). A player's view never contains the generator.
- **Compatibility**: `creerPartie` still accepts an integer seed (mulberry32): simulations, tests, and duels or games
  created before this change, which finish with their generator. No data migration.
- **Matchmaking**: `chercherAdversaire` first takes a transaction-level advisory lock
  (`pg_advisory_xact_lock(hashtext('hipmaster:appariement'))`): searches go through one at a time, and the next one
  sees the duel opened by the previous one. `SKIP LOCKED` stays for an open challenge joined at the same instant
  through its link.
- **Already-faced opponent**: `recompenseDuel` counts the other duels between the two players created on the day (UTC)
  the duel ended (`majLe`), before that end; the reading clock no longer plays a part.
- **Contract**: no route or schema changes; `duels.yaml` describes the serialised matchmaking and the day used for the
  reward.

## Log

- 2026-10-22 — created, from the API review before going live.
- 2026-10-24 — refined and started: ChaCha20 with a key drawn by `node:crypto`, advisory lock for matchmaking,
  already-faced-opponent rule on the day the duel ended (ADR 0034). Without the lock, the two new simultaneous
  matchmaking tests fail on PostgreSQL 18 (several players waiting, several open duels for the same player); with it,
  they pass.
- 2026-10-24 — delivered: randomness of duels and games against the bot by ChaCha20 (RFC 8439, pure domain), 256-bit key drawn by node:crypto, never sent; duels and games created before keep mulberry32 and finish normally; opponent searches serialised by a transaction-level advisory lock (empty queue and double click proven on PostgreSQL 18); already-faced-opponent rule evaluated on the day the duel ended; ADR 0034
