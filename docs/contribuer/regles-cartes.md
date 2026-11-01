# Designing a HIPMaster card

This guide is for architects and tech leads who want to propose a card: a technology, a pattern or an incident you have
lived through, with a short text that explains what it means in an information system. You only need to know what you
want to tell: no need to read the game's code. The process (fork, prompts for your AI, pull request) is described in
[CONTRIBUTING.md](../../CONTRIBUTING.md); the decision behind it is ADR
[0050](../decisions/0050-cartes-communaute-par-pull-request.md).

To play before proposing: the game in English at <https://hipmaster.web.app/en/> (on invitation), with its card
catalogue and a guided first game.

## What makes a good card

- **It teaches something true.** Reading the card, a player understands what the technology is, or why the incident
  happens. Its mechanics tell the same story as its text: a batch is slow but strong, an API gateway protects the
  System, an agent acts on its own.
- **It is playable.** Neither a must-have nor useless: it finds its place in a deck without crushing the cards of the
  same cost.
- **It is new.** It does not duplicate an existing card: check the catalogue in the game, or, without an invitation,
  the tables of [cartes-set-1.md](../produit/cartes-set-1.md) and the code of the cards,
  `packages/domain/src/set-1.ts` (French names and effects; the English ones are in
  `packages/domain/src/langues/en/cartes.ts`).

## The parts of a card

### Family

Eight families: six eras of integration, then two cross-cutting families. The code is what goes into the game files.

| Family             | Code        | Examples                                  | Typical mechanics             |
| ------------------ | ----------- | ----------------------------------------- | ----------------------------- |
| Files & Batch      | `fichiers`  | FTP, SFTP, CSV, EDI, cron                 | Batch: slow but strong        |
| Messaging & ESB    | `esb`       | webMethods Integration Server, JMS        | Hub: bonus, single point      |
| API                | `api`       | Apigee, REST, OpenAPI, OAuth2, GraphQL    | Guard: protects the System    |
| iPaaS              | `ipaas`     | webMethods.io, SaaS connectors, low-code  | Connector: draws cards        |
| Event-driven (EDA) | `eda`       | Solace Event Mesh, topic, queue, CDC      | Broadcast: several targets    |
| Agentic AI         | `ia`        | LLM, MCP, A2A, Solace Agent Mesh          | Autonomous: acts on its own   |
| Patterns           | `patterns`  | Router, Splitter, Circuit Breaker, DLQ    | spells                        |
| Bestiary           | `bestiaire` | Poison message, Timeout, Prompt injection | incidents, and a few monsters |

### Type

- **Component**: deployed on the board (5 slots), with attack and HP; it can attack from the following turn. The type
  of a technology.
- **Evolution**: deployed **in place of** a specific component (its modernised form), at full HP. Rare: it needs a
  clear lineage (Apigee API Gateway → Apigee AI Gateway).
- **Spell**: immediate effect, then discarded. The type of a practice, a pattern, a way of designing.
- **Incident**: effect against the opponent, then discarded. The type of an outage or a risk (Bestiary). An incident
  is either an **AI incident** (it only targets AI components, and Veteran is immune to it) or not: say which in your
  proposal (`ia: true` or `false` in the code).

### Rarity

| Rarity    | In a booster | Aim for it with…                                         |
| --------- | ------------ | -------------------------------------------------------- |
| Common    | 70 %         | a basic building block, simple, with one ability at most |
| Rare      | 22 %         | a technology or pattern with real mechanics              |
| Epic      | 7 %          | a centrepiece that changes a game                        |
| Legendary | 1 %          | a mythical card; one per deck (avoid at first)           |

The reviewer may adjust the rarity: most proposals end up common or rare.

### Stats

**Cost** is paid in Throughput (1 on the first turn, +1 per turn, 10 at most). **Attack** is dealt to the target,
**HP** are the component's hit points. Typical values measured on 2026-10-27 on the 74 cards of the catalogue
(minimum–maximum, average in brackets):

| Type and rarity     | Cards | Cost      | Attack    | HP        | Abilities |
| ------------------- | ----- | --------- | --------- | --------- | --------- |
| Common component    | 21    | 1–3 (1.9) | 0–3 (1.5) | 1–5 (2.8) | 0 or 1    |
| Rare component      | 18    | 2–5 (3.2) | 1–5 (2.3) | 3–5 (3.7) | 0 or 1    |
| Epic component      | 4     | 4–5 (4.8) | 2–6 (3.8) | 4–7 (6.0) | 0 to 3    |
| Legendary evolution | 3     | 5–6 (5.3) | 3–5 (4.0) | 7–8 (7.3) | 2 to 5    |
| Common spell        | 7     | 1–2 (1.3) | —         | —         | —         |
| Rare spell          | 5     | 1–3 (2.0) | —         | —         | —         |
| Epic spell          | 2     | 3         | —         | —         | —         |
| Common incident     | 8     | 1–2 (1.3) | —         | —         | —         |
| Rare incident       | 4     | 2–3 (2.3) | —         | —         | —         |

