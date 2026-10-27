# US-070 — Boosters given by code, to reward real work

- **Epic**: EPIC-03
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-070-boosters-par-code`
- **ADR**: [0045](../../decisions/0045-boosters-offerts-par-code.md)

## Story

As the **project owner**, I want **to give boosters by code** so that **I can reward the integration team's
achievements**: the first published API, the queue with the least cumulative lag, etc.

## Acceptance criteria

- [x] **Given** the administration command `npm run code-boosters` (modelled on `npm run invitation`, US-048),
      **when** the project owner creates a code with a label ("1st API published"), a number of boosters, a number of
      uses and an expiry date, **then** the code and its link are displayed only once and the database keeps only the
      HMAC fingerprint (ADR 0025, 0027, 0045).
- [x] **Given** an administrator (ADR 0029), **when** they open the "Give boosters" page (`/offrir`, from "My
      account"), **then** they create a code with the same settings, copy or share its link, see each code's usage and
      who used it; any other caller gets 404 on these routes.
- [x] **Given** a signed-in player, **when** they enter a valid code on the "My boosters" screen (or follow a
      `/boosters?code=…` link, which fills in the field), **then** they receive the boosters, which may exceed the
      refill cap (ADR 0019), and see the reward's label.
- [x] **Given** a code already used by this player, expired, revoked, exhausted or unknown, **then** the API answers
      with a neutral refusal (403, a single message), and attempts are rate-limited (60 per hour and per address,
      US-047).
- [x] The database keeps who used which code (to follow a campaign or revoke a leaked code); a leaked code is revoked
      from the page or the command, without taking back boosters already received.

## Design

- **Data** (migration `0015`): `codes_boosters` (fingerprint, label, boosters 1–20, uses 1–1000, expiry, creation,
  revocation) and `boosters_offerts` (code, player, boosters, instant; primary key code + player: one use per player),
  deleted with the account.
- **Codes domain**: `apps/api/src/comptes/codes-boosters.ts`, shared by the command and the routes: creation (16-character
  code, `boosters:` fingerprint), use in a single transaction (conditional counter, trace, locked stock), list,
  beneficiaries, revocation.
- **API**: `POST /moi/boosters/codes` (`boosters.yaml` contract, `codeBoosters` limit); `GET`/`POST
/admin/codes-boosters`, `GET /admin/codes-boosters/{id}/beneficiaires`, `POST /admin/codes-boosters/{id}/revocation`
  (`administration.yaml` contract).
- **Command**: `npm run code-boosters -- --libelle … --boosters N --utilisations N [--expire | --jours]`, `--lister`,
  `--beneficiaires <id>`, `--revoquer <id>`; Cloud Run Job in production (operations guide).
- **Front end**: "A gift code?" block on "My boosters", prefilled by `?code=` (removed from the address); "Give
  boosters" page (`/offrir`), sister of "Invite".

## Notes

- Project owner's request (2026-10-23): make the game a tool for energising the team, by linking rewards to real work.
- **Manual assignment only** (project owner's decision, 2026-10-23): they judge the achievement and create the code; no
  reward computed automatically from the team's tools.
- The label is seen by the players who use the code (unlike an invitation's).
- Translation (EPIC-14): the foundation was not yet on `main`; the new strings are to be marked along with the others.

## Log

- 2026-10-23 — created, noted for later at the project owner's request.
- 2026-10-23 — decision: manual assignment only, nothing automatic.
- 2026-10-24 — refined: design, ADR 0045; status "In progress".
- 2026-10-24 — delivered: boosters given by code: "Give boosters" page and npm run code-boosters, entry or link /boosters?code=…, neutral refusal with rate limiting, trace and revocation (ADR 0045)
