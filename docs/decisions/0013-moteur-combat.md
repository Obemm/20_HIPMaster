# 0013 — Combat engine: serialisable state, actions and seeded randomness

- **Date**: 2026-10-18
- **Status**: Accepted

## Context

US-010 creates the engine that applies the combat rules ([regles.md](../produit/regles.md), ADR 0010). The same
engine will serve the bot (US-011), the authoritative API (US-012), the game screen (US-013, through the API) and the
"bot versus bot" simulations. ADR 0004 requires pure logic, with injected randomness and no dependency.

## Decision

- **Serialisable state**: a game is a plain JSON object (`EtatPartie`): players, cards by instance identifier and
  card number, turn, active player, outcome, log, and **the state of the random number generator**. It can be stored,
  transmitted and compared as is.
- **Pure reducer**: `appliquer(etat, action)` returns `{ ok: true, etat }` or `{ ok: false, erreur }` with a typed
  error code; it works on a copy (`structuredClone`) and never modifies the state it receives.
  `creerPartie(decks, graine)` creates the initial state.
- **Explicit actions**: `poser`, `evoluer`, `decommissionner`, `attaquer`, `finirTour`. The automatic steps (draw,
  Throughput, upkeep, start-of-turn effects) are played by the engine at each change of turn.
- **Seeded randomness**: a deterministic pseudo-random generator (mulberry32) whose state lives in `EtatPartie`.
  **The same seed and the same actions give exactly the same game back**: replayable games, reproducible tests and
  simulations, and server-side replay to investigate a dispute.
- **Event log**: every notable change (draw, deployment, attack, damage, destruction, end of game) is added to the
  log, which feeds the step-by-step display and the announcement to screen readers. An event can be reserved for one
  player (card drawn, Monitoring).
- **Per-player view**: `vueDe(etat, joueur)` gives only what that player is allowed to see (opposing hand and deck
  hidden, private events filtered). The API will never return the full state.
- **Possible actions**: `actionsPossibles(etat)` lists all the legal actions of the active player. The bot chooses
  from this list, and the screen offers only that.

## Alternatives considered

- **Mutable objects with methods** (`Partie`, `Joueur` classes): more natural to write, but hard to serialise, compare
  and replay, and easy to modify by mistake from outside.
- **Immutability library** (Immer): comfortable, but adds a dependency to the domain for a modest gain;
  `structuredClone` is enough for states of a few kilobytes.
- **Injected `Math.random`** (like `tirerRarete`): sufficient for an isolated draw, but does not allow replaying a
  whole game nor saving the random state with the game.

## Consequences

- One full copy per action: negligible for games of 40 cards and a few dozen actions, to be measured in the
  simulations (US-011).
- Any new ability is added as an engine function, tested on its own, without touching the other layers.
- Randomness must **never** come from anywhere other than the state's generator, otherwise replayability is lost.
