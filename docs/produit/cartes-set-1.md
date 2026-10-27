# Set 1 — "From FTP to agents" (draft)

Working draft: statistics are **provisional**, to be balanced through "bot against bot" simulations. The playable
version is described in versioned data in `packages/domain/src/set-1.ts` (US-008, ADR 0011), which is authoritative.
Rules and abilities: [regles.md](regles.md).

**Balancing guideline**: a common component with no ability is worth about `attack + HP = 2 × cost + 1`; each
ability takes away 1 to 2 points.

**Composition**: 74 cards — 4 legendary, 7 epic, 27 rare, 36 common (64 in the tables, plus 7 additional incidents,
plus the 3 cards of the US-077 extension).

## Files & Batch (8)

| No. | Card             | Type      | Rarity    | Cost | Att/HP | Abilities / effect                                                                                          | In real life                                                              |
| --- | ---------------- | --------- | --------- | ---- | ------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | FTP              | Component | Legendary | 3    | 5/4    | Batch, Veteran, Non-compliant                                                                               | Officially banned. Unofficially…                                          |
| 2   | SFTP             | Component | Rare      | 3    | 3/4    | Migration                                                                                                   | File transfer encrypted over SSH, gradually giving way to APIs and events |
| 3   | EDI              | Component | Rare      | 4    | 5/5    | Batch                                                                                                       | Standardised document exchange between partners                           |
| 4   | CSV file         | Component | Common    | 1    | 2/1    | —                                                                                                           | The universal format. Separator may vary.                                 |
| 5   | Fixed-width file | Component | Common    | 2    | 2/3    | —                                                                                                           | "The amount is in columns 47 to 52."                                      |
| 6   | Cron             | Component | Common    | 2    | 1/3    | At the start of your turn, one of your Batch components can attack even if it attacked on the previous turn | The scheduler behind the nightly jobs                                     |
| 7   | Drop folder      | Component | Common    | 2    | 1/4    | Guard                                                                                                       | Where files wait to be processed                                          |
| 8   | `.ok` flag file  | Component | Common    | 1    | 1/2    | Your cards are immune to Empty file at 3 a.m.                                                               | Proves the file is complete                                               |

## Messaging & ESB (9)

| No. | Card                                | Type      | Rarity | Cost | Att/HP | Abilities / effect                        | In real life                                          |
| --- | ----------------------------------- | --------- | ------ | ---- | ------ | ----------------------------------------- | ----------------------------------------------------- |
| 9   | webMethods Integration Server 10.15 | Component | Epic   | 5    | 4/7    | Hub, Single point of failure, On-premises | the company's long-standing ESB, hosted on-premises          |
| 10  | Universal Messaging                 | Component | Rare   | 3    | 2/4    | Durable queue                             | The messaging layer of webMethods                     |
| 11  | MWS – My webMethods Server          | Component | Rare   | 3    | 1/4    | Monitoring                                | Administration and monitoring. "The page is loading…" |
| 12  | MQSeries                            | Component | Rare   | 3    | 3/4    | Durable queue                             | The ancestor of message queues                        |
| 13  | SAP Adapter                         | Component | Rare   | 4    | 3/5    | Guard                                     | The one and only way through to the ERP               |
| 14  | webMethods Designer                 | Component | Common | 2    | 1/2    | When deployed, draw a Patterns card       | The workshop where webMethods flows are built         |
| 15  | Flow service                        | Component | Common | 1    | 1/2    | —                                         | The processing unit of webMethods                     |
| 16  | JDBC Adapter                        | Component | Common | 2    | 2/3    | —                                         | Reading from and writing to the database              |
| 17  | SOAP / WSDL                         | Component | Common | 3    | 3/4    | —                                         | The web service from before REST                      |

## API (8)

