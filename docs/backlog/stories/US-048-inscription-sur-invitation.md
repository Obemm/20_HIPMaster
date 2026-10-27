# US-048 — Sign-up by invitation

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-048-inscription-sur-invitation`

## Story

As the **project owner**, I want **only people holding an invitation code to be able to create an account** so that I
can **open the game to my colleagues without opening it to the whole Internet**.

## Context

Choice of the project owner (2026-10-22): the site is reachable on the Internet, but account creation is reserved for
invitees. The catalogue and the games against the bot remain playable without an account (ADR 0017). Today,
`POST /api/v1/joueurs` creates an account for whoever asks.

## Acceptance criteria

- [x] **Given** a valid invitation code, **when** a visitor creates their account with a nickname and this code,
      **then** the account is created as today (token, recovery code, welcome boosters).
- [x] **Given** a missing, unknown, expired or exhausted code, **when** a visitor tries to create an account, **then**
      the API answers **403** in Problem Details format, with a message that does not say which case applies.
- [x] **Given** the project owner, **when** they run the invitation creation command (label, number of uses, expiry
      date), **then** the code is displayed **only once**; the database keeps only its fingerprint, as for recovery
      codes (ADR 0017).
- [x] **Given** an account created by invitation, **then** the database knows which invitation it comes from (to follow
      a campaign or revoke an invitation that has leaked).
- [x] **Given** the "My account" page, **when** a visitor arrives through an invitation link
      (`/compte?invitation=…`), **then** the code field is prefilled.
- [x] **Given** development and the e2e tests, **then** sign-up stays open by default; it requires an invitation only
      if the configuration asks for it (enabled in production).
- [x] The contract `apps/api/openapi/comptes.yaml` is updated before the code; API tests for each case.

## Notes

- Decision to be recorded in an ADR that completes ADR 0017 (shape of the code, storage, administration command).
- Lead: an `invitations` table (fingerprint, label, maximum and consumed uses, expiry) and an `npm run invitation`
  command, run in production by a Cloud Run Job, which avoids writing an administration interface.
- Signing in with a recovery code (`POST /sessions`) is not concerned: it recovers an existing account.
- Rate limiting of code attempts: US-047.
- Decisions: [ADR 0027](../../decisions/0027-inscription-sur-invitation.md). 16-character code (80 bits, four groups,
  so as not to confuse it with a recovery code), HMAC fingerprint with the codes key (usage `invitation:`).
  `INSCRIPTION_SUR_INVITATION` is `oui` by default in production only; a code that is supplied is always checked,
  which allows trying the journey in development.
- Command: `npm run invitation -- --libelle … --utilisations … [--expire AAAA-MM-JJ | --jours N]`, `--lister`,
  `--revoquer <id>`; in production, Cloud Run Job `hipmaster-invitation` (operations guide, section "Inviter des
  joueurs"), with the image of the `hipmaster-api` service deployed by US-050.
- Migration `0008_invitations`: one table and one optional column, compatible with the version still live (ADR 0023).
- Real trial of 2026-10-23 on PostgreSQL 18 (local container) and the API in production mode: without a code or with
  an unknown code, 403; an invitation of 2 uses creates 2 accounts then refuses the third; listing and revocation
  work.

## Log

- 2026-10-22 — created, after the choice of an opening "colleagues by invitation".
- 2026-10-23 — refined and started, from the US-047 branch (not merged): ADR [0027](../../decisions/0027-inscription-sur-invitation.md), OpenAPI contract first.
- 2026-10-23 — delivered: invitations table (HMAC fingerprint, label, uses, expiry) and invitation reference on each account, POST /joueurs requires an invitation when INSCRIPTION_SUR_INVITATION is active (by default in production) with a neutral 403, npm run invitation command (creation with the code displayed only once, list, revocation) and documented Cloud Run Job, prefilling from /compte?invitation=…; tried on PostgreSQL 18 in production mode
