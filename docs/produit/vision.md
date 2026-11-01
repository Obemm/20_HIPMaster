# Product vision

## Idea

**HIPMaster** is a collectible card game (TCG) played in the browser, modelled on WikiMasters and on the Async TCG
shown in the video "J'ai demandé à une IA de RECODER WikiMaster…" (see [inspirations.md](inspirations.md)).

## Target game loop

1. **Open** boosters (free at regular intervals, or won in combat).
2. **Collect**: complete a set of cards of different rarities (common, rare, epic, legendary).
3. **Play**: build a deck and face a bot (several levels), then other players.
4. **Trade**: swap duplicates, compare yourself on the leaderboard.

## Who it is for

An integration team and colleagues curious about the platform: casual players who want a short game (under
5 minutes) on a phone or computer, and to learn while playing.

## Goals

1. **Fast**: a booster opens in under a second, a game lasts under 5 minutes.
2. **Everywhere**: designed for the phone first.
3. **Fair**: the game logic (draws, combat) is computed on the server, so it cannot be cheated.
4. **For everyone**: accessible (contrast, keyboard), with no mandatory purchase.

## Questions settled (US-005, 2026-10-16)

- **Universe**: HIP = a **hybrid integration platform**, from FTP to AI agents — see [univers.md](univers.md).
- **Origin of the cards**: written by hand, as versioned data — draft: [cartes-set-1.md](cartes-set-1.md).
- **Combat**: board with Throughput / attack / HP against the opposing System's SLA — [regles.md](regles.md), ADR 0010.
  A multiple-choice "Certification" mode is kept for later.
- **Monetisation**: none; the game is first of all internal, to train and engage the integration team.

## Out of scope (for now)

Real payments, a native mobile app, a player market with real money.