| No. | Card               | Type      | Rarity | Cost | Att/HP | Abilities / effect                                        | In real life                      |
| --- | ------------------ | --------- | ------ | ---- | ------ | --------------------------------------------------------- | --------------------------------- |
| 18  | Apigee API Gateway | Component | Epic   | 4    | 2/7    | Guard, Quotas                                             | the company's API gateway                |
| 19  | Apigee API Hub     | Component | Rare   | 2    | 1/3    | When deployed, draw an API or Agentic AI card             | The API catalogue                 |
| 20  | OAuth2             | Component | Rare   | 2    | 1/3    | Your API components are immune to Expired certificate     | Delegated authorisation, by token |
| 21  | Rate limiting      | Spell     | Rare   | 1    | —      | An opposing component cannot attack on its next turn      | Capping the number of calls       |
| 22  | REST API           | Component | Common | 2    | 3/2    | —                                                         | Resources, HTTP verbs and JSON    |
| 23  | OpenAPI            | Component | Common | 1    | 1/2    | When deployed, one of your API components gains +1 attack | The contract of a REST API        |
| 24  | Developer portal   | Component | Common | 3    | 2/3    | Connector (1)                                             | Where consumers subscribe         |
| 25  | Webhook            | Component | Common | 2    | 2/3    | —                                                         | The API that calls you back       |

## iPaaS (5)

| No. | Card              | Type                                             | Rarity    | Cost | Att/HP | Abilities / effect                 | In real life                                          |
| --- | ----------------- | ------------------------------------------------ | --------- | ---- | ------ | ---------------------------------- | ----------------------------------------------------- |
| 26  | webMethods.io     | Evolution of webMethods Integration Server 10.15 | Legendary | 5    | 5/7    | Hub, Connector (2)                 | Integration as an iPaaS, with no server to look after |
| 27  | ERP connector     | Component                                        | Rare      | 3    | 2/4    | Connector (1)                      | A ready-made connector                                |
| 28  | SaaS connector    | Component                                        | Common    | 2    | 2/2    | Connector (1)                      | Plug in a cloud application in minutes                |
| 29  | Low-code workflow | Component                                        | Common    | 2    | 2/3    | —                                  | A flow drawn rather than coded                        |
| 30  | Data mapping      | Spell                                            | Common    | 1    | —      | One of your components gains +1 HP | Turning one format into another                       |

## Event-driven (EDA) (8)

| No. | Card                | Type      | Rarity | Cost | Att/HP | Abilities / effect                                                     | In real life                            |
| --- | ------------------- | --------- | ------ | ---- | ------ | ---------------------------------------------------------------------- | --------------------------------------- |
| 31  | Solace Event Mesh   | Component | Epic   | 5    | 3/6    | Broadcast                                                              | the company's event mesh                       |
| 32  | Solace Event Portal | Component | Rare   | 2    | 1/3    | When deployed, draw an EDA card                                        | The event catalogue                     |
| 33  | Event broker        | Component | Rare   | 4    | 3/5    | Reactive                                                               | Receives, stores and distributes events |
| 34  | CDC                 | Component | Rare   | 3    | 2/3    | When deployed, draw one card for each Files component you have in play | Capturing the changes of a database     |
| 35  | Pub/Sub             | Component | Common | 3    | 2/3    | Broadcast                                                              | One publisher, many subscribers         |
| 36  | Topic               | Component | Common | 1    | 1/2    | Reactive                                                               | The hierarchical address of an event    |
| 37  | Queue               | Component | Common | 2    | 1/4    | Durable queue                                                          | Keeps messages until they are consumed  |
| 38  | AsyncAPI            | Component | Common | 1    | 0/2    | When deployed, one of your EDA components gains +1 attack              | The contract of an event-driven API     |

## Agentic AI (14)

