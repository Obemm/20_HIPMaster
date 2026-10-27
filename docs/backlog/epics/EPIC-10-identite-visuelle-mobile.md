# EPIC-10 — Visual identity and comfort on a phone

- **Status**: Done
- **Priority**: Should

## Goal

Give the game a visual identity and the ergonomics of a real mobile game before inviting colleagues. Today the game
works but looks like a prototype: a greyscale interface, a home page with no card, a game board that does not fit on
a phone screen, navigation through small links (design review of 2026-10-22, see the
[review before going live](../../revues/2026-10-22-revue-mise-en-ligne.md)).

## Success indicator

- On a 375 × 667 px phone, a whole game can be played without scrolling the page.
- A colleague discovering the home page understands within 5 seconds that it is a card game about integration.
- No accessibility regression (axe audit of the e2e journeys, AA contrast in both themes).

## Stories

- [x] US-059 — A game board that fits on a phone screen
- [x] US-060 — Navigation designed for the phone
- [x] US-061 — A visual identity and a home page that make you want to play
- [x] US-062 — Opening a booster, a real moment
- [x] US-063 — Install the game on your phone (PWA)
- [x] US-068 — A visual review of the whole site

Suggested order: US-059 and US-060 before sending the invitations (EPIC-09, batch 2), then US-061, US-063 and
US-062.

## Out of scope

- The final illustrations of the 71 cards (EPIC-05, US-016 and US-017).
- Combat animations.
