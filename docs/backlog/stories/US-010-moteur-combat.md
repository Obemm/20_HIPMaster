# US-010 — Combat engine: base rules

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-010-moteur-combat`

## Story

As the **project owner**, I want **an engine that applies the combat rules in a safe and replayable way**
so that **the bot, the API and the game screen all rely on the same truth**.

## Acceptance criteria

### Model and principles (`packages/domain`)

- [x] The state of a game is typed: for each player, the System's SLA (20), the draw pile, the hand, the board
      (5 slots), the discard pile and the Throughput; the turn number, the active player, the winner if any and an
      event log.
- [x] The engine is made of **pure functions**: `creerPartie(decks, graine)` and `appliquer(etat, action)`, which
      returns a new state or a typed error for an illegal action, without ever modifying the state received. Chance
      comes from a seeded generator: **the same seed and the same actions give the same game again**.
- [x] `actionsPossibles(etat)` lists all the legal actions of the active player (for the bot and the screen).
- [x] `vueDe(etat, joueur)` returns what a player is allowed to see: the opponent's hand and draw pile are hidden
      (only their number of cards remains visible).

### Base rules ([regles.md](../../produit/regles.md))

- [x] Setup: shuffled decks, 4 cards in hand, first player drawn at random; they do not draw on their first turn.
- [x] Start of turn: draw (hand of 8 cards at most, the extra card goes to the discard pile; empty draw pile: no
      draw), Throughput equal to the player's turn number (10 at most).
- [x] Actions: deploy a component (cost paid, 5 slots at most), deploy an evolution in place of its source card,
      decommission a card once per turn, attack, end one's turn.
- [x] Attack: a component can only attack once per turn and not on the turn it is deployed (except an evolution, if
      its source card could); against a component, retaliation and destruction at 0 HP; against the System, loss of
      SLA without retaliation; as long as an opposing component has **Guard**, it must be attacked first.
- [x] End of game: SLA at 0 (victory), or after 20 turns, the most SLA wins (tie: drawn game).

### Supported abilities

- [x] Guard, Batch, Hub, Single point of failure, Quotas, Connector (N), Broadcast, Reactive, Non-compliant,
      On-premises, Durable queue and Monitoring are applied. The list of cards that the engine can play entirely
      (with no effect of their own or unknown ability yet) is exposed: `CARTES_PRISES_EN_CHARGE`.

### Quality

- [x] Each rule and each ability has its test; a complete game is replayed identically from its seed and its list of
      actions; `npm run check` passes.
- [x] The rule clarifications settled while coding (empty draw pile, full hand…) are carried over into
      [regles.md](../../produit/regles.md).

## Notes

- **Architecture**: [ADR 0013](../../decisions/0013-moteur-combat.md) (serialisable state, pure reducer, event log,
  seeded mulberry32 generator), in line with ADR 0004.
- **Veteran** is supported by default: no AI card can target yet, so its immunity is therefore respected. The engine
  can play **28 cards** of set 1 (`CARTES_PRISES_EN_CHARGE`), including FTP.
- Out of scope: own effects of spells, incidents and cards with an effect (US-014), AI abilities (Autonomous,
  Orchestration, Tooling, Delegation, Context, Guardrails, Asynchronous, Semantic cache, Multi-model routing) and
  Migration.

## Log

- 2026-10-18 — created (split of EPIC-04).
- 2026-10-18 — ADR 0013; engine in `packages/domain/src/combat/`: `creerPartie`, `appliquer`, `actionsPossibles`,
  `vueDe`, 13 abilities, evolutions; 33 tests (one rule or ability per test, 25 random games that all finish, identical
  replay from the seed), engine coverage 97%; rule clarifications carried over into regles.md. In review.
- 2026-10-18 — delivered: pure and replayable combat engine (ADR 0013): base rules, 13 abilities, 28 playable cards
