# 0044 — Cumulative score and duel rating, counted by the server, never reset

- **Date**: 2026-10-24
- **Status**: Accepted

## Context

US-069 gives players a score that reflects their progress and a leaderboard among colleagues, to make them want to
come back and compare themselves. Several rules were possible: points per victory, an Elo-type rating, or both;
periodic reset or not; public leaderboard or opt-in. Constraints:

- the server is authoritative, never the front end (ADR 0004);
- accounts, collections and scores are kept without limit, unless the player deletes their account (ADR 0031);
- a game against the bot is purged 24 hours after its last move (ADR 0030, 0035): of the history, only the reward of
  each victory (`recompenses`) remains, without the bot's level; finished duels, on the other hand, are all kept with
  their outcome;
- the free Neon database calls for light queries (ADR 0039).

The project owner decided on 2026-10-24, among three proposed rules: "points + duel rating", everyone ranked with the
option to opt out, and catching up the history.

## Decision

- **Two figures, never reset.**
  - **Points** (the score, which orders the leaderboard): a victory against the bot earns 1, 2, 3 or 5 points
    depending on the level (Intern, Nightly Batch, ESB Architect, Autonomous Agent); a duel victory earns 5 points, a
    drawn duel 2 points each. At most **10 victories counted per day** (UTC), bot and duels combined: beyond that, a
    victory is recorded at 0 points. A draw does not count towards this cap. Defeats and draws against the bot: 0.
    The guided game (US-067) does not count.
  - **The duel rating**, Elo-style: start at 1000, K factor = 32, updated at each finished duel between two accounts
    that still exist; what one gains, the other loses. It is shown only after a first duel.
- **The rule is a pure function** of `packages/domain` (`score.ts`: scale, cap, `cotesApresDuel`), applied by the API.
- **A `points` ledger** keeps each gain, one row per game and per player (primary key): a game earns only once, and
  the cap is counted on the day's ledger. The total is kept up to date in `joueurs.points` at each gain: the
  leaderboard is read without aggregation. `joueurs.cote` and `joueurs.duelsCotes` carry the rating;
  `duels.scoreCompte` marks a duel already counted (conditional update, counted once even if read by both players at
  the same time).
- **When gains count**: a victory against the bot with its reward (when the won game is read); a finished duel at its
  first read by either player, on the day it ended. Duels that nobody reads again, and everything that predates the
  score, are **caught up** in chronological order by `rattraperScores`: run by the migration command (hence before
  each deployment), by the nightly purge, and when the development API starts. Victories against the bot from before
  the score are worth 1 point (level unknown), cap included; finished duels are recounted in full, points and rating.
- **Leaderboard**: `GET /api/v1/classement` (account required) returns my score, my rank and the 100 best ranked
  players with at least one point (two equal scores share the same rank); `PUT /api/v1/moi/classement` removes oneself
  from the leaderboard or brings oneself back. Everyone is ranked by default; once removed, their score still counts
  and only they see it. The privacy page says what other players see.

## Alternatives considered

- **Points only**: simpler to read, but rewards only assiduity; the rating measures real skill among colleagues.
- **A single rating for everything** (bots as opponents with a fixed rating): impossible to inflate by chaining easy
  games, but points can be lost there, which discourages a beginner.
- **Reset per season**: renews interest, but wipes progress that the project owner wants to keep without limit
  (ADR 0031), and requires one more scheduled task.
- **Computing the score at read time** from the history: impossible for victories against the bot (games purged after
  24 hours), and an aggregation on every leaderboard read would cost the Neon database more.
- **Opt-in leaderboard**: more discreet, but an almost empty leaderboard motivates nobody; opting out in one click and
  the privacy page are enough among invited colleagues.
- **Counting points in the reward** (`recompenses`): it only knows victories, one row per game for the winner alone;
  a drawn duel earns points for both players.

## Consequences

- The score is retroactive from going live: past victories count (at 1 point against the bot).
- A victory against the bot whose final read never happens (tab closed before the end) earns nothing, like its reward;
  a rewarded victory not yet counted is counted at 1 point by the catch-up, after an hour.
- Two colleagues who collude earn no more than 10 victories a day, and their rating merely passes from one to the
  other.
- Changing the scale does not recompute points already earned; a dedicated catch-up would be needed.
- Deleting one's account erases one's ledger and score; opponents keep the points and rating gained against them.
