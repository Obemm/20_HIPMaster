# 0029 — Administrators designated by the API configuration, administration routes hidden behind a 404

- **Date**: 2026-10-23
- **Status**: Accepted
- **Completes**: [0017](0017-compte-invite.md) (guest account) and [0027](0027-inscription-sur-invitation.md)
  (sign-up by invitation, which rejected an administration page); builds on [0025](0025-protections-api.md) (rate
  limiting, revocable sessions)

## Context

Invitations (ADR 0027) can only be created from the command line, with the production secrets: the project owner
cannot invite a colleague from their phone. ADR 0027 rejected an administration page "as long as the command line is
enough"; it is no longer enough. Decision of the project owner (2026-10-23): an "Invite" page reserved to **their
account alone**, with no invitations by players.

Constraints: accounts have neither e-mail nor password (ADR 0017), only a session token and a recovery code; the
repository is public (ADR 0022); the front end is never authoritative (ADR 0004); development and the e2e must be able
to try the page without a production database.

## Decision

- **Who is an administrator: the API's `ADMINISTRATEURS` variable**, a list of player identifiers (UUIDs) separated by
  commas or spaces. Absent or empty: nobody. A value that is not a UUID prevents the API from starting
  (`ErreurConfig`). Outside production only, the value `tous` makes every account an administrator, for the e2e
  journeys and trying it out in development; in production, the API refuses to start with it.
- **The check is done on the server, on every request**: the session token designates a player, whose identifier must
  appear in the list. The front end decides nothing: it only shows or hides the link.
- **Every administration route (`/api/v1/admin/…`) answers 404 to any other caller** (no token, unknown or expired
  token, ordinary player), with the exact response of a route that does not exist. The check comes first (`onRequest`
  hook), before reading the body and before the rate limit: a non-administrator never gets a 400, 401, 403 or 429.
  Security does not rely on this secrecy (the repository is public); the 404 merely avoids pointing out a target to
  whoever probes the site.
- **The front end learns it from `GET /moi`** (and from account creation or sign-in): `administrateur: true` for an
  administrator, field **absent** otherwise. The response for an ordinary player does not change.
- **Routes** (contract `apps/api/openapi/administration.yaml`): `GET /admin/invitations` (the list, never the code),
  `POST /admin/invitations` (label, number of accounts, deadline: the code and the link, returned this one time),
  `POST /admin/invitations/{id}/revocation`. They call the functions of `apps/api/src/comptes/invitations.ts`, the same
  as the `npm run invitation` command, which remains available.
- **Visible revocation**: an optional `revoquee_le` column distinguishes a revoked invitation from an expired one;
  revoking also sets the expiry to that very instant, so the consumption of codes does not change.
- **The link** is built by the API with the site address, `ADRESSE_SITE`: `https://hipmaster.web.app` by default in
  production, `http://localhost:4200` elsewhere.
- **`administration` rate limit**: 60 requests per minute and per address on each route, applied once the
  administrator is recognised.
- **Log**: each creation and each revocation is logged with the administrator's identifier and the invitation's, never
  the code.
- **Deployment**: the list comes from the GitHub variable `HIPMASTER_ADMINISTRATEURS` (a variable, not a secret: an
  identifier alone opens no session), passed by the workflow to `scripts/gcp/deployer.sh`, which sets it on the Cloud
  Run service. From a workstation, the same environment variable. It is not written in the repository.

## Alternatives considered

- **A "role" column in the database**: a way to set it would be needed (SQL query in production, or one more command);
  a role changed in the database leaves no trace in the deployed configuration. Rejected for a single administrator.
- **An administration password** (shared secret typed into the page): a second secret to keep, to rotate, exposed to
  typing on a phone, and contrary to the spirit of ADR 0017. Rejected.
- **A Google account, a third-party identity provider, or Identity-Aware Proxy in front of the administration routes**:
  an identity provider and, for IAP, a paid load balancer (ADR 0021, 0027). Rejected.
- **Answering 403 to non-administrators**: more explicit, but it confirms the route exists. Rejected in favour of the
  404, at no cost to the administrator.
- **Leaving the command as the only means**: this is the situation that motivated the request. Kept as a fallback.

## Consequences

- Changing administrator requires modifying `HIPMASTER_ADMINISTRATEURS` then redeploying (re-running the last
  deployment is enough); an administrator who loses their account creates another, and the operations guide says how
  to replace their identifier.
- A stolen administrator session allows creating invitations: sessions are closed remotely ("Sign out my other
  devices", new recovery code, ADR 0025), invitations are revoked, and the log says who did what.
- The front end gains a page that no ordinary player sees; its tests run with `ADMINISTRATEURS=tous`.
- A migration adds the `revoquee_le` column, compatible with the version still live (ADR 0023).
