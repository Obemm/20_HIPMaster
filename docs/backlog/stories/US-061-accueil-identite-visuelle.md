# US-061 — A visual identity and a home page that make you want to play

- **Epic**: EPIC-10
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-061-accueil-identite-visuelle`

## Story

As a **colleague receiving an invitation**, I want **to understand at a glance that HIPMaster is a card game, and want
to play it** so that **I create my account instead of closing the tab**.

## Context

Finding from the 2026-10-22 review: the interface is entirely in greyscale (zinc `--hip-*` tokens, the accent is the
text colour), with the system font and no logo. The home page shows a title, two buttons, a table of booster odds and
the "Project under construction" notice, but no card. Only the cards have colour (rarity frames, US-018 vector
illustrations).

Request from the project owner (2026-10-23): "redesign the site to make it a real online games app with an attractive
design". Work carried out overnight, without them: every choice is noted here, in ADR 0037 and in the PR description,
so they can validate or correct it on waking.

### What makes it look like a "management application" (survey of 2026-10-24, all pages, phone and desktop, two themes)

| Finding                                                                                 | Where                     | Handled by            |
| --------------------------------------------------------------------------------------- | ------------------------- | --------------------- |
| Greyscale palette, black (light) or white (dark) buttons, no brand colour               | everywhere                | US-061 (tokens)       |
| System font everywhere, titles with no character                                        | everywhere                | US-061 (Exo 2)        |
| "HIPMaster" as plain text, Angular tab icon                                             | banner, tab               | US-061 (logo)         |
| Plain white or black background, no decoration                                          | everywhere                | US-061 (night, glows) |
| Home page without cards: title, two buttons, table of percentages, "under construction" | home                      | US-061                |
| Shared link with no preview (no title, no image)                                        | messaging apps            | US-061 (Open Graph)   |
| A guest landing on a bare "My account" form                                             | account (invitation link) | US-061                |
| Lists of grey boxes (duels, decks), long paragraphs before being able to play           | play, duels               | US-068                |
| Filters as form drop-down lists                                                         | catalogue, collection     | US-068                |
| Progress as a bar and statistics tiles                                                  | collection                | US-068                |
| Boosters: one sentence and one button, no pack                                          | boosters                  | US-062                |
| Text screens (privacy, invite) with no visual hierarchy                                 | privacy, invite           | US-068                |

## Acceptance criteria

- [x] **Given** the colour tokens (ADR 0012), **then** a brand accent colour and its dark variant are defined and used
      by the main actions, with an AA contrast checked in both themes.
- [x] **Given** the typography, **then** a size scale and a titles font are chosen, self-hosted (no call to a
      third-party service), without degrading display time.
- [x] **Given** the header, **then** a logo (SVG) replaces the "HIPMaster" text, and the site has its own tab and home
      screen icon (see US-063): `public/favicon.ico` is currently Angular's default one.
- [x] **Given** the home page, **when** a visitor arrives, **then** they see a few cards from the set, the game's
      promise in one sentence, and a suitable main action ("Create my account" if they have an invitation, "Play"
      otherwise); "Project under construction" disappears; the odds per booster move to the boosters screen.
- [x] **Given** a link to the game shared in a messaging app, **then** the preview shows a title, a description and an
      image (Open Graph tags).
- [x] **Given** a 375 × 667 phone, **when** a visitor opens the home page, **then** the cards and the call to play fit
      in the first screen, and the game board still fits without scrolling.
- [x] **Given** a guest following their link (`/compte?invitation=…`), **then** the page welcomes them with the game's
      cards before the form.
- [x] **Given** the "reduce motion" preference, **then** none of the new animations is played.

## Decisions (ADR 0037)

- **"Electric night" mood**: the night blue and the illustrations' glows; the shell (banner, tabs) stays dark in both
  themes.
- **Electric indigo** for interactive elements, **gold** reserved for a screen's main action (energy, like
  Throughput), pink for badges.
- **Exo 2** for titles, buttons and numbers, a 41 KB file served by the site; body text in the system font.
- **Home page**: on phones, the three cards fanned out first (Apigee API Gateway, Solace Agent Mesh, FTP: from FTP to
  AI agents), then the game's name, the promise and "Play against the bot" in gold; a visitor sees "How to play" in
  three steps, a signed-in player finds their duels, boosters and collection as tiles; the eight families as chips.
  The home page also accepts `?invitation=`: the main action becomes "Create my account".
- **Labels**: "Play against the bot" rather than "Play" (we know we can play right away, without an account);
  "Discover the cards" rather than "See the card catalogue". The tagline keeps the informal "tu" of the old home
  page; the screens stay with the formal "vous".

- **Weight**: the enriched home page pushed the initial bundle to 504 KB (warning budget: 500 KB); the board (game and
  duel) and the "Invite" page are now loaded on demand: 438 KB (110 KB transferred).

## Before / after screenshots

- [Home page on phone](../../produit/captures/us-061-accueil-tel-avant-apres.jpg),
  [on desktop](../../produit/captures/us-061-accueil-bureau-avant-apres.jpg),
  [signed-in player](../../produit/captures/us-061-accueil-connecte-avant-apres.jpg)
- [A guest arriving](../../produit/captures/us-061-invitation-tel-avant-apres.jpg)
- [Board on phone](../../produit/captures/us-061-partie-tel-avant-apres.jpg): it still fits in 375 × 667.

## Notes

- Build on US-016's art direction (night-blue background and glows in the "Sunlit Sketches" style) so that the
  interface and the future illustrations speak the same language.
- the company [ref] (Figma): no mock-up tonight; the PR's before and after screenshots stand in for it.
- The link preview image (`apercu-lien.jpg`) is taken from the home page rendering: to be regenerated with the final
  illustrations (US-017).

## Log

- 2026-10-22 — created, from the design review before going live.
- 2026-10-24 — refined and started (overnight session): survey of what makes it look like a "management application"
  on all pages, ADR 0037, graphic charter.
- 2026-10-24 — delivered: "Electric night" identity (tokens, Exo 2, logo, icons, Open Graph), home page with fanned-out cards and call to play, guest arrival, odds per booster on the boosters screen (ADR 0037).
