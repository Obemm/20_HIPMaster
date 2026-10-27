# US-066 — A hint on demand, against the bot

- **Epic**: EPIC-11
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-066-conseil-en-partie`

## Story

As a **player discovering the game**, I want **to ask what the best move is, and why** so that **I learn by playing
against the bot rather than by reading the rules**.

## Context

The bots already know how to choose an action from a player's view alone, without cheating (ADR 0004, 0013): simple
Nightly Batch rules (`packages/domain/src/combat/bot.ts`) and ESB Architect's search (`chercher`, `evaluer` in
`bots-forts.ts`). The same computation can advise the human player. The new work is to **explain** the move in one
sentence.

## Acceptance criteria

- [x] **Given** a game against the bot, **when** I ask "A hint?", **then** the screen highlights the recommended action
      (the card to deploy; the attacker and its target; the spell and its targets; or "End your turn") and explains it
      in one sentence. Examples: "Attack the SAP Adapter: it has Guard, and your REST API destroys it without being
      destroyed"; "Deploy Pub/Sub: it is the strongest card your Throughput allows".
- [x] **Given** the hint, **then** it is computed by the server from my view alone: it reveals neither the opposing
      hand nor the draw pile. Route `GET /api/v1/parties/{id}/conseil`, OpenAPI contract written before the code,
      rate-limited (US-047).
- [x] **Given** the "A hint every move" option (kept by the browser), **then** the hint is displayed without being
      asked for, for absolute beginners.
- [x] **Given** a duel, **then** no hint is offered and the API refuses it (project owner's decision, 2026-10-23).
- [x] **Given** a simulated player who always follows the hint, **then** they beat Intern at least 85% of the time and
      Nightly Batch at least 45% of the time (`npm run simuler`). The hint is computed in under 200 ms.
- [x] Domain (explanations), API and screen tests; e2e journeys; accessibility (hint announced to screen readers,
      keyboard).

## Notes

- Prefer an adviser whose decisions can be explained, even if it plays a bit weaker than Autonomous Agent.
- The hint does not change the victory reward.
- Choices made ([ADR 0040](../../decisions/0040-conseil-serveur-contre-bot.md)):
  - **Adviser**: `conseiller(vue)` in the domain (`combat/conseil.ts`) follows the Nightly Batch rules (`bot.ts`,
    whose rules are now exported) and explains the rule that chose the move: strongest or only possible deployment,
    evolution, Migration, Tooling, spell (by its effect), attack (victory, unprotected System, destruction while
    surviving the counter-attack, favourable trade, Guard), decommissioning (the card it lets you deploy), end of turn
    (losing attacks, nothing useful). A test checks that it chooses the same action as Nightly Batch at every move.
  - **Measurement** (`npm run simuler`, 450 games per measurement, seed 1): a player who always follows the hint beats
    Intern 89% of the time and Nightly Batch 47%. The computation takes under a millisecond.
  - **API**: `GET /api/v1/parties/{id}/conseil` returns `{ version, action, explication }`, 409 when it is not the
    player's turn, same ownership as the game, `conseilPartie` limit of 300 per minute. No route for duels: "the API
    refuses it" takes the form of an absent route (404).
  - **Screen**: a light bulb "A hint?" in the header, against the bot and during its turn only; the hint is displayed
    above "End my turn", in an `aria-live` area, with "Hide the hint"; what it designates (card, attacker and target,
    System, end-of-turn button) carries a golden dotted outline and "advised" in its accessible name. A hint is only
    valid for the version of the game that produced it.
  - **Option** "A hint every move" in the "?" help (against the bot), kept by the browser
    (`hipmaster.conseil-chaque-coup`, ADR 0032), off by default.

## Log

- 2026-10-23 — created, at the project owner's request; hint against the bot only (their decision).
- 2026-10-24 — refined and started: choices noted above (ADR 0040).
- 2026-10-24 — delivered: hint on demand against the bot (light bulb, highlighting and explanation), GET /parties/{id}/conseil computed by the domain on the Nightly Batch rules, "A hint every move" option, never in a duel (ADR 0040)
