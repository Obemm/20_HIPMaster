# 0019 — Boosters: server-side draw, refill computed on read

- **Date**: 2026-10-18
- **Status**: Accepted (completed by 0045)

## Context

US-023 gives boosters to connected players: 5 when the account is created, then a free booster every 10 minutes, up
to a stock of 10. Each booster contains 5 cards that join the collection. The server is authoritative (no draw in the
front end, ADR 0004), and a player must not be able to open the same booster twice by sending two simultaneous
requests. The API has neither a scheduled job nor a message queue.

## Decision

- **The draw is a pure domain function** (`ouvrirBooster`, `packages/domain/src/booster.ts`): a rarity according to
  `CHANCES_BOOSTER`, then a random card within that rarity. Randomness is injected; the API supplies cryptographic
  randomness (`node:crypto`), so that draws cannot be predicted.
- **The refill is not a background job**: the database keeps a stock and the instant from which the next refill runs
  (`joueurs.boosters`, `joueurs.recharge_depuis`). The actual stock is recomputed on every read (`stockA`, a pure
  function); when the stock is full, the refill clock is reset to the present instant, so that opening a booster from
  a full stock restarts a whole 10-minute delay.
- **Opening is a transaction** that locks the player's row (`SELECT … FOR UPDATE`), decrements the stock, draws the
  cards and adds them to the collection (`collection`: player, card number, copies).
- The rules (`REGLES_BOOSTERS`: welcome, interval, cap) are domain constants; the API accepts injected rules, clock
  and randomness, for the tests.
- The collection references cards by their number; the provisional `cartes` table is removed (ADR 0011).

## Alternatives considered

- **Scheduled job that credits the stocks**: one write per player every 10 minutes, even for absent players, and a
  scheduler to host; computing on read gives the same result without running anything.
- **Draw in the front end**: contrary to ADR 0004, and trivial cheating.
- **Optimistic concurrency control** (update conditioned on the old stock, with retry): also correct, but more code
  than a row lock, with no gain at this scale.
- **Settings in a feature-flag tool**: useful for a temporary campaign, superfluous as long as the values change at the
  pace of releases.

## Consequences

- No extra infrastructure; the displayed stock is always accurate, give or take a deployment.
- Changing the refill values takes a PR, like any game rule.
- The refill depends on the server's clock and on the database's (account creation instant): they must stay
  synchronised, which goes without saying on managed hosting.
