# 0004 — Game logic in pure TypeScript, server authority

- **Date**: 2026-10-16
- **Status**: Accepted

## Context

The rules (booster draws, resolution of a combat turn, bot AI) are the heart of the game: they must be thoroughly tested
and must not be tamperable from the browser.

## Decision

All the game logic lives in `src/domain/`, as pure TypeScript functions, with no dependency on Next.js or the database
(randomness is injected, e.g. `tirerRarete(aleatoire)`). The server runs it and is authoritative; the client only
displays.

## Alternatives considered

- **Logic in React components**: quick at first, but hard to test and easy to cheat.
- **External game engine** (boardgame.io…): constrains the game model before it is defined.

## Consequences

- Fast, exhaustive unit tests with Vitest, games replayable from a seed.
- The same logic will serve the bot and "bot versus bot" simulations to balance the cards.
