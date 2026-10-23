# 0031 — Deleting your account: forfeit of ongoing duels, history kept without the player

- **Date**: 2026-10-23
- **Status**: Accepted

## Context

US-053 lets a player delete their account and publishes an "About and privacy" page. Accounts are guest accounts,
with no email (ADR 0017). The tables that refer to a player delete their rows in cascade with them: sessions,
collection, rewards, games against the bot (ADR 0030), and **duels** — including those of their opponent. An ongoing
duel would therefore vanish in front of the other player (404 on the next move), and a finished duel from their
history. No automatic purge exists yet (US-054).

## Decision

- **`DELETE /api/v1/moi`**, reserved for the signed-in player, deletes their account in **a single transaction**:
  1. each **ongoing duel** they play ends by **forfeit**: they lose, the opponent wins (same outcome as an exceeded
     deadline, ADR 0020); the duel version changes, and the opponent's screen sees it on its next read;
  2. their **pending challenges** are deleted: nobody else is involved in them;
  3. the account is deleted, and with it its sessions (the player is signed out everywhere), collection, rewards and
     games against the bot;
  4. finished duels stay for their opponent, **without them**: the foreign key becomes `NULL`, and the API says
     "Deleted account" in place of their nickname. A duel whose two players have both deleted their account is
     deleted.
- Duels are locked as for an action (`FOR UPDATE`): an opponent's move played at the same instant goes before or
  after the forfeit, never in the middle.
- A win caused by the opponent deleting their account is a forfeit win like any other, rewarded according to the
  duel rules (US-038).
- Migration compatible with the live version: the duels' foreign keys change from `CASCADE` to `SET NULL` and
  `createur_id` accepts `NULL` (a relaxed constraint); no data is modified.
- **Retention** (decision of the project owner, 2026-10-23): **accounts, collections, rewards and results (the future
  scores, US-069) are kept with no time limit**, unless the player deletes their own account. Only technical data
  expires: sessions unused after 90 days (the player signs back in with their code; purge of US-054, not in place
  yet), technical logs and backups after 30 days at most, games against the bot abandoned after 24 hours without a
  move (ADR 0030: a reward already won stays acquired), challenges never accepted after 7 days (US-033), in-memory
  rate-limiting counters for an hour at most (ADR 0025).
- **No consent banner**: the only browser storage is the session token (`localStorage`), strictly necessary for the
  requested service; no tracker or audience measurement tool.

## Alternatives considered

- **Keep the cascade**: the duel disappears for the opponent, who gets an error instead of a result. Rejected.
- **Deactivate the account instead of deleting it** (nickname erased, row kept): the history would keep its links,
  but it is no longer a deletion, and these accounts would have to be excluded from every query. Rejected.
- **Also delete finished duels**: simpler, but the opponent would lose part of their history. Rejected.
- **Confirm with the recovery code**: safer against a lent device, but a player who has lost their code could no
  longer delete their account. The explicit on-screen confirmation is enough (the gesture requires an open session).

## Consequences

- A player can leave without asking anyone; their opponent sees the duel won by forfeit instead of an error, and
  keeps their history.
- Duels may now have only one known player: the code and the front end handle "Deleted account".
- The duel screen announces every forfeit with "… did not play in time": for a deleted account the sentence is
  approximate ("Deleted account did not play in time: forfeit."). A dedicated end reason would mean touching the
  engine and the game screens: left to a front-end story if the need is confirmed.
- The durations shown commit the project: US-054 must apply them without ever deleting an account, its collection
  or the history needed for scores, and the page must change if they change.
