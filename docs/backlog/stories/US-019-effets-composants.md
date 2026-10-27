# US-019 — Component-specific effects

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-019-effets-composants`

## Story

As a **player**, I want **components with an effect to do what their card says** so that **I can play Cron, Designer or
CDC as real cogs of the platform**.

## Acceptance criteria

- [x] The "when deployed" effects are applied: webMethods Designer, Apigee API Hub, OpenAPI, Solace Event Portal, CDC,
      AsyncAPI.
- [x] The permanent effects are applied: Cron (a Batch component can attack two turns in a row), Vector database (your
      agents have +1 HP).
- [x] An effect that asks for a choice (OpenAPI, AsyncAPI) is played with its target; a targeted draw effect (Designer,
      API Hub, Event Portal) takes the first card of the wanted family from the draw pile, otherwise nothing.
- [x] These 8 cards join `CARTES_PRISES_EN_CHARGE`; each effect has its test.

## Notes

- Comes from the breakdown of [US-014](US-014-effets-cartes.md) on 2026-10-18.
- `poser` accepts an optional `cible` (the component reinforced by OpenAPI or AsyncAPI): the action stays explicit
  (ADR 0013). The API normalises the absence of a target for the domain.
- The engine now plays **63 cards out of 71**; the remaining 8 are those of [US-020](US-020-capacites-ia.md).

## Log

- 2026-10-18 — created (breakdown of US-014).
- 2026-10-18 — `effets-composants.ts` (targeted draw, reinforcement, CDC, Vector database), Cron rule in the engine
  tools; `poser` with target; API (schema and contract) and screen ("Deploy and reinforce …"); 11 domain tests, 1
  screen test; clarifications in regles.md. In review.
- 2026-10-18 — delivered: component-specific effects (targeted draw, reinforcement, CDC, Cron, Vector database): 63 cards out of 71 playable
