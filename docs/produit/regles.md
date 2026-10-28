# Rules of the game

Board combat, two players (one player against the bot, then against another player). Decision:
[ADR 0010](../decisions/0010-combat-plateau.md). Universe: [univers.md](univers.md). First set:
[cartes-set-1.md](cartes-set-1.md).

## Goal

Each player defends their **System**, which has **20 SLA points**. The first to bring the opponent's SLA down to 0 wins.
After 20 turns (10 for each player), the player with the most SLA wins (tie: the game is drawn).

## The deck

- **20 cards**, at most 2 copies of the same card, only 1 per legendary.
- While the collection is small, a starter deck is lent.

## The resource: Throughput

- At the start of each of their turns, the player receives **Throughput**: 1 on the first turn, then +1 per turn
  (maximum 10). Unspent Throughput is lost.
- The player who plays **second** receives **1 extra Throughput on their first turn only**: 2 instead of 1, then 2, 3,
  4… like the other player. Going first therefore does not decide the game
  ([ADR 0026](../decisions/0026-debit-du-second-joueur.md)).
- Once per turn, you can **decommission** a card from your hand: it goes to the discard pile and earns Throughput for
  that turn (+1 common or rare, +2 epic, +3 legendary).

## How a turn runs

1. **Draw** a card (the player who goes first does not draw on their first turn). Starting hand: 4 cards, hand limit:
   8 cards.
2. **Throughput**: refill, then "at the start of your turn" effects.
3. **Play cards** by paying their Throughput cost, in any order you like:
   - **Component**: deployed on the board (5 slots). It has an **attack** and **HP**.
   - **Spell** (Patterns, prompting…): immediate effect, then discard.
   - **Incident** (Bestiary): effect against the opponent, then discard.
   - **Evolution of X**: deployed **in place of** X on your board, with full HP; it can attack this turn if X could.
4. **Attack**: each component can attack once, except on the turn it is deployed.
   - **Nothing attacks on its own**: each turn, for each component that is to attack, you choose the **attacker** (one
     of your components) then its **target** (an opposing component or the opposing System). Deploying cards is not
     enough: a turn where you only deploy deals no damage to the opponent. Only **Autonomous** agents attack without
     being ordered (see below).
   - Against a **component**: each deals its attack to the other (counter-attack). At 0 HP, a component is destroyed.
   - Against the **System**: the opposing SLA loses the component's attack, with no counter-attack.
   - As long as the opponent has a component with **Guard**, it must be attacked first.
   - Attacking before or after deploying cards: you choose the order.
5. **End the turn**: components that have not attacked lose their attack for this turn (it does not carry over).

Damage stays from one turn to the next. All the randomness (draws, random targets) is drawn by the server (ADR 0004).

## Resolving a combat

An attack is always resolved in this order:

1. **Check that the attack is allowed.** The attacker was not deployed this turn, has not already attacked, has an
   attack above 0 and is not blocked (unpaid On-premises upkeep, immobilisation, Batch). The target respects Guard and
   Quotas.
2. **Compute the strengths.** A component's strength is its printed attack, plus +1 per allied **Hub** in play (a Hub
   does not count itself), plus permanent bonuses (Reinforcement, Context…). The defender's counter-attack is computed
   the same way, with the Hubs of **its** side.
3. **Trade blows, simultaneously.** The defender loses the attacker's strength, the attacker loses the defender's
   strength. The defender counter-attacks even if it drops to 0 HP: both can be destroyed together.
4. **Attack effects.** The attacker's Broadcast, then a Reactive from the defender that is still alive (+1 damage to the
   attacker).
5. **Destructions.** Any component at 0 HP is destroyed (Single point of failure and Durable queue then trigger).

Against the System, only steps 1 and 2 count: the SLA loses the attacker's strength, with no counter-attack or
Reactive.

### Examples

**A trade that destroys both cards.** REST API (attack 3, HP 2) attacks JDBC Adapter (attack 2, HP 3). JDBC takes 3
damage: 3 − 3 = 0, it is destroyed. REST API takes the counter-attack of 2: 2 − 2 = 0, it is destroyed too.

**Attacking the System with a Hub.** You have Universal Messaging (attack 2) and webMethods Integration Server 10.15
(Hub) in play, deployed on previous turns. Universal Messaging attacks the opposing System with a strength of 2 + 1 = 3:
the opposing SLA loses 3. webMethods IS (attack 4) then attacks the System: it does not benefit from its own Hub, the
SLA loses another 4. Total for the turn: 7 SLA. If you merely deploy cards, this turn deals no damage.

