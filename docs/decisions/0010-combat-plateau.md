# 0010 — Board combat (Throughput, SLA, abilities)

- **Date**: 2026-10-16
- **Status**: Accepted

## Context

The vision left the choice of combat mechanic open: a quiz on the content of the cards (WikiMasters) or a board with
resource / attack / HP (Async TCG). The chosen universe is a hybrid integration platform, from FTP to AI agents
([univers.md](../produit/univers.md)): the technologies have behaviours (slowness of batch, the single point of the
ESB, the gateway's protection, event broadcasting, the autonomy of agents) that we want players to **feel**.

## Decision

Combat is played **on a board**, modelled on the Async TCG, with an integration vocabulary:

- resource: **Throughput** (+1 per turn, 10 at most);
- target: the opposing **System** with **20 SLA points**;
- three card types: **Component** (attack, HP), **Spell**, **Incident**;
- **abilities** that translate the real behaviour of each technology, and **Evolution** cards that are deployed in place
  of the card they derive from (FTP → SFTP → API/EDA, webMethods IS → webMethods.io…).

The detailed rules are in [regles.md](../produit/regles.md). Their resolution stays in `packages/domain`, as pure
functions with injected randomness, run by the server (ADR 0004).

## Alternatives considered

- **Quiz only** (WikiMasters): very educational, but does not make the behaviour of technologies felt and wears out
  quickly once the answers are known. Kept as a future "Certification" mode.
- **Generic board without thematic abilities**: simpler to balance, but loses the appeal of the universe.

## Consequences

- The engine must handle triggered effects ("when deployed", "at the start of your turn", "when destroyed") and
  immunities: an effect model has to be designed in `packages/domain`.
- Balancing goes through "bot versus bot" simulations replayable from a seed.
- Abilities with a random target (Autonomous, Hallucination) are drawn by the server, never by the client.
