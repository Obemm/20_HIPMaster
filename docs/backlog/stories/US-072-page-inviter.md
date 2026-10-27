# US-072 — An "Invite" page reserved for the project owner

- **Epic**: EPIC-09
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-072-page-inviter`

## Story

As the **project owner**, I want **to create, follow and revoke invitations from the site, on my phone** so that **I
can invite a colleague in a few seconds, with no command line or production secrets**.

## Context

Registration is by invitation (US-048, ADR 0027), but invitations can only be created with the `npm run invitation`
command, which needs the production secrets (Cloud Run Job or workstation). Project owner's decision (2026-10-23): an
administration page **reserved for their account alone**; no invitations by players. The accounts are guest accounts,
with no email or password (ADR 0017), protected by rate limiting, revocable sessions and HMAC (ADR 0025).

## Acceptance criteria

- [x] **Given** the API configuration, **then** the list of administrators comes from the `ADMINISTRATEURS` variable
      (player identifiers), never from the front end; an invalid value prevents the API from starting.
- [x] **Given** a player who is not an administrator, a visitor without an account or an expired session, **when** they
      call an administration route, **then** the API answers **404**, exactly as for a route that does not exist (not
      401, not 403, not 429).
- [x] **Given** an administrator, **when** they create an invitation (label, number of accounts, deadline), **then**
      the API returns the code and the link **only once**; the database keeps only the fingerprint.
- [x] **Given** an administrator, **when** they list the invitations, **then** they see for each its label, the
      accounts created out of the maximum, the expiry and whether it is revoked, **never the code**.
- [x] **Given** an administrator, **when** they revoke an invitation, **then** its code no longer creates accounts,
      accounts already created remain, and the list says it is "revoked".
- [x] The administration routes are described in an OpenAPI contract written before the code, and rate-limited; they
      reuse the logic of the `npm run invitation` command, without duplicating it.
- [x] **Given** "My account", **when** the player is an administrator, **then** an "Invite" link leads to the page;
      otherwise, neither the link nor the page is accessible.
- [x] **Given** the "Invite" page, **when** an invitation is created, **then** its link can be copied in one gesture,
      and shared through the phone's menu (Web Share) when it exists.
- [x] **Given** the "Invite" page, **then** it lists the invitations with their usage and allows revoking after
      confirmation; it can be used with the keyboard, at 375 px, in both themes, with no axe-core violation.
- [x] **Given** deployment, **then** `ADMINISTRATEURS` is passed to the API by `scripts/gcp/deployer.sh` and the
      workflow; the operations guide explains how the project owner finds their player identifier.
- [x] Tests: invitations and configuration logic, API (including the 404 for a non-administrator), screen, e2e
      journey.

## Notes

- Decision: [ADR 0029](../../decisions/0029-administrateurs-par-configuration.md), which supplements ADR 0017 and 0027.
- The player identifier is displayed in "My account" ("Account ID"), to be copied into the configuration.
- Contract: `apps/api/openapi/administration.yaml` (`GET` and `POST /admin/invitations`,
  `POST /admin/invitations/{id}/revocation`); `GET /moi` carries `administrateur: true` for an administrator, and
  nothing for the others (`comptes.yaml` 1.3.0).
- The refusal goes through an `onRequest` hook specific to the administration plugin, before the body is read and the
  rate limit, and answers with the application's 404 handler (`callNotFound`): the same response, byte for byte, as a
  non-existent route. Tested with no token, with an unknown token and with an ordinary player, beyond the limit.
- The routes call `apps/api/src/comptes/invitations.ts`, like the command; bounds, deadline (`finDuJour`), link
  (`lienInvitation`) and status (`statutInvitation`) are now shared there.
- Migration `0009_revocation_invitations`: an optional `revoquee_le` column, compatible with the live version.
- Settings: `ADMINISTRATEURS` (UUIDs separated by spaces or commas; `tous` outside production only, refused at startup
  in production) and `ADRESSE_SITE` (address of the links). The e2e tests launch the API with
  `ADMINISTRATEURS=tous`.
- Deployment: GitHub variable `HIPMASTER_ADMINISTRATEURS`, checked by `deployer.sh` before any step, set by the
  `migrations` and `revision` steps; operations guide, "Administrators" section.
- E2e run on dedicated ports (3300/4500): 3000 and 4200 were serving another session.

## Log

- 2026-10-23 — created, after the project owner's decision to invite from the site, with their account alone.
- 2026-10-23 — ADR [0029](../../decisions/0029-administrateurs-par-configuration.md), OpenAPI contract first.
- 2026-10-23 — delivered: "Invite" page reserved for administrators designated by ADMINISTRATEURS (GitHub variable HIPMASTER_ADMINISTRATEURS at deployment): create an invitation with code and link shown only once, copy or share the link, follow usage, revoke after confirmation; /api/v1/admin/invitations routes return 404 for any other caller; revocation distinguished from expiry (migration 0009); complete e2e and under the production CSP green
