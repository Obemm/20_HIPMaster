# US-020 — AI abilities and Migration

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Should
- **Size**: L
- **Branch**: `us-020-capacites-ia`

## Story

As a **player**, I want to **play the agents and the AI evolutions** so that **I can enjoy Solace Agent Mesh, Apigee AI
Gateway and all the agentic AI of the set**.

## Acceptance criteria

- [x] The AI abilities are applied: Autonomous (attacks at random at the start of the turn), Orchestration, Tooling,
      Delegation, Context, Guardrails, Asynchronous, Semantic cache, Multi-model routing.
- [x] Migration (SFTP) is applied.
- [x] The Solace Agent Mesh and Apigee AI Gateway evolutions, and the Agent, Multi-agent orchestrator, MCP server,
      Agent Card (A2A), RAG and SFTP cards join `CARTES_PRISES_EN_CHARGE`: **all 71 cards** are playable.
- [x] The bot can play these cards; the "bot against bot" simulation runs with the complete set.
- [x] Each ability has its test; the randomness (Autonomous) goes through the seeded generator.

## Notes

- Comes from the breakdown of [US-014](US-014-effets-cartes.md) on 2026-10-18.
- Three abilities require a choice from the player and become explicit actions (ADR 0013): `outiller`, `router`,
  `migrer`. Autonomous agents attack at the start of their owner's turn, right after the draw.
- The loaner decks include the AI cards (Modern: AI Gateway and Agent Mesh; Hybrid: SFTP, Agent, RAG, MCP server);
  duels between 44 and 56% over 400 games.

## Log

- 2026-10-18 — created (breakdown of US-014).
- 2026-10-18 — `ia.ts` (Autonomous, Tooling, Semantic cache, Routing, Migration), Orchestration, Delegation and Context
  in the engine tools; actions `outiller`, `router`, `migrer`; bot (Migration, Tooling); loaner decks and simulation;
  API (contract, schemas) and screen (buttons, statuses, log); 13 domain tests, 2 screen tests. **All 71 cards are
  playable.** In review.
- 2026-10-18 — delivered: AI abilities and Migration: all 71 cards of set 1 are playable, bot and loaner decks balanced (44 to 56%)
- 2026-10-18 — CI: the test "removes the images of a card that is no longer described" (packages/illustrations)
  exceeded the default 5 s on GitHub, AVIF encoding being slowed down by the domain simulations running in parallel;
  timeout raised to 30 s for the illustrations project only (`vitest.config.ts`).
