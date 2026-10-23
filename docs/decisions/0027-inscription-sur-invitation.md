# 0027 — Sign-up by invitation: counted-use codes, kept under HMAC, created from the command line

- **Date**: 2026-10-23
- **Status**: Accepted
- **Completes**: [0017](0017-compte-invite.md) (guest account); builds on [0025](0025-protections-api.md) (code key,
  rate limiting)

## Context

On 2026-10-22, the project owner chose to open the game to colleagues **by invitation**: the site is reachable on the
Internet, but creating an account requires a code. The catalogue and the games against the bot stay open to everyone
(ADR 0017). Today, `POST /api/v1/joueurs` creates an account for whoever asks.

Constraints: no personal data beyond a nickname (ADR 0017), so neither e-mail nor directory; no administration
interface; an invitation that leaks must be revocable without touching accounts already created; development and the
e2e journeys create accounts at will.

## Decision

- **An `invitations` table**: the code's fingerprint, a label (for whom, for which campaign), the maximum and consumed
  number of uses, the expiry, the creation date. Each account keeps the reference of its invitation (`invitation_id`,
  empty for an account created without an invitation); deleting an invitation deletes no account.
- **The code**: 16 characters of the recovery-code alphabet (80 bits), in four groups (`ABCD-EFGH-JKLM-NPQR`), so as
  not to confuse it with a recovery code, which has three. It is passed on as a link: `/compte?invitation=…`
  pre-fills the field on the "My account" page.
- **Its fingerprint**: HMAC-SHA-256 with the code key (ADR 0025), prefixed with the purpose `invitation:`: an
  invitation code never works as a recovery code, and vice versa. The database never keeps the code.
- **`POST /joueurs` accepts an `invitation` field**. It is required when `INSCRIPTION_SUR_INVITATION` is `oui`: by
  default in production, and only there. A supplied code is always checked, even when not required.
- **Consumption without overrun**: a single request increments the counter, provided a use remains and the invitation
  has not expired, within the transaction that creates the account. Two simultaneous sign-ups never exceed the
  maximum, and a creation that fails consumes nothing.
- **Refusal: 403** in Problem Details format, with a single message for a missing, unknown, expired or exhausted code:
  it does not say which. Attempts are bounded by the sign-up limit (30 per hour and per address, ADR 0025).
- **The `npm run invitation` command** (`node apps/api/src/invitation.ts`) creates an invitation (label, number of
  uses, expiry) and displays its code **only once**; it can also list the invitations (with the number of accounts
  created) and revoke one (it expires at once). Like the migrations (ADR 0023), it writes only to PostgreSQL
  (`DATABASE_URL`): opening the PGlite folder of a running API would damage it.
- **In production**, the command runs in a **Cloud Run Job**, with the API image, the `hipmaster-api` account and the
  `database-url` and `cle-codes-recuperation` secrets (operations guide). The code then appears once in the execution
  log, which only the project owner can read. So that it appears nowhere, the command can also run on the
  workstation, with the secrets read by `gcloud`.

## Alternatives considered

- **List of authorised e-mail addresses, or the company domain**: addresses would have to be collected (contrary to
  ADR 0017) and verified as belonging to the player, hence e-mails would have to be sent. Rejected.
- **A single code in an environment variable**: no tracking per campaign, no counter, no revocation; a leak forces a
  redeployment. Rejected.
- **An administration page in the front end**: an administrator role, screens and their tests, for a few invitations
  per month. Rejected as long as the command line is enough.
- **Signed invitations without a table** (HMAC of the label and the expiry): no use counter, and no revocation without
  changing the key. Rejected.
- **Closing the whole site** (authentication in front of Firebase Hosting, Identity-Aware Proxy): requires Google
  accounts or a paid load balancer, and would also close the catalogue and the bot. Rejected.

## Consequences

- Changing the code key (in case of a leak) also invalidates the invitations in progress: new ones must then be
  created.
- An invitation that leaks is revoked with one command; `invitation_id` says which accounts come from it.
- Development and the e2e keep free sign-up; a supplied code is still checked there, which allows trying the
  invitation journey.
- The project owner creates invitations from the command line, and passes them on as a link.
