# US-069 — A score and a leaderboard

- **Epic**: EPIC-07
- **Status**: Done
- **Priority**: Could
- **Size**: L
- **Branch**: `us-069-score-classement`

## Story

As a **player**, I want **a score that reflects my progress and a leaderboard among colleagues** so that **I want to
come back and compare myself**.

## Acceptance criteria

- [x] **Given** the scoring rule adopted (to be defined with the project owner: victories weighted by bot level, an
      Elo-type duel rating, collection progress…), **then** it is written in `docs/produit/regles.md` and computed by
      the server, never by the front end (ADR 0004).
- [x] **Given** a signed-in player, **then** they see their score and rank; a leaderboard lists players by username.
- [x] **Given** a player who does not want to appear, **then** they can opt out of the leaderboard.
- [x] **Given** games played before the score, **then** they count, as far as the history allows.
- [x] **Given** the privacy page, **then** it says what other players see of the score.

## Notes

- Project owner's request (2026-10-23). Open questions: which games count (bot, duels), periodic reset or not,
  whether guided games count (no).
- Project owner's decision (2026-10-24), among three proposed rules (points only, single rating, points + rating):
  **points + duel rating**, everyone ranked with the possibility to opt out, history catch-up
  ([ADR 0044](../../decisions/0044-score-et-cote-de-duel.md), [rules](../../produit/regles.md)).
- Choices made:
  - **Rule** (`packages/domain/src/score.ts`): victory against the bot 1 / 2 / 3 / 5 points depending on the level,
    duel won 5, drawn duel 2 each, at most 10 victories counted per UTC day; Elo rating starting at 1000, K = 32,
    between two accounts still present. No reset.
  - **Database** (migration `0014_score_classement`): `points` register (one row per game and per player, which
    guarantees it is counted only once), `joueurs.points`, `cote`, `duelsCotes`, `classe`, and `duels.scoreCompte`.
    Index of the leaderboard (players ranked by points) and of the duels to count.
  - **When**: the victory against the bot with its reward; the duel on its first reading once finished.
    `rattraperScores` counts the rest in chronological order (pre-score victories at 1 point, duels finished in full):
    migration command before each deployment, overnight purge, development API startup.
  - **API** (`openapi/classement.yaml`): `GET /classement` (my score, my rank, the top 100 ranked with at least one
    point, shared ranks on ties), `PUT /moi/classement` (opt out, come back).
  - **Screen**: "Leaderboard" page (my score, rank, rating; "Appear in the leaderboard" checkbox; table of players;
    the rule in brief), "Leaderboard" tile on the home page ("12 points · 3rd"). No extra tab in the phone bar (five
    tabs already).
  - **Privacy**: new "What other players see" section, score added to the data kept without limit.
  - **Translation**: the multilingual foundation (EPIC-14) was not on `main`; the new strings stay in French, to be
    marked along with the rest of the site.

## Log

- 2026-10-23 — created, noted for later at the project owner's request.
- 2026-10-24 — rule decided with the project owner (ADR 0044), started.
- 2026-10-24 — delivered: score and leaderboard: points depending on the bot level, duel 5, draw 2, 10 victories counted per day, Elo duel rating, no reset, opt-out possible, history caught up (ADR 0044)
