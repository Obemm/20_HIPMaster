# Set 2 — "From the monolith to the pipeline" (draft)

Design of [US-076](../backlog/stories/US-076-concevoir-set-2.md), to be validated by the project owner. Families,
abilities and the set label: [ADR 0052](../decisions/0052-set-2-familles-ddd-microservices-devops.md). Rules and
abilities of set 1: [regles.md](regles.md). Once coded, the playable version will live in the domain data (ADR 0011),
which will then be authoritative.

Set 1 is about the **building blocks** of integration; set 2 is about the **ways of designing and delivering** the
systems they connect: _Domain-Driven Design_, microservices, DevOps. Its message mirrors the one of set 1: splitting
well protects (DDD), splitting fast pays off only with the tooling that goes with it (microservices and DevOps), and
the distributed world has its own incidents.

**Balancing guideline** (set 1): a common component with no ability is worth about `attack + HP = 2 × cost + 1`; each
ability takes away 1 to 2 points, a drawback gives one back. Statistics stay **provisional** until the simulation of
the delivery story (protocol of US-077).

**Composition**: 25 cards, numbers 75 to 99 — 1 legendary, 3 epic, 9 rare, 12 common (the proportions of set 1);
8 DDD, 8 Microservices, 9 DevOps, of which 3 incidents filed in the Bestiary.

## New abilities

| Ability                    | Family        | Effect                                                                                                         |
| -------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| **Bounded**                | DDD           | Takes no collateral damage: only attacks it takes part in and effects that target it alone can damage it.      |
| **Independent deployment** | Microservices | Can attack on the turn it is deployed.                                                                         |
| **Pipeline**               | DevOps        | The first component (or evolution) you deploy each turn costs 1 less, minimum 1. Several Pipelines do not add. |

**Collateral damage** means damage that a card takes without being chosen alone: an effect that hits several
components at once (Splitter, Cascading failure), the extra damage of Broadcast, or damage passed on from another card
(Tight coupling, Big Ball of Mud, Single point of failure). Counter-attacks and Reactive are part of an attack: a
Bounded card takes them.

## DDD (8) — splitting by domain

Mostly **spells**: like API First and the Patterns, a way of designing is applied at a given moment.

