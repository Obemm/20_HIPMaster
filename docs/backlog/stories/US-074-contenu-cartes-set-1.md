# US-074 — Enrich the content of the 71 cards of set 1

- **Epic**: EPIC-12
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-074-contenu-cartes-set-1`
- **Decision**: [ADR 0036](../../decisions/0036-fiches-pedagogiques-cartes.md)

## Story

As a **colleague discovering integration**, I want **every card to teach me something accurate and useful** so that I
can **better understand the platform's technologies, patterns and incidents while playing**.

## Design

- The 63 missing sheets follow the US-073 format (`packages/domain/src/fiches/`, one file per family): review is done
  **family by family, file by file**, in a single PR (eight independent files).
- **Sources**: Wikipedia (in French when the article exists), vendor documentation (Google Cloud Apigee, Solace, IBM,
  Anthropic), standards (RFC, OpenAPI, AsyncAPI, A2A, CA/Browser Forum), _Enterprise Integration Patterns_, OWASP,
  CNIL, Microsoft Learn. Every link was opened: 200 response and page title on the right subject.
- **At the company**: only facts that are already public in the repository (`docs/produit/univers.md`, `cartes-set-1.md`); no
  internal doctrine is used, the repository being public (ADR 0022).
- **Dead links**: `npm run fiches:liens` opens every address (redirects followed) and prints status and title; it exits
  with an error if a link does not respond. It needs the network: it is not a CI test, it is run before every change
  to a sheet.
- **Visible card text**: only SFTP's was inaccurate ("Encrypted FTP": SFTP goes through SSH, unrelated to FTP); it
  becomes "File transfer encrypted by SSH, gradually replaced by APIs and events".

## Acceptance criteria

- [x] **Given** each of the 71 cards, **then** its "Learn more" sheet (US-073 format) is written: definition, use,
      concrete example, pitfall or good practice, and at least one external link.
- [x] **Given** each external link, **then** it has been opened and verified; a test or a script reports dead links.
- [x] **Given** the visible text of the card, **then** it stays short and playful; it is touched up only if it was
      inaccurate.
- [x] The content is reviewed by the project owner, family by family (Files & Batch, Messaging & ESB, API, iPaaS,
      Event-driven, Agentic AI, Patterns, Bestiary): one PR per family if that is easier to review.

## Notes

- Size L: to be split by family when refined.
- After US-073, which fixes the format with pilot cards.
- Points for the project owner to decide (noted in the PR): the "At the company" texts, the fate of SFTP at the company (the game
  presents it as a step towards the API or the event), and the sheets that rely on vendor documentation likely to
  change (Apigee AI, Solace Agent Mesh, A2A).

## Log

- 2026-10-23 — created, at the project owner's request.
- 2026-10-24 — refinement and writing of the 63 remaining sheets (127 links, 115 addresses, all verified), "one sheet
  per card" test, `npm run fiches:liens` script, SFTP text fixed. In review: project owner's review.
- 2026-10-24 — project owner's decision: SFTP is banned at the company, like FTP, but still used by many projects; the sheet
  says so. Sheets ADR renumbered 0036 (0034 is US-058's).
- 2026-10-24 — delivered: "Learn more" sheet for the 71 cards of set 1 (127 links verified, npm run fiches:liens),
  SFTP text fixed, SFTP banned at the company; texts reviewed and validated by the project owner
