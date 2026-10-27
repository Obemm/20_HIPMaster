# EPIC-09 — Going live on Google Cloud

- **Status**: Done
- **Priority**: Must

## Goal

Put HIPMaster online in the project owner's Google Cloud space, for the integration team and colleagues **by
invitation** (choice of 2026-10-22), **at no cost**: Firebase Hosting, Cloud Run and a free Neon database, which
Claude installs, deploys and maintains from the command line
(ADR [0021](../../decisions/0021-hebergement-gcp.md), accepted on 2026-10-22). The detail of the findings is in the
[review before going live](../../revues/2026-10-22-revue-mise-en-ligne.md).

## Success indicator

- An invited colleague creates their account, opens a booster and wins a game from their phone, at the game's public
  address.
- A merge into `main` is live in under 15 minutes, with no manual step; a rollback takes under 5 minutes.
- The monthly bill stays under €1 and database usage stays under its free quota; an outage triggers an alert.

## Stories

- [x] US-046 — An API ready for Cloud Run
- [x] US-047 — The essential protections before opening
- [x] US-048 — Sign-up by invitation
- [x] US-049 — Free and reproducible infrastructure
- [x] US-050 — Continuous deployment to Cloud Run and Firebase Hosting
- [x] US-051 — Monitoring, verified backups and security scan
- [x] US-052 — Games against the bot kept in the database
- [x] US-053 — Privacy page and deletion of one's account
- [x] US-054 — Sessions that expire and data that does not pile up
- [x] US-055 — A front end that is robust to cold starts and expired sessions
- [x] US-056 — The CI tests the API on a real PostgreSQL
- [x] US-057 — Light requests: indexes, bounded reads, cache and on-demand loading
- [x] US-058 — Fair duels: unpredictable randomness and safe matchmaking
- [x] US-072 — An "Invite" page reserved for the project owner

Suggested order, in three batches:

1. **Before the first go-live** (the site exists, only the project owner plays on it): US-046, US-056, US-047,
   US-048, US-055, US-049 and US-050.
2. **Before sending the invitations**: US-052 (without it, every deployment erases games in progress), US-051,
   US-053, then the mobile ergonomics of EPIC-10 (US-059, US-060).
3. **Afterwards**: US-054, US-057, US-058.

US-072 (decided on 2026-10-23) is added to batch 2: inviting from the site, with the project owner's account only,
before sending the invitations.

## Out of scope

- Public opening to everyone (without invitation): it would require reviewing the use of trademarks and the exposure
  to abuse.
- `stg` pre-production environment: planned by ADR 0021, to be created when the delivery pace justifies it.
- Personal domain: the `hipmaster.web.app` address is enough to start with.
- Web application firewall (Cloud Armor): it requires a load balancer, out of budget at this scale.