| No. | Card                     | Type                            | Rarity    | Cost | Att/HP | Abilities / effect                                                              | In real life                                      |
| --- | ------------------------ | ------------------------------- | --------- | ---- | ------ | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| 39  | Solace Agent Mesh        | Evolution of Solace Event Mesh  | Legendary | 6    | 4/7    | Broadcast, Orchestration, Asynchronous; your agents gain Delegation and Tooling | The agents plugged into the event mesh (A2A, MCP) |
| 40  | Apigee AI Gateway        | Evolution of Apigee API Gateway | Legendary | 5    | 3/8    | Guard, Quotas, Guardrails, Semantic cache, Multi-model routing                  | the company's upcoming AI gateway                        |
| 41  | LLM                      | Component                       | Epic      | 5    | 6/4    | —                                                                               | The large language model                          |
| 42  | Agent                    | Component                       | Rare      | 4    | 4/3    | Autonomous                                                                      | An LLM that acts with tools                       |
| 43  | Multi-agent orchestrator | Component                       | Rare      | 5    | 3/5    | Orchestration                                                                   | Shares the work out between agents                |
| 44  | MCP server               | Component                       | Rare      | 3    | 2/3    | Tooling                                                                         | Exposes tools and data to AI models               |
| 45  | Agent Card (A2A)         | Component                       | Rare      | 3    | 2/3    | Delegation                                                                      | One agent introduces itself to another            |
| 46  | RAG                      | Component                       | Rare      | 3    | 2/3    | Context                                                                         | Searching before answering                        |
| 47  | Chain of thought         | Spell                           | Rare      | 2    | —      | Draw 2 cards                                                                    | Reasoning step by step                            |
| 48  | Human-in-the-loop        | Spell                           | Rare      | 2    | —      | The next incident played against you has no effect                              | A human signs off before acting                   |
| 49  | Vector database          | Component                       | Common    | 2    | 1/4    | Your agents have +1 HP                                                          | Finding texts by their meaning                    |
| 50  | Context window           | Component                       | Common    | 2    | 0/5    | Guard                                                                           | What the model can read in one go                 |
| 51  | System prompt            | Spell                           | Common    | 2    | —      | One of your agents gains +2 attack                                              | The standing instructions given to the model      |
| 52  | Few-shot                 | Spell                           | Common    | 1    | —      | One of your AI components gains +1 attack and +1 HP                             | Learning from examples                            |

## Patterns (6)

| No. | Card                 | Type  | Rarity | Cost | Abilities / effect                                                        | In real life                                           |
| --- | -------------------- | ----- | ------ | ---- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| 53  | Dead Letter Queue    | Spell | Epic   | 3    | Return a component from your discard pile to play with 1 HP               | The queue where failed messages wait to be replayed    |
| 54  | Circuit Breaker      | Spell | Rare   | 2    | Your System loses no SLA until your next turn                             | Cutting off calls to a failing service                 |
| 55  | Content-Based Router | Spell | Common | 1    | Deal 2 damage to the opposing component of your choice                    | Routing a message according to its content             |
| 56  | Splitter             | Spell | Common | 2    | Deal 1 damage to each opposing component                                  | Cutting one message into several                       |
| 57  | Idempotent Consumer  | Spell | Common | 1    | Cancel Duplicate; otherwise, draw a card                                  | Receiving the same message twice, with no side effects |
| 58  | Retry                | Spell | Common | 1    | One of your components that has attacked can attack again, and loses 1 HP | Trying again, in moderation                            |

## Bestiary (6, plus 7 incidents to be numbered)

| No. | Card                | Type     | Rarity | Cost | Effect                                                                                                       |
| --- | ------------------- | -------- | ------ | ---- | ------------------------------------------------------------------------------------------------------------ |
| 59  | Prompt injection    | Incident | Epic   | 4    | **AI** — An opposing agent immediately attacks a target of your choice on its own side (component or System) |
| 60  | Plain-text password | Incident | Rare   | 2    | Target an opposing Files component: destroyed if it is FTP, otherwise it takes 2 damage                      |
| 61  | Expired certificate | Incident | Rare   | 2    | An opposing API component loses its abilities and cannot attack on its next turn                             |
| 62  | Tight coupling      | Incident | Rare   | 3    | Link two opposing components: when one takes damage, so does the other                                       |
| 63  | Hallucination       | Incident | Rare   | 2    | **AI** — An opposing AI component attacks a random target, on either side                                    |
| 64  | Poison message      | Incident | Common | 2    | Destroy an opposing component costing 2 or less                                                              |

