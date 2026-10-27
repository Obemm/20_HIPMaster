# US-062 — Opening a booster, a real moment

- **Epic**: EPIC-10
- **Status**: Done
- **Priority**: Could
- **Size**: M
- **Branch**: `us-062-ouverture-booster-mise-en-scene`

## Story

As a **player**, I want **to discover my cards one by one when I open a booster** so that **I feel the pleasure of
discovery, especially for a rare card**.

## Context

Finding from the 2026-10-22 review: the "My boosters" screen is a line of text ("5 boosters in stock") and a button;
opening shows the grid of 5 cards all at once with a "New!" label. This is the high point of a collectible card game
(WikiMasters, see `docs/produit/inspirations.md`).

## Acceptance criteria

- [x] **Given** boosters in stock, **then** the screen shows them as packs (visual), with the stock and the time before
      the next free booster.
- [x] **Given** an opened booster, **when** the cards arrive, **then** they are revealed one by one (gesture or tap),
      the rarity is visible before the flip, and an epic or legendary card has a stronger effect.
- [x] **Given** a player in a hurry, **then** a "Reveal all" button shows the 5 cards at once.
- [x] **Given** the "reduce motion" system preference, **then** no animation is played.
- [x] The draw is still made by the server (ADR 0004, 0019): the animation changes nothing about the result.
- [x] **Given** a screen reader or the keyboard, **then** each hidden card is a button that states its rarity ("Turn
      over card 1: Rare"), the flipped card is announced ("Card 1: FTP, legendary, new!") and focus moves to the next
      one, then to the summary.

## Decisions

- **The draw stays entirely server-side**: the response to `POST /moi/boosters/ouvertures` arrives before the staging,
  which only delays the display; the collection is already up to date when the first card flips.
- **Rarity can be read from the back**: a border in the rarity frame's colour, a glow for epics and legendaries, and
  the rarity spelled out under the card, with its symbol (colour is never alone).
- **The "New!" labels appear only once the card is flipped**, and the title counts the new ones only at the end ("5
  cards to flip", then "5 cards, 2 new"): no spoiled surprise.
- **Effects**: cards dealt one by one, pivoting flip, a burst of light behind an epic and a larger one behind a
  legendary, pack shaking during the opening. All under `prefers-reduced-motion: no-preference`: without animation,
  the cards flip at once, with no movement.
- **The packs in stock** are drawn in CSS (metallic foil, crimped edges, logo, "Set 1"): at most five fanned out, the
  exact number written next to them; a greyed-out pack when the stock is empty.

## Screenshots

- [The sequence on phone, before / after](../../produit/captures/us-062-ouverture-tel-avant-apres.jpg)
- [On desktop](../../produit/captures/us-062-ouverture-bureau.jpg)

## Log

- 2026-10-22 — created, from the design review before going live.
- 2026-10-24 — refined and started (overnight session, on the US-061 and US-068 charter).
- 2026-10-24 — delivered: Drawn packs, face-down cards that flip one by one or all at once, rarity on the back, burst of light for epics and legendaries, announcements and focus for keyboard and screen readers, animations turned off on request.
