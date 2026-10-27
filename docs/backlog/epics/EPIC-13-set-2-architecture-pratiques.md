# EPIC-13 — A set 2: architecture and practices

- **Status**: In progress
- **Priority**: Could

## Goal

Set 1 is about the building blocks of integration (files, APIs, ESB, events, iPaaS, agentic AI). The project owner
would like, one day, to extend the acculturation to the **ways of designing and delivering** these systems:
_Domain-Driven Design_, microservice architectures, DevOps… Topics noted on 2026-10-24, with no commitment on a date.

## Success indicator

- A playable set 2 in which every card teaches a concept, with its "Learn more" sheet (EPIC-12).
- The combat mechanics stay those of set 1 (ADR 0010); new abilities only if a concept requires them.

## Stories

- [ ] US-076 — Design set 2: DDD, microservices, DevOps
- [x] US-077 — Three new cards: API First, EDA and GraphQL API
- [x] US-085 — Rebalance the GraphQL API card

## Content ideas (to be sorted)

- **DDD**: bounded context, ubiquitous language, aggregate, context map, anti-corruption layer.
- **Microservices**: splitting by domain, API gateway, service mesh, saga, circuit breaker, database per service, or
  on the contrary the modular monolith.
- **DevOps**: continuous integration and deployment, infrastructure as code, observability, progressive delivery,
  rollback, blameless post-mortem culture.
- The incidents of these worlds (distributed coupling, "cascading microservices", configuration drift) for the spells
  and incidents.

## Out of scope

- Changing the architecture of HIPMaster itself: these topics are card themes here, not an overhaul of the app.