Additional common incidents, numbered 65 to 71 in the data (US-008):
**Timeout** (1 — an opposing component cannot attack on its next turn), **Duplicate** (1 — the next damage taken by an
opposing component is doubled), **Empty file at 3 a.m.** (1 — the next attack by an opposing Batch component deals
nothing), **Broken encoding** (1 — 2 damage to a Files or ESB component), and the AI incidents
**Context overflow** (1 — an opposing AI component loses its abilities until the end of its next turn),
**Agent loop** (2 — one or two opposing agents cannot attack on their next turn) and **Token bill**
(1 — the opponent has 2 less Throughput on their next turn).

## Extension: API First, EDA and GraphQL API (US-077, 2026-10-25)

Three cards requested by the project owner, added to set 1 rather than opening a set 2: they belong to the API and
Event-driven families of set 1, whereas set 2 (EPIC-13, US-076) will cover DDD, microservices and DevOps. They take
numbers 72 to 74, in sequence, without renumbering (ADR 0011). The two "ways of designing" are spells, the technology
is a component; no new ability.

| No. | Card        | Family       | Type      | Rarity | Cost | Att/HP | Abilities / effect                                                                           | In real life                                                      |
| --- | ----------- | ------------ | --------- | ------ | ---- | ------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 72  | API First   | API          | Spell     | Rare   | 3    | —      | Draw the first two API cards from your deck, then one of your API components gains +1 attack | The contract before the code, provider and consumers in parallel  |
| 73  | EDA         | Event-driven | Spell     | Epic   | 3    | —      | Each of your EDA components deals 1 damage to a random opposing component                    | A fact is published, each subscriber reacts to it without waiting |
| 74  | GraphQL API | API          | Component | Rare   | 4    | 2/3    | When deployed, draw one card for each other component you have in play (2 at most)           | One query, exactly the fields wanted, several sources             |

**Balancing.** The loaned decks do not change. To measure each card, the Modern deck gets two copies of it (in place of
Low-code workflow and one Queue for API First, the two SaaS connectors for GraphQL, the two Topics for EDA), then faces
the three loaned decks: 400 games per duel, Nightly Batch on both sides, seed 1 then seed 2. Benchmarks: the same
replacements with two Chain of thought or two Splitter.

| Deck A                      | against Legacy | against Modern | against Hybrid |
| --------------------------- | -------------- | -------------- | -------------- |
| Modern (unchanged)          | 46% / 47%      | 49% / 49%      | 48% / 44%      |
| + API First × 2             | 46% / 43%      | 50% / 49%      | 47% / 46%      |
| + GraphQL API × 2           | 46% / 46%      | 55% / 54%      | 48% / 46%      |
| + EDA × 2                   | 47% / 40%      | 59% / 56%      | 48% / 46%      |
| + one of each               | 54% / 51%      | 55% / 55%      | 49% / 50%      |
| Benchmark: Chain of thought | 51% / 52%      | 53% / 57%      | 52% / 51%      |
| Benchmark: Splitter         | 52% / 46%      | 62% / 56%      | 48% / 48%      |

Adjustments made along the way: API First at 2 Throughput and a single API card drawn stayed below Modern (44 to 48%);
with two cards at 2 Throughput, it went above (53 to 59%), hence the cost of 3. GraphQL API at first counted only API
components: few in a deck, it brought Modern down to 37–41%. EDA is still a little strong in the Modern mirror
(56–59%), without exceeding Splitter. All measurements stay between 40 and 59%.

### GraphQL API goes up to 4 Throughput (US-085, 2026-10-27)