**Guard, and damage that stays.** The opponent has SAP Adapter (Guard, attack 3, HP 5): you can aim at neither their
System nor their other components. SOAP / WSDL (attack 3, HP 4) attacks SAP: SAP drops to 2 HP, SOAP drops to 1 HP. On
the next turn, SAP still has 2 HP: an attack of 2 is enough to destroy it and reopen access to the System.

**Reactive.** The opponent has Topic (Reactive, attack 1, HP 2) and REST API (attack 3, HP 2). SOAP / WSDL (attack 3,
HP 4) attacks REST API: REST API is destroyed, SOAP takes 3 from the counter-attack then 1 from Reactive (Topic is
alive) and drops to 0. To keep SOAP, it was better to destroy Topic first.

**Evolution.** webMethods IS 10.15, deployed on the previous turn, evolves into webMethods.io: the new card arrives
with its full 7 HP and can attack straight away, since webMethods IS could.

## Clarifications (settled while coding the engine, US-010)

- **Empty draw pile**: the player does not draw, with no other penalty.
- **Full hand**: a card drawn beyond the limit goes to the discard pile; Durable queue cannot bring a card back into a
  full hand (it goes to the discard pile).
- **Zero attack**: a component whose attack is 0 cannot attack.
- **Evolution**: the original card goes to the discard pile; the evolution arrives with full HP and keeps the attack
  state of the original (how long it has been deployed, whether it has already attacked this turn).
- **Broadcast**: the 2 additional damaged components are drawn at random among the other opposing components.
- **Reactive**: the damage is dealt to the attacker after the damage exchange, if it is still in play; only one
  Reactive triggers per attack.
- **Single point of failure**: the destructions it causes can lead to others, in a cascade.
- **Non-compliant** stacks (2 cards: 2 SLA per turn); **On-premises** deducts the upkeep automatically, card by card, as
  long as Throughput remains.

## Spells and incidents (US-014)

- A spell or an incident is played by paying its cost, with its targets if any, then goes to the discard pile.
- "On its next turn": the effect lasts until the end of the next turn of the owner of the targeted component.
- A **parry** cancels the effect but not the cost: the card is still played and discarded.
- Effects that hit "at random" (Hallucination) draw their target from both sides, System included, never a Veteran
  component.

## Components' own effects (US-019)

- **Targeted draw** (webMethods Designer, Apigee API Hub, Solace Event Portal): the first card of the wanted family in
  the draw pile goes to your hand; if there is none, nothing happens.
- **Reinforcement** (OpenAPI, AsyncAPI): the card is placed on one of your components of the family (+1 attack,
  permanent); with no component of the family in play, it is placed with no effect.
- **Cron**: once per turn, one of your Batch components can attack even if it attacked on the previous turn.
- **Vector database**: your agents in play gain 1 HP when it is deployed, as do those deployed afterwards while it is in
  play.
- A component whose abilities are suspended (Expired certificate, Context overflow) also loses its permanent own
  effect.

## AI abilities and Migration (US-020)

- **Autonomous**: without Orchestration, an agent never attacks on command; at the start of your turn, it attacks a
  random valid target (Guard and Quotas respected). With **Orchestration**, you make it attack yourself.
- **Delegation**: once per turn, an agent that has already attacked attacks a second time (an autonomous agent does it
  on its own, at random); Solace Agent Mesh gives this effect to your agents.
- **Tooling** ("equip" action, once per turn): your agents borrow the abilities of one of your non-AI components until
  the end of the turn; Solace Agent Mesh also gives this effect.
- **Multi-model routing** ("route" action, once per turn): an AI component (other than the one routing) returns to
  hand, and an AI component from your hand, of equal or lower cost, takes its place for free; it cannot attack this
  turn.
- **Migration** ("migrate" action): SFTP is replaced by an API or EDA component from your hand, which costs 2 less; SFTP
  goes to the discard pile and the new card cannot attack this turn.
- **Semantic cache**: your first AI spell of the turn costs nothing.

## Abilities

