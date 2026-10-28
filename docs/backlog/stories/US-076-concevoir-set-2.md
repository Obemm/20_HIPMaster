# US-076 — Design set 2: DDD, microservices, DevOps

- **Epic**: EPIC-13
- **Status**: In progress
- **Priority**: Won't (on hold since 2026-10-28)
- **Size**: M
- **Branch**: `us-076-concevoir-set-2`

## Story

As a **player who has gone through set 1**, I want to **discover new cards about how to design and deliver systems
(DDD, microservices, DevOps)** so that I can **keep learning while playing**.

## Acceptance criteria

- [x] **Given** the leads of EPIC-13, **then** `docs/produit/cartes-set-2.md` lists about **24 cards**, numbered from 75,
      about 8 per theme (incidents included): family, type, rarity, cost, attack and HP or effect, abilities, "In real
      life" text; rarities in the proportions of set 1 (about 1 legendary, 2 or 3 epics, 8 rares, the rest commons).
- [x] **Given** each card, **then** its statistics follow the balancing guideline of set 1 (`attack + HP = 2 × cost + 1`,
      minus 1 to 2 points per ability) and its effect is described precisely enough to be coded without a new design
      decision.
- [x] **Given** each card, **then** its "In real life" text rests on at least one verified source link, noted in the
      list.
- [x] **Given** the three new families (DDD, Microservices, DevOps), their signature abilities, any other new ability
      and the "set" label carried by each card, **then** they are decided in an ADR that cites the the company reference.
- [x] **Given** the list, **then** [univers.md](../../produit/univers.md) and [regles.md](../../produit/regles.md)
      describe the new families and abilities.
- [ ] **Given** the list, **then** it is reviewed and validated by the project owner.
- [ ] **Given** the validated list, **then** the delivery stories are written in the backlog and attached to EPIC-13.

## Design (decided with the project owner on 2026-10-28)

- **Placement**: one catalogue (ADR 0011). The set 2 cards take **numbers 75 and up**, without renumbering, and each
  card carries the **set it belongs to** for display (collection, card, booster). Collections, decks and boosters stay
  indexed by number: no separate numbering, no booster per set.
- **Families**: three new families, each with a **signature ability**:
  - **DDD**: mostly **spells**, ways of designing applied at a given moment (like API First): bounded context,
    ubiquitous language, aggregate, context map, anti-corruption layer…
  - **Microservices**: mostly **components**: API gateway, service mesh, database per service, or on the contrary the
    modular monolith…
  - **DevOps**: mostly **components**: CI/CD, infrastructure as code, observability, progressive delivery…
  - The incidents of these worlds (distributed coupling, cascading failures, configuration drift…) join the
    **Bestiary**; distributed-system patterns (Saga, Bulkhead…) may join **Patterns**.
- **Names**: mostly concepts, with a few emblematic products (Kubernetes, Terraform, GitHub Actions…), never their
  logos, as in set 1.
- **Combat mechanics** unchanged (ADR 0010): a new ability only where a concept requires it.

## Notes

- **Balancing by simulation** needs the effects coded: it moves to the catalogue delivery story, with the protocol of
  US-077 (400 games per duel, Nightly Batch on both sides, two seeds, against the three loaned decks).
- Delivery stories expected once the list is validated: catalogue, effects and bot moves (with the simulation); the
  set label in the interface; "Learn more" sheets in French and English; Gemini illustrations (ADR 0047).

## Log

- 2026-10-24 — created: topics noted by the project owner ("DDD, microservice architecture, DevOps…").
- 2026-10-28 — refined with the project owner: numbers 75+ labelled set 2, three new families, about 24 cards, concepts
  and a few products; simulation moved to delivery; size L → M. Status Ready.
- 2026-10-28 — design proposed: 25 cards (75 to 99) in `docs/produit/cartes-set-2.md`, 25 source links checked,
  ADR 0052 (families, Bounded, Independent deployment, Pipeline, set per card), universe and rules updated. Awaiting
  the project owner's review.
- 2026-10-28 — on hold: the project owner prefers to leave room for the contributors' cards (EPIC-08) before
  opening a new set. The design is kept as is, ADR 0052 stays Proposed, to be resumed later (review, then delivery
  stories and illustrations).
