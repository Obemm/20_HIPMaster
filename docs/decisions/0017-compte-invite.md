# 0017 — Guest account: username, secret token and recovery code

- **Date**: 2026-10-18
- **Status**: Accepted

## Context

US-022 gives players an account to keep their collection (EPIC-02, EPIC-03). The project owner wants to keep it **simple
for now** (2026-10-18). ADR 0005 rules out a corporate identity provider and asks to avoid home-made passwords; EPIC-02
aims at a sign-up in under 30 seconds, with no password to remember.

## Decision

- **Guest account**: the player chooses a **username** (2 to 24 characters); no email, no password.
- On creation, the server returns:
  - a random **session token** (32 bytes, base64url), kept by the browser and sent in the
    `Authorization: Bearer …` header;
  - a readable **recovery code** (`ABCD-EFGH-JKLM`, 12 characters from an alphabet without ambiguous characters, i.e.
    60 bits), shown **only once**, to get one's account back on another device.
- The database keeps only the **SHA-256 fingerprint** of the token and of the code (random values with high entropy:
  a slow hash adds nothing). A lost code is regenerated from a connected device; the old one then stops working.
- Signing in with one's code opens a **new session** (one token per device); signing out deletes the device's
  session.
- Routes that require an account answer **401** in Problem Details format without a valid token. Games against the
  bot remain playable without an account.

## Alternatives considered

- **OIDC provider** (Google, Microsoft, Entra ID): the eventual target, with no password to manage, but it requires
  registering an application and handling redirects: not "simple for now". The guest account can be linked to an OIDC
  identity later.
- **Magic link by email**: needs a sending service and the collection of addresses (personal data).
- **`HttpOnly` session cookie** instead of the token in browser storage: better protected against an XSS flaw, but
  needs CSRF protection; for an internal game with no sensitive data, and with Angular's escaping, the `Bearer` token
  remains simpler. To be reconsidered with OIDC.

## Consequences

- Losing one's code **and** all one's connected devices means losing the account: the player is told so when the code
  is displayed.
- No personal data collected beyond a free-form username.
- No rate limiting on code entry for now: 60 bits put guessing out of reach; to be added before any public opening.
