# US-022 — Guest account, without a password

- **Epic**: EPIC-02
- **Status**: Done
- **Priority**: Must
- **Size**: L
- **Branch**: `us-022-compte-invite`

## Story

As a **player**, I want **an account created in one click, with just a username** so that **I can keep my collection
without remembering a password**.

## Acceptance criteria

- [x] An ADR records the **simple** authentication solution chosen (project owner's decision, 2026-10-18: "let's keep it
      simple for now"): guest account with a username, secret token kept by the browser, **recovery code** to get your
      account back on another device; no password and no email; an OIDC provider can be added later (ADR 0005: no
      home-made passwords).
- [x] An ADR records the storage: accounts (and soon collections) are **persistent**; the database must run in
      development and in tests **without Docker** if possible, with the same Drizzle schema as in production
      (PostgreSQL, ADR 0003).
- [x] **Given** a first visit, **when** I choose a username, **then** my account is created, I stay signed in on this
      browser and I see my recovery code (to write down).
- [x] **When** I enter my recovery code on another device, **then** I get my account back.
- [x] The token is never stored in clear text in the database (fingerprint); the API refuses a request without a valid
      token on the routes that require an account (401 in Problem Details format).
- [x] The username is displayed in the header; I can sign out (the browser forgets the token).
- [x] OpenAPI contract before the code; API tests (creation, sign-in by code, refusal) and screen tests; e2e journeys
      and axe-core audit green.

## Notes

- Games against the bot remain playable without an account; the account becomes necessary for the collection (US-023).

## Log

- 2026-10-18 — created.
- 2026-10-18 — ADR 0017 (guest account: username, Bearer token, recovery code, SHA-256 fingerprints) and ADR 0018
  (PGlite in development and tests, PostgreSQL in production; migrations at start-up). Contract
  `openapi/comptes.yaml`, tables `joueurs` and `sessions` (migration `0001_comptes`), routes `/joueurs`, `/sessions`,
  `/moi`. Front end: "My account" page, username in the banner, token interceptor. API tests (7), screen (3), e2e
  (creation, reload, other device, sign-out) and axe in light and dark green.
- 2026-10-18 — delivered: Guest account: username, token kept by the browser, recovery code; PGlite in development
