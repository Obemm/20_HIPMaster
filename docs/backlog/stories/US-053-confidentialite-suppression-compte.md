# US-053 — Privacy page and deletion of one's account

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-053-confidentialite-suppression-compte`

## Story

As an **invited player**, I want **to know what data the game keeps about me and to be able to delete my account** so
that I can **play with confidence**.

## Acceptance criteria

- [x] **Given** any page, **then** a footer link leads to an "About and privacy" page that says: who publishes the game
      and how to reach them, who hosts it (Firebase for the site, Google Cloud in Frankfurt for the API, Neon in
      Frankfurt for the database), what data is kept (nickname, collection, duels, sessions; IP addresses in the
      technical logs), why, for how long, and how to exercise one's rights.
- [x] **Given** the storage of the token in the browser, **then** the page states that it is strictly necessary for the
      service: no consent banner is required, and the game uses no tracker or audience measurement tool.
- [x] **Given** a signed-in player, **when** they ask to delete their account from "My account" and confirm it,
      **then** their account, sessions, collection and rewards are deleted, and they are signed out.
- [x] **Given** a duel in progress with a player who deletes their account, **then** the opponent sees the duel ended
      (forfeit) instead of an error.
- [x] OpenAPI contract updated, API tests and e2e journey.

## Design

- **`DELETE /api/v1/moi`** (contract `comptes.yaml`): 204, then the token is worthless; 401 without a session. A single
  transaction (ADR [0031](../../decisions/0031-suppression-compte.md)): the player's duels in progress end by forfeit
  (they lose), their pending challenges are deleted, then the account, and with it its sessions, collection, rewards
  and games against the bot. Their finished duels remain with their opponent, without them ("Deleted account" in
  place of the nickname); a duel whose two players have left is deleted.
- Compatible migration: the duels' foreign keys go from `CASCADE` to `SET NULL`, `createur_id` accepts `NULL`.
- Front end: an "About and privacy" link in the footer of all pages (`app.ts` shell, the strict minimum), a
  `/confidentialite` page, and in "My account" a "Delete my account" button that asks for confirmation, then signs out
  and says so.
- Retention (project owner's decision, 2026-10-23): accounts, collections, rewards and results kept without limit,
  unless deleted by the player; only technical data expires (sessions unused for 90 days, logs and backups 30 days,
  abandoned games against the bot, challenges never accepted). What the purge of US-054 will apply is marked "soon":
  the page honestly says what is already in place.

## Notes

- Today, deleting a player cascades to the duels they appear in, including for their opponent (`onDelete: 'cascade'`
  in `apps/api/src/db/schema.ts`): to be reviewed in this story.
- No audience measurement (ADR 0005).

## Log

- 2026-10-22 — created, from the review before going live.
- 2026-10-23 — refined: design, ADR [0031](../../decisions/0031-suppression-compte.md), OpenAPI contract first;
  retention durations proposed, to be validated by the project owner in the PR.
- 2026-10-23 — delivered: "About and privacy" page in the footer of every page (publisher, hosts, data kept and why, proposed durations including those of US-054 marked "soon", rights, no tracker or banner); account deletion from "My account" after confirmation (DELETE /api/v1/moi, one transaction); duels in progress ended by forfeit, finished duels kept by the opponent facing "Deleted account" (migration 0011, foreign keys SET NULL); concurrency with a simultaneous move proven on PostgreSQL 18; full e2e green; ADR 0031
- 2026-10-23 — decision of the project owner: accounts, collections and scores kept; the page no longer plans to delete
  inactive accounts after 12 months, only technical data expires. US-054 updated.
