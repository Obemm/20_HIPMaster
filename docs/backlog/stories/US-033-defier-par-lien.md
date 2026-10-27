# US-033 — Challenge a colleague by link

- **Epic**: EPIC-06
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-033-defier-par-lien`

## Story

As a **signed-in player**, I want to **send a challenge link to a colleague** so that **I can play against them
without looking for their username**.

## Acceptance criteria

- [x] From "Play", I choose "Challenge a colleague" and my deck; I get a link to copy ("Copy the link" button).
- [x] **Given** the link, **when** my colleague opens it, **then** they see who is challenging them, choose their
      deck and accept; without an account, they are invited to create one, then return to the challenge.
- [x] A challenge can only be used once; I cannot accept my own challenge; a challenge that is not accepted expires
      after 7 days, and I can cancel it before then.
- [x] Screen tests and e2e journey with two browsers (create the challenge, accept it); axe-core audit green.

## Notes

- The link carries the identifier of the waiting duel (unguessable UUID).

## Log

- 2026-10-19 — created (split of EPIC-06, ADR 0020 proposed).
- 2026-10-19 — API: `DELETE /duels/{id}` (cancellation by the creator, as long as the challenge has not been taken
  up) and expiry of challenges after 7 days, evaluated on read (410). Front end: "Challenge a colleague" from "Play"
  (`/duels/nouveau`), `/duels/:id` page (link to copy and cancellation for the creator, who sees the challenge taken
  up without reloading; invitation to take up the challenge for a colleague; invitation to create an account then
  return to the challenge via `?retour=`, limited to internal paths). Until the duel screen (US-034), the page
  announces whose turn it is. Tests: API (3 more), screens (6), e2e (4, with two and three browsers, axe in light and
  dark).
- 2026-10-19 — delivered: Challenge a colleague by link: challenge to share, invitation, cancellation, expiry
