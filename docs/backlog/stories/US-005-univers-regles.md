# US-005 — Game universe and rules

- **Epic**: EPIC-01
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-005-univers-regles`

## Story

As the **project owner**, I want **to choose the card universe and the combat rules**
so that **I can create the first set and the game engine**.

## Acceptance criteria

- [x] The open questions of the [vision](../../produit/vision.md) are settled (universe, origin of the cards, combat,
      monetisation).
- [x] The rules fit on one page in `docs/produit/regles.md`.
- [x] The characteristics of a card (families, statistics, rarities, abilities) are listed.
- [x] An ADR records the choice of combat mechanic.

## Notes

References: [inspirations](../../produit/inspirations.md) (WikiMasters: multiple-choice questions; Async TCG: RAM
board / attack / HP).

Deliverables: [univers.md](../../produit/univers.md), [regles.md](../../produit/regles.md),
[cartes-set-1.md](../../produit/cartes-set-1.md) (draft of 64 cards), [ADR 0010](../../decisions/0010-combat-plateau.md).

Project owner's choices (discussion of 2026-10-16): the integration platform universe, from FTP to agentic AI (MCP,
A2A, LLM, prompting); real building blocks as signature cards — on-premises webMethods Integration Server 10.15
(with Universal Messaging and MWS) towards webMethods.io, Apigee API Gateway towards AI Gateway, Solace Event Mesh
towards Solace Agent Mesh (no agentic AI tool in place: Agent Mesh chosen for the game); FTP is officially forbidden
and SFTP is being gradually replaced; real product names, without logos, internal game.

## Log

- 2026-10-16 — created.
- 2026-10-16 — universe, rules, draft of set 1 and ADR 0010 written; under review by the project owner.
- 2026-10-18 — delivered: integration platform universe (FTP to agentic AI), board combat rules, draft of 64 cards, ADR 0010
