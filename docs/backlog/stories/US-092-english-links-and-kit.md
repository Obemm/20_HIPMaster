# US-092 — Links across translated folders, and the contributor kit after the switch

- **Epic**: EPIC-16
- **Status**: Done
- **Priority**: Should
- **Size**: XS
- **Branch**: `us-092-english-links-and-kit`

## Story

As a **contributor**, I want **every link of the translated docs to work and the contributor kit to describe the
repository as it now is** so that **I am not sent to a missing anchor or told the project is in French**.

## Acceptance criteria

- [x] Every relative Markdown link and anchor of the repository resolves (the sessions of US-088 to US-091 fixed
      links inside their own folders only).
- [x] `CONTRIBUTING.md`, the card prompt, the illustration prompt and the guide say the repository is in English
      (ADR 0051) and name the English headings (`Community cards`, `Unreleased`, `Added`).
- [x] `npm run check` passes.

## Log

- 2026-10-28 — created (EPIC-16): three broken anchors after the translation (README "Getting started", operations
  "Deploy", catalogue US-077 extension), and the kit still said the rest of the project was in French.
- 2026-10-28 — delivered: Three cross-folder anchors fixed (link checker over every tracked Markdown file: 0 broken), contributor kit updated for the English repository.