A simple benchmark for a component with no ability: attack + HP ≈ 2 × cost + 1. A strong ability or an effect costs 1
more, or a lower stat. Your numbers are only a starting point: balance is measured by simulation during the review.

### Abilities and effect

**Abilities** are keywords of the glossary, already programmed: Batch, Veteran, Non-compliant, On-premises, Hub,
Single point of failure, Guard, Quotas, Connector (N), Broadcast, Reactive, Durable queue, Monitoring, Migration,
Autonomous, Orchestration, Tooling, Delegation, Context, Guardrails, Asynchronous, Semantic cache, Multi-model routing.
The game's card details explain what each one does.

- A card has **none, one, rarely two**; pick the ones that tell the technology's story.
- **A card proposal never creates a new ability, nor a new game mechanic**: it would change the whole engine, so it
  becomes a separate piece of work for the project owner. If your idea needs one, say so in your proposal.

An **effect** is a sentence specific to the card, when no ability is enough; every spell and incident has one. It is
programmed in the engine along with the card: keep it **short, a single action** (draw, deal damage, give a bonus,
immobilise, return to hand) and close to existing effects. Examples: "Deal 2 damage to a component", "Draw the first
two API cards from your deck".

**The power of an effect** sets the cost of a spell or an incident. Compare yours with these cards of the catalogue,
then let the simulation decide (see [Balance](#balance)):

| Cost | Effect                                                                  | Card (rarity)                       |
| ---- | ----------------------------------------------------------------------- | ----------------------------------- |
| 1    | Deal 2 damage to the opposing component of your choice                  | Content-Based Router (common spell) |
| 1    | Deal 2 damage to an opposing Files or ESB component (a narrower target) | Broken encoding (common incident)   |
| 1    | Cancel Duplicate; otherwise, draw a card (a fallback when useless)      | Idempotent Consumer (common spell)  |
| 1    | Your opponent has 2 less Throughput on their next turn                  | Token bill (common incident)        |
| 2    | Deal 1 damage to each opposing component                                | Splitter (common spell)             |
| 2    | Draw 2 cards                                                            | Chain of thought (rare spell)       |
| 2    | Destroy an opposing component costing 2 or less                         | Poison message (common incident)    |
| 3    | Draw the first two API cards from your deck, then an API component +1   | API First (rare spell)              |
| 3    | Return a component from your discard pile to play with 1 HP             | Dead Letter Queue (epic spell)      |

An effect that only works against some decks (one family, one ability) is cheaper, but it may be dead in hand: give it
a modest fallback, like Idempotent Consumer.

### The "In real life" text

This is the heart of the card: what the technology **really** does, in one sentence of 110 characters at most,
readable by someone outside the trade. A touch of team humour is welcome if it stays accurate.

- Good: "A single endpoint: the client asks for exactly the fields it needs, in one query across several sources."
- Avoid: "Schema-typed API query language with resolvers." (accurate, but opaque to a non-specialist); "The best tech in
  the world." (teaches nothing).

### The "Learn more" sheet

Every card has a sheet, opened from its details (ADR [0036](../decisions/0036-fiches-pedagogiques-cartes.md)), that
takes less than a minute to read: accurate rather than playful.

| Field      | Content                                                     | Max length |
| ---------- | ----------------------------------------------------------- | ---------- |
| Definition | what it is, in one sentence                                 | 220 chars  |
| Use        | what it is for; for an incident, how it happens             | 360 chars  |
| Example    | a concrete case from the life of an integration team        | 360 chars  |
| Takeaway   | the pitfall to avoid or the good practice                   | 320 chars  |
| Links      | 1 to 3 `https` resources (Wikipedia, vendor docs, standard) | —          |

The game is bilingual and French is its reference language: write your
proposal in English, and your AI writes the card and its sheet in French and in English. The project owner reviews the
French version.

## Content rules

**The repository is public, and a pull request is public as soon as it is opened**, before any review. So check
yourself, before opening it, that the card, its sheet and its illustration contain none of the following.

- **Nothing confidential**: no server, environment or machine name; no address, internal URL or internal domain name;
  no identifiable customer, partner or supplier; no unpatched vulnerability; no volumes, dated incident or internal
  figure; no colleague's name. Names of products on the market and their public versions are fine
  (ADR [0022](../decisions/0022-depot-public.md)).
- **Tell an incident in general terms**: "a certificate expires on a Friday evening" rather than the real incident of
  a given application.
- **No brand bashing**: you may say a technology is ageing or costly, not that a vendor is bad. Real product names are
  allowed, never their logos.
- **A kind tone**: humour targets situations, never people or teams.
- **Text that a non-specialist understands**, with no unexplained acronym.
- **Nothing about you in the prompts given to your AI** beyond the proposal itself.

## Proposal template

Fill it in first, then give it to your AI and paste it into the pull request description.

```markdown
- Card name:
- Family: (fichiers, esb, api, ipaas, eda, ia, patterns, bestiaire)
- Type: (component, evolution of …, spell, incident; for an incident, AI incident or not)
- Target rarity: (common, rare, epic, legendary)
- Cost / Attack / HP: (attack and HP for a component or an evolution only)
- Abilities: (glossary keywords, or none)
- Effect: (one sentence, or none)
- In real life: (one sentence, 110 characters at most)
- "Learn more" sheet: definition, use, example, takeaway, 1 to 3 links
- Illustration idea: (the creature, its pose, its setting; not one already taken, see
  docs/produit/prompts-illustrations-gemini.md)
- Sources: (where to check what the card says)
- Displayed author: (the name shown on the card, 40 characters at most; public, like the whole pull request)
```

## Two annotated examples

### A good card: GraphQL API (no. 74)

| Family | Type      | Rarity | Cost | Attack / HP | Effect                                                                             |
| ------ | --------- | ------ | ---- | ----------- | ---------------------------------------------------------------------------------- |
| API    | Component | Rare   | 4    | 2 / 3       | When deployed, draw one card for each other component you have in play (2 at most) |

In real life: "A single endpoint: the client asks for exactly the fields it needs, in one query across several
sources."

- **The mechanics tell the technology's story**: one query that gathers several sources becomes a draw that grows with
  the components already in play.
- **The stats are modest** (2 / 3 for 4 Throughput, well below the benchmark) because the effect brings cards. First
  published at 3 Throughput, it made the Héritage deck win 13 to 18 points more: drawing cards is worth a lot
  (US-085).
- **No new ability**: a short effect, of the same kind as Apigee API Hub's targeted draw.

### A reworked card: API First (no. 72)

Original proposal: rare spell, **2 Throughput**, "Draw the first API card from your deck, then one of your API
components gains +1 attack."

- **First measure**: too weak, the deck playing it lost more often (44 to 48 % wins).
- **Second attempt**: two cards drawn for 2 Throughput: too strong (53 to 59 %).
- **Published version**: two cards drawn for **3 Throughput**, between 43 and 50 %. The "In real life" text was
  shortened to fit on the card: "Designing the API contract before the code: provider and consumers move forward in
  parallel."

This is the most common case: the idea is good, the review adjusts a number.

## Balance

Measure your card before opening the pull request; the CI measures it again (the "Équilibrage des cartes nouvelles"
job). In your clone, once the card is written:

```text
npm run simuler:carte -- <card number>
npm run simuler:carte -- <card number> 400 2
```

The first command uses seed 1, the second seed 2 (400 games per duel; about a minute and a half each). Two copies of
the card go into each starter deck, which then faces the three starter decks; each cell gives the deck's win rate
without and with the card. A gap of **10 points or more** shows a ⚠️. Results vary by about 2.5 points from one seed to
another.

- **No ⚠️ on either seed**: put both tables in the "Balance" section of your pull request.
- **A ⚠️ on both seeds**: adjust the card yourself before the pull request, then measure again. A deck that wins too
  much: raise the cost or lower a stat. A deck that loses too much: the reverse, or, for a card that is dead against
  some decks (an effect aimed at one family), add a modest fallback, like Idempotent Consumer's "otherwise, draw a
  card".
- **The seeds disagree** (a ⚠️ on one only): run a third seed (`-- <card number> 400 3`) and follow the majority; say so
  in the pull request.

The reviewer may still adjust a number, as for API First below: your measurements save a round trip.

## What happens to a proposal

1. **Pull request**: you open it from your fork, with the filled-in template (see
   [CONTRIBUTING.md](../../CONTRIBUTING.md)). The CI checks that the catalogue stays consistent.
2. **Review**: the project owner checks accuracy, the "In real life" text, confidentiality, duplicates and the
   illustration. Answer within two weeks: **merged**, **changes requested** (with comments in the pull request) or
   **declined** (with a reason).
3. **Balance**: a bot-versus-bot simulation puts two copies of the card into each starter deck and plays them against
   the three starter decks; the CI shows it in the summary of the "Équilibrage des cartes nouvelles" job
   (you measured it beforehand, see [Balance](#balance)). A deck that wins or loses 10 points or more with the card
   signals an imbalance: cost or stats are adjusted, as for API First.
4. **Release**: once merged, the card goes live automatically. It takes the next number in the catalogue and can come
   out of boosters.
5. **Credit**: your name is recorded in the catalogue and the changelog. In the game, the card's detail shows
   "Proposed by …" with your name, the catalogue can be filtered on community cards, and the **Contributors** page
   (link in the footer) lists every author with their published cards.

**No GitHub account, or no time?** Send the filled-in template to the project owner, by message or during a workshop:
they will add the card for you, with your name.
