# EPIC-11 — Learning to play

- **Status**: Done
- **Priority**: Should

## Goal

A colleague who has never played should understand the rules and win their first game against the easy bot without
reading any documentation. The rules are rich (Throughput, Guard, counter-attack, abilities), and the findings agree:

- US-039: a game lost without inflicting a single point of damage, for lack of knowing that you must choose the
  attacker and its target;
- simulation study of 2026-10-22: a beginner won only 14% of their games against the former "easy" level;
- US-064 created a real easy level, "Intern". What remains is to teach how to play **by playing**.

## Success indicator

- A player who follows the tips beats Intern at least 85% of the time (measured by simulation).
- A player no longer ends a turn without attacking, when they could have, without having been warned.
- The first guided game ends in under 5 minutes.

## Stories

- [x] US-065 — Nudges at the right moment
- [x] US-066 — A hint on demand, against the bot
- [x] US-067 — A guided first game

Suggested order: US-065 and US-066 before sending the invitations (batch 2), once batch 1 of EPIC-09 is done. Then
US-067, after the mobile board (US-059), so the help bubbles are not redone when the board changes.

## Decisions

- Advice is given **against the bot only**, never in a duel: a duel remains a face-to-face (project owner,
  2026-10-23).
- Tips stay active everywhere, duels included: they only say what the player could see for themselves.

## Out of scope

- A conversational assistant (LLM) that would comment on the game.
- "Certification" mode (a questionnaire drawn from the card texts), kept for later in the product vision.