The US-029 measurement (`npm run simuler:carte -- 74`) puts the card in **each** loaned deck, rather than in Modern
alone: at 3 Throughput, Legacy gained 13 to 18 points against each of the three decks. Two causes added up, untangled
with control runs (400 games per duel, Nightly Batch on both sides; wins against Legacy / Modern / Hybrid):

| Deck and replacement (seed 1, unless stated)        | Wins          | Gap to unchanged |
| --------------------------------------------------- | ------------- | ---------------- |
| Legacy unchanged                                    | 48 / 51 / 49% | —                |
| Legacy, GraphQL API (3) for Universal Messaging+MWS | 65 / 69 / 66% | +16 to +18       |
| Legacy, SOAP / WSDL (3/4 no effect) for the same    | 58 / 62 / 56% | +7 to +11        |
| Legacy, GraphQL API (3) for two MQSeries            | 56 / 58 / 50% | +1 to +8         |
| Modern unchanged                                    | 46 / 49 / 48% | —                |
| Modern, GraphQL API (3) for two Pub/Sub             | 64 / 68 / 68% | +18 to +20       |
| Modern, Webhook (2/3 no effect) for two Pub/Sub     | 45 / 50 / 46% | −2 to +1         |
| Modern, same with seed 2 (unchanged: 47 / 49 / 44%) | 42 / 48 / 47% | −5 to +3         |

- **The tool** picks, at equal cost, the first cards of the deck: in Legacy, Universal Messaging and MWS, two unique,
  weak copies (Monitoring is of no use to the bot). Even a common 3/4 with no effect gains 7 to 11 points there.
  Breaking the tie in favour of a pair from the deck (two MQSeries) calmed Legacy down but moved the problem: Modern
  then lost its two Pub/Sub and gained 18 to 20 points, and the API First and EDA measurements moved too (up to −12
  points). The tool's rule therefore stays that of US-029.
- **The card**: with an equal body (Webhook, 2/3 with no effect, in place of the same Pub/Sub), Modern does not move;
  with GraphQL API, it gains 18 to 20 points. Drawing two cards is worth more on its own than the tolerated gap.

Adjustments tried with the tool's rule (seed 1, Legacy's gap against the three decks): 1/3 at 3 Throughput, +10 to
+14; 2/2 at 3 Throughput, +13 to +15; a single card drawn, +13 to +14; **4 Throughput, 2/3, two cards at most: −2 to
+3**. The card goes up to 4 Throughput, with no other change. `npm run simuler:carte -- 74` over two seeds:

| Deck with the card | against Legacy     | against Modern     | against Hybrid     |
| ------------------ | ------------------ | ------------------ | ------------------ |
| Legacy             | 48 → 50 / 50 → 47% | 51 → 49 / 53 → 52% | 49 → 52 / 47 → 47% |
| Modern             | 46 → 49 / 47 → 45% | 49 → 48 / 49 → 45% | 48 → 44 / 44 → 43% |
| Hybrid             | 51 → 49 / 50 → 45% | 55 → 52 / 51 → 48% | 49 → 45 / 50 → 48% |

No gap of 10 points or more (from −6 to +3). Benchmarks at 4 Throughput: in place of two Pub/Sub (cost 3), Modern
still rises to 57–63% (seed 1) and 57–59% (seed 2), i.e. 4 to 6 points above two SOAP / WSDL, common 3/4s at 3
Throughput; in place of two SaaS connectors (US-077 measurement), 45 / 49 / 46% then 41 / 49 / 38%. The loaned decks
do not contain the card: `npm run simuler` is unchanged (45 to 54% wins).

## Points to settle during balancing

- **FTP** is perhaps too strong for a legendary at 3 Throughput despite Non-compliant: simulations to be run.
- **Autonomous** cards without Orchestration are unpredictable: check that they remain fun to play.

## Balancing the loaned decks (US-011, 2026-10-18)