| Ability                     | Effect                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Batch**                   | Cannot attack two turns in a row.                                                                                                              |
| **Veteran**                 | Cannot be targeted by Agentic AI cards or by AI incidents.                                                                                     |
| **Non-compliant**           | At the start of your turn, your System loses 1 SLA while this card is in play.                                                                 |
| **On-premises**             | At the start of your turn, pay 1 Throughput for upkeep, or the card cannot attack this turn.                                                   |
| **Hub**                     | Your other components have +1 attack.                                                                                                          |
| **Single point of failure** | When this card is destroyed, your other components take 1 damage.                                                                              |
| **Guard**                   | Must be attacked before your other components and your System.                                                                                 |
| **Quotas**                  | Cannot be attacked more than twice per turn.                                                                                                   |
| **Connector (N)**           | When the card is deployed, draw N cards.                                                                                                       |
| **Broadcast**               | When it attacks a component, also deals 1 damage to up to 2 other opposing components.                                                         |
| **Reactive**                | Once per turn, when one of your components is attacked, deals 1 damage to the attacker.                                                        |
| **Durable queue**           | Once per game, when one of your components is destroyed, it returns to your hand.                                                              |
| **Monitoring**              | At the start of your turn, look at the top card of your opponent's deck.                                                                       |
| **Migration**               | Once, replace this card with an API or EDA component from your hand, which then costs 2 less.                                                  |
| **Autonomous**              | Does not attack on command: at the start of your turn, it attacks a random valid target.                                                       |
| **Orchestration**           | You choose the target of your Autonomous components.                                                                                           |
| **Tooling**                 | At the start of your turn, choose one of your non-AI components: your agents gain its ability until the end of the turn.                       |
| **Delegation**              | Once per turn, another of your agents can attack a second time.                                                                                |
| **Context**                 | +1 attack for every 2 cards in your discard pile (up to +3).                                                                                   |
| **Guardrails**              | Your AI components are immune to Hallucination and Prompt injection.                                                                           |
| **Asynchronous**            | Your AI components are immune to Timeout and Agent loop.                                                                                       |
| **Semantic cache**          | Your first AI spell each turn costs nothing.                                                                                                   |
| **Multi-model routing**     | Once per turn, return one of your AI components to your hand and deploy, for free, an AI component from your hand with an equal or lower cost. |

"Agent" means the AI components that have the Autonomous ability.

### Set 2 abilities (designed, not playable yet)

Decided in [ADR 0052](../decisions/0052-set-2-familles-ddd-microservices-devops.md); cards in
[cartes-set-2.md](cartes-set-2.md).

| Ability                    | Effect                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Bounded**                | Takes no collateral damage: only attacks it takes part in and effects that target it alone can damage it.      |
| **Independent deployment** | Can attack on the turn it is deployed.                                                                         |
| **Pipeline**               | The first component (or evolution) you deploy each turn costs 1 less, minimum 1. Several Pipelines do not add. |

**Collateral damage**: damage a card takes without being chosen alone — an effect that hits several components at once
(Splitter, Cascading failure), the extra damage of Broadcast, or damage passed on from another card (Tight coupling,
Big Ball of Mud, Single point of failure). Counter-attacks and Reactive belong to the attack: a Bounded card takes
them.

## The bot

Four levels, from simplest to strongest: **Intern** (easy: it plays like a beginner), **Nightly Batch** (medium),
**ESB Architect** (hard) and the boss **Autonomous Agent** (expert). An **EDA Architect** level remains possible. A
"bot against bot" mode to watch, which also serves to balance the cards ([cartes-set-1.md](cartes-set-1.md)).

## Score and leaderboard (US-069)

Decision: [ADR 0044](../decisions/0044-score-et-cote-de-duel.md). Only the server counts points; nothing is ever reset.

- **Points** (the score, which orders the leaderboard):

  | Game won                         | Points |
  | -------------------------------- | ------ |
  | Against the Intern bot           | 1      |
  | Against the Nightly Batch bot    | 2      |
  | Against the ESB Architect bot    | 3      |
  | Against the Autonomous Agent bot | 5      |
  | Duel won                         | 5      |
  | Duel drawn (for each)            | 2      |

  A defeat, or a draw against the bot, earns nothing; neither does the guided game. At most **10 wins count per day**
  (UTC day, bot and duels combined): beyond that, a win earns no more points until the next day. A duel won by
  concession or by forfeit counts as a win.

- **Duel rating**, Elo-style: everyone starts at **1000**; after each duel, the winner takes from the loser between 0
  and 32 rating points, more the less expected their win was (16 between two equal ratings); a draw brings the two
  ratings closer. A duel against a deleted account does not change the rating.
- **Leaderboard**: ranked players with at least one point, by decreasing points; two equal scores share the same rank.
  Everyone appears there by default, under their username, and can withdraw: their score keeps counting, and only they
  see it.
- **History**: when the score went live, the duels already finished were recounted (points and rating), and past wins
  against the bot were counted 1 point each (their level was no longer known), cap included.
