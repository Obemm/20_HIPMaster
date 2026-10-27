# EPIC-04 — Combat against the bot

- **Status**: Done
- **Priority**: Must

## Goal

Play a short game against a bot, with several difficulty levels, and win boosters.

## Success indicator

A game lasts under 5 minutes; the easy-level bot wins at most one game in two against a beginner, and going first does
not give a decisive advantage.

Indicator revised on 2026-10-22 (US-064): it aimed at the medium level (ESB Architect at the time of US-021), but a
beginner wins only about one game in seven against Nightly Batch, now medium, and even less against ESB Architect. It
is the easy level, Intern, that lets them win more than one game in two.

## Stories

- [x] US-010 — Combat engine: base rules
- [x] US-011 — "Nightly Batch" bot and loaned decks
- [x] US-012 — Game API against the bot
- [x] US-013 — Game screen against the bot
- [x] US-014 — Spells and incidents
- [x] US-019 — Component-specific effects
- [x] US-020 — AI abilities and Migration
- [x] US-021 — Bot levels
- [x] US-025 — A booster for every victory
- [x] US-026 — A complete public view, enough for a bot
- [x] US-039 — Explain attacks and combat resolution
- [x] US-040 — View the details of the cards in your hand
- [x] US-041 — View the details of the cards on the board
- [x] US-064 — A bot a beginner can beat, a fair game for both players
- [x] US-071 — Say why a card in hand cannot be played

First playable milestone at the end of US-013, with the cards the engine already supports (project owner's decision,
2026-10-18). Bot levels (US-021) and victory reward (US-025, with EPIC-02 and EPIC-03) written on 2026-10-18.

Epic reopened on 2026-10-22: the project owner finds the bot almost impossible to beat; a simulation shows that no
level is really easy and that going first is a big advantage (US-064).

Epic reopened on 2026-10-23: the project owner cannot play Apigee AI Gateway, an evolution whose screen does not say
that it is waiting for its source card on the board (US-071).

## Out of scope

Combat against other players (EPIC-06).