`npm run simuler -- 400 1`: 400 games per duel, "Nightly Batch" bot on both sides, alternating seats. Results
confirmed with seed 1000 (gaps of 1 to 5 points).

| Deck A | Deck B | A wins | B wins | Draws | Ended by SLA | Average turns |
| ------ | ------ | ------ | ------ | ----- | ------------ | ------------- |
| Legacy | Legacy | 52%    | 47%    | 2%    | 69%          | 17.2          |
| Legacy | Modern | 46%    | 53%    | 2%    | 64%          | 17.7          |
| Legacy | Hybrid | 47%    | 52%    | 1%    | 68%          | 17.2          |
| Modern | Modern | 48%    | 51%    | 1%    | 59%          | 17.9          |
| Modern | Hybrid | 44%    | 53%    | 3%    | 62%          | 17.6          |
| Hybrid | Hybrid | 48%    | 51%    | 2%    | 69%          | 17.2          |

**Before rebalancing** (first version of the decks, 200 games per duel): Modern won 64% against Legacy and 82% against
Hybrid.

**Diagnosis**, by the win rate of the side that deploys each card (600 games): the cheap cards that draw (Developer
portal 78%, ERP connector 77%, Webhook 76%) and the Event broker (75%) gave Modern the advantage; Hybrid's dead cards
weighed it down (Context window 28%, no attack; CSV file 33%; LLM 33%, expensive and fragile against the counter-attack).

**Rebalancing** (deck composition only, no card statistic changed):

- Modern: Apigee API Gateway 2 → 1, Event broker 2 → 1, Low-code workflow 1 → 2, Queue 1 → 2.
- Hybrid: LLM 2 → 1, Context window 2 → 0, and the addition of one SAP Adapter, one MQSeries and one Webhook.

**Reading**: all duels stay between 42 and 57%; the mirrors are close to 50/50, so the first player's advantage is
small. 60 to 74% of games end with an SLA at 0, around turn 17 out of 20. Legacy is now the weakest deck, by a small
margin (42 to 47%): to be watched.

### Update of 2026-10-18: spells and incidents (US-014)

Spells and incidents are playable. Each loaned deck includes a few from its own universe:

- **Legacy**: Dead Letter Queue, Retry, Poison message (in place of a CSV file, a Fixed-width file and the Flow
  service; one more MQSeries);
- **Modern**: Content-Based Router, Poison message (in place of a Low-code workflow and a Queue);
- **Hybrid**: Chain of thought, Tight coupling, Duplicate, Token bill (in place of a CSV file, a Topic, the JDBC
  Adapter and the Queue).

`npm run simuler -- 400 1` (seed 1000 in brackets when it differs by more than 2 points):

| Deck A | Deck B | A wins    | B wins    | Draws | Ended by SLA | Average turns |
| ------ | ------ | --------- | --------- | ----- | ------------ | ------------- |
| Legacy | Legacy | 50%       | 48%       | 2%    | 75%          | 16.6          |
| Legacy | Modern | 53%       | 46%       | 2%    | 69% (65%)    | 17.4          |
| Legacy | Hybrid | 55%       | 43% (45%) | 2%    | 70% (74%)    | 17.1          |
| Modern | Modern | 52%       | 47%       | 1%    | 58% (51%)    | 18.1          |
| Modern | Hybrid | 51% (47%) | 48% (51%) | 2%    | 58%          | 17.7          |
| Hybrid | Hybrid | 52%       | 47%       | 2%    | 64%          | 17.1          |

A first composition (immobilising spells and Circuit Breaker for Modern, Splitter for Legacy) brought Modern back
down to 31–38%: destruction spells weigh more than those that immobilise. All duels stay between 43 and 55%.

### Update of 2026-10-18: the 71 playable cards (US-020)

With the AI and Migration abilities, all cards are playable, and the loaned decks benefit:

- **Modern**: Apigee AI Gateway and Solace Agent Mesh (the evolutions of its two flagship cards), in place of the
  Content-Based Router and the Poison message;
