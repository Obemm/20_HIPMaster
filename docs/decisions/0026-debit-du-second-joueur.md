# 0026 — The second player gets +1 Throughput on their first turn

- **Date**: 2026-10-22
- **Status**: Accepted

## Context

[ADR 0010](0010-combat-plateau.md) fixes the resource of combat: **Throughput**, +1 per turn, 10 at most. The player
who starts is drawn at random; their only counterpart is not drawing on their first turn. It is not enough: they play
and attack one turn earlier, and keep that lead for the whole game.

Measured by simulation (US-064, 360 games per row, borrowed decks crossed, each player against themselves):

| Players          | First player's wins | Second player's wins |
| ---------------- | ------------------- | -------------------- |
| Beginner profile | 71%                 | 29%                  |
| Nightly Batch    | 63%                 | 36%                  |
| ESB Architect    | 66%                 | 34%                  |
| Autonomous Agent | 58%                 | 41%                  |

A beginner playing second against Nightly Batch wins only 8% of their games. The rule also applies to duels between
players ([ADR 0020](0020-duels-asynchrones.md)): a player must not lose in advance because the draw made them play
second.

## Decision

The player who plays second receives **+1 Throughput on their first turn**: 2 instead of 1. After that, the rule of
ADR 0010 applies unchanged (+1 per turn, 10 at most, unspent Throughput is lost): they therefore receive 2, then 2, 3,
4… like the first player.

- The engine applies it in `debuterTour` (`packages/domain/src/combat/tour.ts`): the rule holds for all games, against
  the bot as in duels, without changing anything in the API or the bots, which read their Throughput from their view.
- The Token bill penalty (2 less Throughput on the next turn) is subtracted from the total, bonus included.
- This ADR **completes** ADR 0010 without replacing it.

## Alternatives considered

- **One more card for the second player**: tried on a copy of the engine, it nearly equalises the bots but not the
  beginners (70% for the first, 32% for the second), who do not yet know how to take advantage of an extra card when
  they lack Throughput.
- **A "coin" card that yields 1 Throughput once, whenever wanted** (modelled on Hearthstone): more flexible, but it is
  a card and one more decision to explain to beginners, and one more action to teach the bots, for a similar effect.
- **+1 Throughput on every turn of the second player**: too strong, the advantage would change sides.
- **Change nothing**: rejected, the measured gap (up to 71% against 29%) decides too many games before the first move.

## Consequences

- Games become fair again between the first and second player; each side's share of wins is measured for each level by
  `npm run simuler` (tables in [cartes-set-1.md](../produit/cartes-set-1.md)), to be watched at each rebalancing.
- The rules ([regles.md](../produit/regles.md)) and the on-screen "How to play?" help explain it.
- A game started before the rule continues normally: only a second player who has not yet played their first turn
  receives the bonus. Replayed with the new engine from its seed and its actions
  ([ADR 0013](0013-moteur-combat.md)), a game from before the rule would not give the same result; no game is replayed
  that way today.
