# US-026 — A complete public view, enough for a bot

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Should
- **Size**: XS
- **Branch**: `us-026-vue-publique-bots`

## Story

As a **player (or test tool) playing through the API**, I want to **receive a view of the game as complete as the one the
server's bots have** so that **the domain strategies play as well from the API as on the server side**.

## Acceptance criteria

- [x] **Given** a view returned by the API (response schema then JSON), **when** it is rebuilt with `reconstituer`,
      **then** we get the same state as from the domain's full view, throughout a game.
- [x] The Autonomous Agent played from the API view wins at least one game in two against Nightly Batch.
- [x] The OpenAPI contract describes the added fields; the win rates of the levels (US-021) are unchanged.

## Notes

- Anomaly noticed during the US-025 tests: when playing j1 through the API with `choisirActionAgentAutonome`, every
  game against Nightly Batch (modern deck) was lost.
- Cause: the Zod schema `schemaComposant` (`apps/api/src/parties/schemas.ts`) did not declare `bonusAttaque`; Zod strips
  unknown keys, so the public view lost it. `reconstituer` then left `bonusAttaque` undefined and `attaqueEffective`
  returned `NaN`: every evaluation was `NaN`, no action beat `-Infinity` and the bot ended its turn without playing.
  The player's `marqueurs` ("once per turn" uses, protections) were missing too: the bot believed them always
  available.
- No impact in production: the server makes its bots play on the full `vueDe`.
- Fix: `bonusAttaque` in the component and `marqueurs` in `moi`, on the Zod and OpenAPI sides. The bonus teaches the
  opponent nothing new (the effective attack is already public); the markers concern only the player.

## Log

- 2026-10-18 — created, reproduced (0 wins out of 10) and cause identified.
- 2026-10-19 — delivered: bonusAttaque and marqueurs exposed by the API view; Autonomous Agent from the API at 63% against Nightly Batch, as on the server side; US-021 levels unchanged (55/63/58%, simuler 100 101)