- **Hybrid**: SFTP, Agent, RAG and MCP server, in place of the JDBC Adapter, SOAP / WSDL, Tight coupling and
  Duplicate (one CSV file and one Topic fewer, one REST API more);
- **Legacy**: unchanged.

A first version (SFTP in Legacy, AI evolutions in place of Modern's components) gave Legacy 58 to 66% against Modern:
evolutions stay dead as long as the card they come from is not in play.

`npm run simuler -- 400 1` (seed 1000 in brackets when it differs by more than 2 points):

| Deck A | Deck B | A wins    | B wins    | Draws | Ended by SLA | Average turns |
| ------ | ------ | --------- | --------- | ----- | ------------ | ------------- |
| Legacy | Legacy | 50%       | 48%       | 2%    | 75%          | 16.6          |
| Legacy | Modern | 51%       | 49%       | 1%    | 70%          | 17.3          |
| Legacy | Hybrid | 50% (56%) | 48% (44%) | 3%    | 76%          | 16.7          |
| Modern | Modern | 48%       | 50%       | 2%    | 61%          | 17.9          |
| Modern | Hybrid | 46% (45%) | 52% (54%) | 2%    | 67%          | 17.4          |
| Hybrid | Hybrid | 49% (55%) | 50% (43%) | 2%    | 66%          | 17.2          |

All duels between different decks stay between 44 and 56%.

## Bot levels (US-021, 2026-10-18)

`npm run simuler -- 100 101`: 100 games per loaned deck and per duel (300 in total), the same deck on both sides so as
to measure only the play.

| Level A       | Level B          | A wins | B wins | Draws |
| ------------- | ---------------- | ------ | ------ | ----- |
| Nightly Batch | ESB Architect    | 45%    | 55%    | 0%    |
| Nightly Batch | Autonomous Agent | 36%    | 63%    | 1%    |
| ESB Architect | Autonomous Agent | 42%    | 58%    | 0%    |

The gaps stay modest: the draw of the cards weighs heavily in a 20-turn game. A deeper search, or one that simulates
the opponent's turn, turned out weaker (see the US-021 story).

## A beatable bot and a fair game (US-064, 2026-10-22)

Two findings: no level was really easy, and going first gave a big advantage. Three changes: the second player gets
**1 more Throughput on their first turn** ([ADR 0026](../decisions/0026-debit-du-second-joueur.md)), an easy level,
**Intern**, goes ahead of the other three (Nightly Batch becomes medium, ESB Architect hard, Autonomous Agent expert),
and ESB Architect looks at **4 candidate actions instead of 3** (see the US-064 story).

`npm run simuler -- 200 1` (seed 1001 in brackets when it differs by more than 2 points). The last two measurements
cross the loaned decks: 200 games for each of the 9 pairs of decks, i.e. 1,800 games per row. The **beginner profile**
plays like someone discovering the game: it deploys its most expensive card whenever it can, attacks the System as
soon as it can (otherwise the first allowed target), with no spell, incident or decommissioning. "Before": the same
measurements on the engine without the rule, with the US-021 levels (seed 1).

**First and second player**, each player against itself (draws make up the rest):

| Players          | Before: first | Before: second | After: first | After: second |
| ---------------- | ------------- | -------------- | ------------ | ------------- |
| Beginner profile | 73%           | 27%            | 54%          | 46%           |
| Intern           | —             | —              | 53%          | 48%           |
| Nightly Batch    | 63%           | 36%            | 52%          | 46%           |
| ESB Architect    | 66%           | 33%            | 54%          | 46%           |
| Autonomous Agent | 62%           | 38%            | 49%          | 51%           |

**A player's wins against each level**, overall, when going first and when going second. Before:

| Bot level (as it was)   | Beginner | going first | going second | "Nightly Batch" player | going first | going second |
| ----------------------- | -------- | ----------- | ------------ | ---------------------- | ----------- | ------------ |
| Nightly Batch (easy)    | 14%      | 21%         | 7%           | 50%                    | 63%         | 36%          |
| ESB Architect (medium)  | 13%      | 19%         | 7%           | 46%                    | 61%         | 31%          |
| Autonomous Agent (hard) | 4%       | 6%          | 1%           | 39%                    | 51%         | 25%          |

After:

| Bot level                 | Beginner | going first | going second | "Nightly Batch" player | going first | going second |
| ------------------------- | -------- | ----------- | ------------ | ---------------------- | ----------- | ------------ |
| Intern (easy)             | 56%      | 59%         | 53%          | 90%                    | 91%         | 89%          |
| Nightly Batch (medium)    | 14%      | 16%         | 12%          | 50%                    | 53% (50%)   | 46%          |
| ESB Architect (hard)      | 8%       | 9%          | 7%           | 44% (40%)              | 49% (42%)   | 40%          |
| Autonomous Agent (expert) | 4%       | 5%          | 2%           | 39% (36%)              | 42% (37%)   | 36%          |

**Levels two by two**, the same deck on both sides (600 games per row):

| Level A       | Level B          | A wins    | B wins    | Draws |
| ------------- | ---------------- | --------- | --------- | ----- |
| Intern        | Nightly Batch    | 9%        | 91%       | 0%    |
| Intern        | ESB Architect    | 8%        | 92%       | 0%    |
| Intern        | Autonomous Agent | 3%        | 97%       | 0%    |
| Nightly Batch | ESB Architect    | 40%       | 59%       | 1%    |
| Nightly Batch | Autonomous Agent | 37%       | 63%       | 1%    |
| ESB Architect | Autonomous Agent | 43% (47%) | 57% (53%) | 0%    |

**Loaned decks** with the rule (Nightly Batch on both sides, 200 games per duel):

| Deck A | Deck B | A wins    | B wins    | Draws | Ended by SLA | Average turns |
| ------ | ------ | --------- | --------- | ----- | ------------ | ------------- |
| Legacy | Legacy | 50%       | 48%       | 2%    | 72% (76%)    | 17.2          |
| Legacy | Modern | 52%       | 46%       | 3%    | 69%          | 17.5          |
| Legacy | Hybrid | 50%       | 49%       | 2%    | 74%          | 17.2          |
| Modern | Modern | 51% (54%) | 48%       | 2%    | 54%          | 18.3          |
| Modern | Hybrid | 54% (46%) | 45% (52%) | 2%    | 64%          | 17.7          |
| Hybrid | Hybrid | 54% (48%) | 45% (52%) | 2%    | 70%          | 17.4          |

**Reading**:

- The second player's Throughput brings the first player's advantage down from 62–73% to 49–54% of games, at every
  level. Against Nightly Batch, a beginner going second goes from 7 to 12% wins, a player of the same level from 36 to
  46%.
- The Intern leaves 54 to 56% wins to a beginner (more than half, going first or second) and 90% to a player at the
  Nightly Batch level. It loses at least 90% of its games against each of the other levels.
- The level ladder holds: each level beats the previous one, 53 to 91% of the time. Autonomous Agent now beats ESB
  Architect only 53 to 57% of the time, against 57 to 60% when ESB looked at only 3 candidate actions.
- The decks stay balanced: all duels between 45 and 55%, at both seeds.

## A player who follows the advice (US-066, 2026-10-24)

The advice follows the Nightly Batch rules (ADR 0040). Wins of a player who always follows it, loaned decks crossed,
450 games per measurement (seed 1, and seed 2 in brackets):

| Bot level     | Wins      | going first | going second |
| ------------- | --------- | ----------- | ------------ |
| Intern        | 89% (90%) | 91% (90%)   | 88% (90%)    |
| Nightly Batch | 47% (51%) | 51% (50%)   | 44% (52%)    |

The EPIC-11 targets are met: at least 85% against Intern and 45% against Nightly Batch. The advice is computed in under
a millisecond.
