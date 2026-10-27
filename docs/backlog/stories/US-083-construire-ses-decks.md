# US-083 — Build, name and keep your own decks from your collection

- **Epic**: EPIC-15
- **Status**: Done
- **ADR**: [0048](../../decisions/0048-decks-des-joueurs.md)
- **Priority**: Should
- **Size**: L
- **Branch**: `us-083-construire-ses-decks`

## Story

As a **player**, I want to **compose my own decks with the cards of my collection** so that I can **play with my own
strategy and my favourite cards**.

## Acceptance criteria

- [x] **Given** a signed-in player, **when** they create a deck, **then** they choose their cards among those they own
      (filters by family, rarity and cost, cost curve and breakdown by family visible), name it, and save it; they can
      keep **5 at most**, edit, duplicate and delete them.
      → "My decks" (`/decks`) and the building screen (`/decks/nouveau`, `/decks/{id}`); the sixth deck is refused
      (409 `decks-plafond`), even when requested at the same time as the fifth (lock on the player's row).
- [x] **Given** the deck rules (20 cards, 2 copies at most, 1 for a legendary), **then** the screen says what is
      missing or in excess while building, and the server refuses an invalid deck or one that contains a card that is
      not owned (domain `validerDeck`, ADR 0004).
      → domain `problemesDeck` (stable codes), 422 with the code of the first problem and the full list, translated by
      the front end; a draft of fewer than 20 cards can be saved, flagged incomplete (ADR 0048).
- [x] **Given** a saved deck, **then** it is kept in the database with the account (OpenAPI contract first, compatible
      migration, ADR 0028), found again on another device, and deleted with the account (US-053).
      → `apps/api/openapi/mes-decks.yaml`, `decks` table (migration `0016_decks_joueurs.sql`, one table added), cascade
      foreign key; texts of "My account" and of the privacy page completed.
- [x] **Given** a deleted card, **then** its place is freed in the decks that contained it; these decks are flagged
      incomplete and are no longer offered for playing until they are completed.
      → domain `libererPlaces`, applied on every read (ADR 0048): the deck comes back without the vanished copy,
      `complet: false`, and "My decks" says how many places were freed. No longer offering it for playing: US-084.
- [x] A loaner deck can serve as a starting point ("copy this deck"), limited to owned cards.
      → "Start from a loaner deck" in "My decks": the copy only keeps the copies found in the collection.
- [x] Screen designed for the phone, accessible, translated into English (EPIC-14).
      → Sticky counter and "Save" at the top of the screen, card rows with two buttons (− / +); axe audit in both
      themes and English journey at 375 px (`e2e/decks.spec.ts`, `e2e/parcours-anglais.spec.ts`).

## Design (2026-10-26)

- **Domain** (`packages/domain/src/combat/decks.ts`): `DECKS_MAX = 5`, `problemesDeck(cartes, possedes?,
{ incompletPermis })` (codes `taille`, `carte-inconnue`, `exemplaires`, `non-possedee`), `libererPlaces`,
  `exemplairesMax`; `validerDeck` keeps its French sentences by relying on `problemesDeck`.
- **API**: `GET /moi/decks` (rules and effective decks), `POST /moi/decks`, `PUT` and `DELETE /moi/decks/{id}`;
  `no-store`, `ecritureDeck` rate limit (120 per minute). Codes: `decks-plafond`, `deck-introuvable`, `deck-taille`,
  `deck-exemplaires`, `deck-carte-inconnue`, `deck-carte-non-possedee`.
- **Front end** (`apps/web/src/app/decks/`): `MesDecksService` (loaded on sign-in), "My decks" (US-068's deck boxes,
  duplicate, delete after confirmation, copy a loaner deck), building screen (filters by family, rarity, cost; deck
  content; cost curve from 1 to "6+"; families; rules and what is missing or in excess). Access: "My decks" tile on the
  home page and link from "My collection".
- **Decisions**: ADR 0048 (5 decks, draft allowed, places freed on read without rewriting, rules served with the list,
  last save wins).

## Notes

- Request from the project owner (2026-10-26).
- Project owner's decisions (2026-10-26): **5 decks at most per player**; if a card is deleted (from the player's
  collection or from the catalogue), **its place is freed** in every deck that contained it: the deck becomes
  incomplete again, is flagged as such and can no longer be used to play until it is completed.

## Log

- 2026-10-26 — created, at the project owner's request (EPIC-15).
- 2026-10-26 — owner's decisions: 5 decks at most; a deleted card frees its place in the decks.
- 2026-10-26 — refined (design, ADR 0048), then coded: domain, table and migration, contract and `/moi/decks` routes,
  "My decks" and building screens, English texts, unit, API (PGlite and PostgreSQL 18) and e2e tests.
- 2026-10-26 — delivered: Own decks: 5 at most, built on a phone from the collection, checked by the server, places
  freed on read
