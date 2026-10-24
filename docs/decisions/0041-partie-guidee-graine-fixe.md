# 0041 — Guided game: a fixed seed and steps served by the API

- **Date**: 2026-10-24
- **Status**: Accepted

## Context

US-067 guides a beginner's first game, step by step (deploy, attack the System, Guard, counter-attack, decommission,
end the turn), in under 5 minutes. For every bubble to tell the truth ("the bot deployed Drop folder, which has
Guard"), the game must be known in advance. But each game receives a randomness key drawn by the server (ADR 0034),
and the front end computes no rule (ADR 0004).

## Decision

- **A fixed seed, for the guided game only**: `POST /api/v1/parties` with `guidee: true` creates the game from fixed
  starter decks (the player's and the bot's) and the `GRAINE_PARTIE_GUIDEE` seed, against Intern. Since the engine is
  replayable (ADR 0013), the hand, the draws and the bot's moves are always the same as long as the player follows the
  steps. All other games keep their drawn key (ADR 0034).
- **The scenario is versioned data of the domain** (`packages/domain/src/combat/partie-guidee.ts`, like the catalogue,
  ADR 0011): decks, seed, and for each step a title, a text and the expected action. A test replays the scenario and
  checks that each expected action is legal at the right moment, that Guard appears at its step, and that the game is
  then won by following the hint (ADR 0040).
- **The current step is served by the API** in the game response (`guide`): step n expects the player's n-th action,
  that is, the game version (ADR 0030). The front end shows the bubble, highlights what it points to and politely
  refuses any other move; it deduces nothing from the rules.
- The guided game is recognised by its deck (`initiation`), and **earns no booster**.
- What belongs to the player stays in their browser (ADR 0032): having finished or skipped the guide, so that it is
  no longer offered first.

## Alternatives considered

- **Ordinary game, bubbles triggered by the situation** ("when a Guard appears…"): no fixed seed, but some notions
  never come up, or come in the wrong order, and the game can last 20 turns.
- **Steps written in the front end**: simpler, but the scenario would be separated from the decks and the seed it
  assumes, and could not be checked by the domain test.
- **The server refuses actions outside the scenario**: stricter, but a learning game has nothing at stake; the front
  end's polite refusal is enough, and a player who skips the guide carries on freely.

## Consequences

- Changing a card of a starter deck, Intern or the engine can shift the scenario: its test flags it.
- The seed of the guided game is public (the repository is, ADR 0022): harmless, since the game earns nothing.
- A player who departs from the scenario (steps skipped) plays an ordinary game against Intern, with no bubbles.
