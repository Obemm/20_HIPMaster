# 0052 — Set 2: three new families, three abilities, and a set carried by each card

- **Date**: 2026-10-28
- **Status**: Proposed

## Context

US-076 designs set 2 of the game, about the ways of designing and delivering systems: _Domain-Driven Design_,
microservices, DevOps (EPIC-13). The catalogue is a single piece of versioned domain data, where each card is
identified by a number that never changes (ADR 0011); collections, decks and the booster draw reference cards by
number. The eight families of set 1 (`docs/produit/univers.md`) are eras of integration and two cross-cutting
families; none of them covers these practices. The combat mechanics are those of ADR 0010, and EPIC-13 asks for a new
ability only where a concept requires it. US-077 had added three cards to set 1 (numbers 72 to 74) without opening a
set, since they belonged to existing families. The project owner decided the main lines on 2026-10-28: numbers from
75 labelled set 2, three new families, about 24 cards, concepts and a few products.

## Decision

- **One catalogue, a set per card.** The set 2 cards take **numbers 75 and up**, after those of set 1, without
  renumbering. Each card carries the **set** it belongs to (1 or 2), shown on the card, in the collection and when a
  booster is opened. Collections, decks and boosters stay indexed by number; the booster draws from the whole
  catalogue, as it did for US-077. The illustrations of set 2 go in `illustrations/set-2/`, the manifest stays indexed
  by number.
- **Three new families**, after the eight of set 1:
  - **DDD**, mostly spells (ways of designing, like API First), with the signature ability **Bounded** (FR
    _Cloisonné_): the card takes no collateral damage — only attacks it takes part in and effects that target it alone
    can damage it. Collateral damage is defined in `regles.md`: effects that hit several components at once, the extra
    damage of Broadcast, damage passed on from another card (Tight coupling, Single point of failure…).
  - **Microservices**, mostly components, with the signature ability **Independent deployment** (FR _Déploiement
    indépendant_): the card can attack on the turn it is deployed.
  - **DevOps**, mostly components, with the signature ability **Pipeline**: the first component or evolution deployed
    each turn costs 1 less, minimum 1; several Pipelines do not add up.
- **The incidents of set 2 join the Bestiary**, the patterns of the distributed world can join Patterns: the two
  cross-cutting families stay cross-cutting across sets.
- **No other new ability.** The other effects of set 2 are card effects (like those of US-014 and US-019) or reuse
  existing abilities (Guard, Monitoring, Single point of failure), and the evolution mechanics (Monolith → Modular
  monolith).
- The card list is in `docs/produit/cartes-set-2.md`; the data in `packages/domain` will become authoritative once
  coded (ADR 0011).

## Alternatives considered

- **A truly separate set** (numbering per set, boosters per set, choosing the set to open): closer to a commercial
  card game, but every reference to `SET_1` (domain, API, illustrations, about 55 places), the collection and the decks
  would need a set key, for 25 cards and with a single pool of players. Can be decided later by a new ADR: the set
  carried by each card prepares it.
- **An extension of set 1 with no set label** (as US-077): simplest, but the "new set" moment disappears and the
  catalogue no longer says which cards are new.
- **No new family**, cards spread over the families of set 1: no new ability, but DDD, microservices and DevOps would
  have no game identity, and an "API" or "Patterns" card named Kubernetes would teach a wrong classification.
- **Signature abilities borrowed from set 1** (Guard for DDD, Durable queue for Kubernetes…): fewer rules, but nothing
  would show what each practice brings. The three abilities chosen each teach one idea: a boundary protects from the
  others' failures, a small service is delivered at once, automation speeds up each delivery.
- **A healing or redeployment ability for Kubernetes**: kept as an effect of the legendary card only, so as not to add
  a fourth ability.

## Consequences

- The card model gains a `set` field and three families; the glossary three abilities; the engine handles them, and
  the bots learn to use them (delivery stories of EPIC-13).
- Bounded needs the engine to tell collateral damage from targeted damage: the effects concerned (Splitter, Broadcast,
  Tight coupling, Single point of failure and the new incidents) must say so explicitly.
- Independent deployment and Pipeline speed up the game: the simulation of the delivery story must check that games
  against the bots stay balanced (protocol of US-077), and the loaned decks do not change.
- Booster draws now include set 2: a player who opens a booster gets set 1 cards in a smaller proportion (74 cards out
  of 99). The collections already owned do not change.
- Real product names (Kubernetes, Terraform…) without their logos, as in set 1 (`univers.md`).
