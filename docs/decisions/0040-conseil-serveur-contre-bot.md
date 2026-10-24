# 0040 — Advice computed by the server, against the bot only

- **Date**: 2026-10-24
- **Status**: Accepted

## Context

US-066 gives the player discovering the game advice on demand: the best move of the moment, and why, in one
sentence. The bots already know how to choose an action from a single player's view (ADR 0004, 0013). We must decide
where this advice is computed, with what logic, and where it is allowed. The project owner decided on 2026-10-23: a
duel stays a face-to-face, with no advice.

## Decision

- The advice is computed by **the domain** (`conseiller`, `packages/domain/src/combat/conseil.ts`), from the
  player's view alone: it sees neither the opponent's hand nor their deck, and the advised action is always one of
  the legal actions of the view.
- It follows **the rules of Nightly Batch** (`bot.ts`), each choice of which can be explained in one sentence (play
  the strongest card, destroy while surviving the retaliation, Guard…), rather than the search of ESB Architect or
  Autonomous Agent, stronger but which cannot be told as a story. A player who always follows it beats Intern 89% of
  the time and Nightly Batch 47% (simulation, `npm run simuler`).
- The server exposes it through **`GET /api/v1/parties/{id}/conseil`** (contract `apps/api/openapi/parties.yaml`):
  same ownership as the game (US-047), rate-limited (300 per minute per address), 409 when it is not the
  player's turn to play. Nothing is written to the database, and the victory reward does not change.
- **No advice route for duels**: `/duels/{id}/conseil` does not exist, and the duel screen does not show the button.
- The front end only shows what the server returns: it highlights the action and reads the explanation, without ever
  playing it for the player. The "Advice on every move" option is a browser preference (ADR 0032).

## Alternatives considered

- **Computation in the front end** with the domain package: possible (the domain is pure), but the front end only
  has the view and must neither draw nor resolve any move; the server is authoritative (ADR 0004). The server also
  keeps control of the "no advice in a duel" rule.
- **Advice included in every game response**: one request fewer when the advice shows on every move, but a heavier
  computation and contract for all players, who almost never ask for it.
- **An adviser based on Autonomous Agent**: stronger, but its choice comes from a numerical evaluation of positions;
  explaining it in one player's sentence would often be wrong or hollow.
- **Advice in duels too**: rejected by the project owner.

## Consequences

- The adviser and Nightly Batch share their rules: a tweak to Nightly Batch also changes the advice, and a test
  checks that they choose the same action on every move.
- With "Advice on every move", each player action causes one more read, hence the dedicated limit.
- The explanation sentences live in the domain, in French, like the reasons for not playing (US-041, US-071).