| No. | Card                  | Type      | Rarity | Cost | Att/HP | Abilities / effect                                                                                                    | In real life                                                                    | Source                                                                                           |
| --- | --------------------- | --------- | ------ | ---- | ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 75  | Bounded Context       | Spell     | Rare   | 2    | —      | One of your components gains Bounded and +1 HP, permanently                                                           | The boundary within which a model, and each word, has exactly one meaning       | [Fowler](https://martinfowler.com/bliki/BoundedContext.html)                                     |
| 76  | Ubiquitous Language   | Spell     | Common | 1    | —      | Draw a card; if it is a DDD card, draw another one                                                                    | The same words in the business's mouth, the code and the tests                  | [Fowler](https://martinfowler.com/bliki/UbiquitousLanguage.html)                                 |
| 77  | Aggregate             | Component | Common | 3    | 2/4    | Bounded                                                                                                               | Objects that change together, only through their root                           | [Fowler](https://martinfowler.com/bliki/DDD_Aggregate.html)                                      |
| 78  | Domain Event          | Spell     | Common | 2    | —      | Draw the first EDA card of your deck; if you have a Bounded component in play, one of your components gains +1 attack | "An order was placed": what one domain tells the others, through the event mesh | [Fowler](https://martinfowler.com/eaaDev/DomainEvent.html)                                       |
| 79  | Anti-corruption Layer | Component | Rare   | 3    | 1/4    | Guard, Bounded                                                                                                        | Translates the model of another domain so that it does not leak into yours      | [Microsoft](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer) |
| 80  | Context Map           | Spell     | Epic   | 3    | —      | Until the end of the opponent's next turn, your components are Bounded; draw a card                                   | The map of the domains and of the relations between their teams                 | [DDD Crew](https://github.com/ddd-crew/context-mapping)                                          |
| 81  | Event Storming        | Spell     | Rare   | 2    | —      | Draw one card per different family among your components in play (3 at most)                                          | A workshop where business and IT stick the domain's events on a wall            | [eventstorming.com](https://www.eventstorming.com/)                                              |
| 82  | Big Ball of Mud       | Incident  | Rare   | 4    | —      | Until the end of the opponent's next turn, when an opposing component takes damage, the other opposing ones take 1    | The system where everything depends on everything. Bounded cards are spared.    | [Foote & Yoder](http://www.laputan.org/mud/)                                                     |

Big Ball of Mud is an incident: it belongs to the **Bestiary**, like the two other incidents of the set.

## Microservices (8) — deploying in small pieces

| No. | Card                 | Type                  | Rarity    | Cost | Att/HP | Abilities / effect                                                                                                            | In real life                                                                    | Source                                                                               |
| --- | -------------------- | --------------------- | --------- | ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 83  | Monolith             | Component             | Common    | 4    | 5/5    | Single point of failure                                                                                                       | One application, one deployment. Not a crime: often the right place to start.   | [Fowler](https://martinfowler.com/bliki/MonolithFirst.html)                          |
| 84  | Modular monolith     | Evolution of Monolith | Rare      | 4    | 4/6    | Bounded                                                                                                                       | Modules as separate as services, in a single deployment                         | [Grzybek](https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer)           |
| 85  | Microservice         | Component             | Common    | 2    | 2/2    | Independent deployment                                                                                                        | A small service, one business capability, deployed on its own                   | [Lewis & Fowler](https://martinfowler.com/articles/microservices.html)               |
| 86  | Database per service | Component             | Common    | 2    | 1/3    | Independent deployment                                                                                                        | Each service owns its data: no one else reads its tables                        | [microservices.io](https://microservices.io/patterns/data/database-per-service.html) |
| 87  | Service mesh         | Component             | Epic      | 5    | 3/6    | Your other Microservices components have +1 HP and are immune to Timeout                                                      | Encryption, retries and metrics between services, without touching their code   | [Istio](https://istio.io/latest/about/service-mesh/)                                 |
| 88  | Kubernetes           | Component             | Legendary | 6    | 4/7    | Once per turn, when another of your Microservices components is destroyed, it returns to play with 1 HP (no attack this turn) | Keeps the desired state: a container that dies is restarted                     | [kubernetes.io](https://kubernetes.io/docs/concepts/overview/)                       |
| 89  | Saga                 | Spell                 | Rare      | 2    | —      | One of your components recovers all its HP; if it is a Microservices component, draw a card                                   | A transaction across several services, with a compensation for each step        | [microservices.io](https://microservices.io/patterns/data/saga.html)                 |
| 90  | Cascading failure    | Incident              | Rare      | 3    | —      | Deal 1 damage to each opposing component, 2 to the Microservices ones                                                         | One slow service, and the callers fall one after the other. Bounded cards hold. | [Google SRE](https://sre.google/sre-book/addressing-cascading-failures/)             |

**Evolution line**: Monolith → Modular monolith. The game does not push towards microservices at any cost: the
modular monolith loses the Single point of failure and gains Bounded, while the Microservices cards bet on speed
(Independent deployment) and need Kubernetes and the service mesh to hold.

## DevOps (9) — delivering often, without fear

| No. | Card                  | Type      | Rarity | Cost | Att/HP | Abilities / effect                                                                                                      | In real life                                                            | Source                                                                                                                |
| --- | --------------------- | --------- | ------ | ---- | ------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 91  | CI/CD pipeline        | Component | Epic   | 4    | 2/5    | Pipeline                                                                                                                | Every commit built, tested and deployable, automatically                | [Fowler](https://martinfowler.com/articles/continuousIntegration.html)                                                |
| 92  | Container             | Component | Common | 2    | 1/2    | Pipeline                                                                                                                | The application and its dependencies in one image, the same everywhere  | [Docker](https://docs.docker.com/get-started/docker-overview/)                                                        |
| 93  | Terraform             | Component | Rare   | 3    | 1/4    | Your other components have +1 HP, including those deployed afterwards                                                   | Infrastructure described in versioned code, rebuilt identical           | [HashiCorp](https://developer.hashicorp.com/terraform/intro)                                                          |
| 94  | Observability         | Component | Common | 2    | 1/3    | Monitoring                                                                                                              | Logs, metrics and traces to understand what the system is doing         | [OpenTelemetry](https://opentelemetry.io/docs/concepts/observability-primer/)                                         |
| 95  | Quality gate          | Component | Common | 2    | 1/3    | Guard; your components are immune to Poison message                                                                     | Code that does not meet the bar is not merged (SonarCloud at the company)      | [Sonar](https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/introduction-to-quality-gates/) |
| 96  | Feature flag          | Spell     | Common | 1    | —      | The next component you deploy this turn can be neither attacked nor targeted by incidents until your next turn          | The code is in production, the feature switched off (ConfigCat at the company) | [Fowler](https://martinfowler.com/articles/feature-toggles.html)                                                      |
| 97  | Canary release        | Spell     | Rare   | 2    | —      | One of your components gains +2 attack until the end of the turn; if it is destroyed this turn, it returns to your hand | A new version for a few users first, rolled back at the first alert     | [Fowler](https://martinfowler.com/bliki/CanaryRelease.html)                                                           |
| 98  | Blameless post-mortem | Spell     | Common | 1    | —      | Draw a card; draw 2 instead if your discard pile holds at least 3 components                                            | After the incident, we look for the causes, not for a culprit           | [Google SRE](https://sre.google/sre-book/postmortem-culture/)                                                         |
| 99  | Configuration drift   | Incident  | Common | 2    | —      | An opposing component permanently loses 1 attack and 1 HP, unless its owner has Terraform in play                       | Production slowly stops looking like what the code describes            | [HashiCorp](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift)                                 |

## Synergies and counters

- **DDD against the distributed world**: Bounded cancels Splitter, Broadcast's extra damage, Tight coupling, Big Ball
  of Mud and Cascading failure. Context Map protects a whole board for a turn.
- **Domain Event** links DDD and the Event-driven family of set 1: between two domains, events go through the event
  mesh (Solace, the company [ref] and [ref]).
- **Microservices**: cheap and immediate (Independent deployment), but fragile against Cascading failure; Service mesh
  and Kubernetes make them hold, Saga repairs them.
- **DevOps**: Pipeline speeds up every turn; Terraform protects against Configuration drift; Quality gate against
  Poison message; Canary release and Feature flag take risks without paying for them.

## Balancing (to do in the delivery story)

- Benchmarks of the guideline above, checked card by card in the tables. Points of attention: Kubernetes (repeated
  returns), Pipeline (tempo from turn 2), Context Map (cancels a whole Splitter or Cascading failure) and Independent
  deployment on cheap cards.
- Simulation with the protocol of US-077: a deck built on each new family faces the three loaned decks, 400 games per
  duel, Nightly Batch on both sides, seeds 1 and 2. The loaned decks do not change.
- The bots need a move for each new effect, and to know the three abilities.
