# 0045 — Boosters given away by code: counted-use codes under HMAC, one use per player, traced

- **Date**: 2026-10-24
- **Status**: Accepted
- **Completes**: [0019](0019-boosters-recharge-a-la-lecture.md) (boosters), on the model of
  [0027](0027-inscription-sur-invitation.md) (invitations) and [0029](0029-administrateurs-par-configuration.md)
  (administrators); relies on [0025](0025-protections-api.md) (codes key, rate limiting)

## Context

The project owner wants to make the game a tool for energising the integration team (US-070): giving away boosters to
reward a real achievement ("1st API published", "queue with the least cumulative delay"). **Manual attribution only**
(decision of 2026-10-23): they judge, create a code and pass it on; nothing is computed from the team's tools.

Constraints: invitations (ADR 0027) already settled the form of a code passed on by hand (HMAC hash, counted uses,
expiry, revocation), and the "Invite" page (ADR 0029) that of a page reserved for administrators; a code shared in a
team channel can leak; the same colleague must not benefit twice from a reward; the booster stock is computed at read
time (ADR 0019).

## Decision

- **A `codes_boosters` table**: the code's hash, a label (the achievement rewarded), the number of boosters given
  (1 to 20), the maximum number of uses (1 to 1,000) and uses consumed, the expiry, the creation and the revocation
  (`revoque_le`, which also sets the expiry, as for invitations).
- **A `boosters_offerts` table**: who received what (code, player, number of boosters, instant), with **a single row
  per player and per code** (primary key). It is the trace requested to follow a campaign or measure a leak; it
  follows the account (cascade deletion, ADR 0031), and a deleted code takes its trace with it.
- **The code**: 16 characters in four groups, like an invitation; **its hash**: HMAC-SHA-256 with the codes key
  (ADR 0025), prefixed with the use `boosters:`: a boosters code is valid neither as an invitation nor as a recovery
  code, and vice versa. The database never keeps the code, shown only once.
- **The label is shown to the player** who uses the code ("1st API published: 3 boosters given"), unlike that of an
  invitation: the administration page says so.
- **`POST /moi/boosters/codes`** (contract `boosters.yaml`), signed-in player: in one transaction, a query counts the
  use provided some remain and the code has neither expired nor been revoked (the row is locked, as in 0027), the
  trace is inserted (a key conflict = already used: everything is rolled back, nothing is consumed), then the player's
  stock, locked (ADR 0019), receives the boosters **above the refill cap**, like a victory booster.
- **Neutral refusal: 403**, a single message for an unknown, expired, revoked, exhausted or already-used-by-this-player
  code. **Rate limit** `codeBoosters`: 60 attempts per hour and per address (a whole team behind its office address
  can use the week's code; 80 bits cannot be guessed, the limit only bounds the noise).
- **Creation by the project owner, in two ways that call the same functions**
  (`apps/api/src/comptes/codes-boosters.ts`): the `npm run code-boosters` command (create, list, see the
  beneficiaries, revoke; PostgreSQL only, Cloud Run Job in production, like `npm run invitation`), and the "Give away
  boosters" page (`/offrir`), sister of "Invite", on the `/api/v1/admin/codes-boosters…` routes hidden as 404 from any
  other caller (ADR 0029), with the `administration` limit.
- **The link**: `/boosters?code=…` fills in the field of the "My boosters" page; the player confirms themselves. The
  code is removed from the address once read.
- **Log**: creation, revocation and use are logged with identifiers (administrator, code, player), never the code.

## Alternatives considered

- **Reusing the `invitations` table** with a type: the two codes have neither the same fields (boosters), nor the same
  trace (an account created against a booster received), nor the same refusal. Two simple tables are better than one
  table with optional columns. Rejected.
- **Assigning boosters directly to a player** (the administrator picks a username): accounts would have to be searched
  by username, which is not unique, and the player would not experience the moment of "receiving" their reward. A code
  passed on can also be shared with a whole team. Rejected, perhaps later.
- **Rewards computed from the team's tools** (published APIs, queue delays): rejected by the project owner (manual
  attribution).
- **A rate limit per player** rather than per address: fairer for a shared office, but the API's limiting is done per
  address (ADR 0025); the limit is wide enough for a team. Rejected as long as it suffices.
- **Automatic use on following the link**: a link opened by mistake, or by a messaging preview, must consume nothing.
  Rejected: the player confirms.

## Consequences

- Changing the codes key also invalidates the boosters codes in circulation (like invitations, ADR 0027).
- A leaked code is revoked with a click or a command; `boosters_offerts` says who used it, and when.
- Boosters given away may exceed the refill cap: refilling resumes when the stock drops back below the cap (ADR 0019).
- A migration adds two tables, compatible with the version still live (ADR 0023, 0028).
