# US-060 — Navigation designed for the phone

- **Epic**: EPIC-10
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-060-navigation-mobile`

## Story

As a **player on a phone**, I want **to move from one section to another with a thumb gesture** so that **I can find my
duels, my boosters and my collection without hunting for links**.

## Context

Finding from the 2026-10-22 review, at 375 px: when signed in, the header lines up "HIPMaster", "Duels", "Boosters",
"Collection" and the username, as small underlined links; the username wraps onto two lines. "Play against the bot"
and the catalogue are only reachable from the home page, and every page repeats a "← Home" link.

## Acceptance criteria

- [x] **Given** a screen narrower than 768 px, **then** a tab bar fixed at the bottom gives access to: Play, Duels
      (with the "your move" badge), Boosters (with the stock), Collection, Account; the current tab is indicated
      visually and by `aria-current`.
- [x] **Given** a wider screen, **then** the same navigation is in the header.
- [x] **Given** a visitor without an account, **then** the tabs that require an account lead to account creation, with
      a sentence saying why.
- [x] Every touch target measures at least 44 × 44 px; the bar never hides a screen's main action (bottom margin,
      safe area of notched phones).
- [x] **Given** a screen reader, **when** the player changes page, **then** focus moves to the new page's title, which
      is thereby announced.
- [x] E2e journeys adapted; the axe audit also checks the WCAG 2.1 and 2.2 AA rules (`wcag21aa`, `wcag22aa`).

## Notes

- To be designed together with US-059: the tab bar and the player's hand share the bottom of the screen during a game
  (the bar may disappear in a game).
- Choices made:
  - **A single navigation** (`<nav aria-label="Main navigation">`): bar fixed at the bottom below 768 px, header links
    above. Tabs: Play (`/jouer`), Duels ("your move" badge), Boosters (stock), Collection, Account (username on
    desktop). Each tab is at least 44 px high, the bar respects the safe area of notched phones
    (`viewport-fit=cover`, `env(safe-area-inset-*)`) and a spacer at the end of the page keeps it from hiding the
    bottom of a screen.
  - **In a game** (`/jouer/:id`, `/duels/:id`), the bar disappears on phones: the US-059 board keeps the whole screen;
    "Quit" takes you back to the navigation.
  - **Visitor without an account**: Duels, Boosters and Collection lead to their page, which already says why an
    account is needed and offers to create one; the Account tab is called "Create an account".
  - **Booster stock**: read at sign-in, then read again when the server announces the next refill (`prochainDans`),
    after an opening and after a win that earns a booster; never computed by the front end (ADR 0004, ADR 0019).
  - **Focus**: on every page change (not when a detail window opens on the same page), focus moves to the new page's
    `h1` title.
  - **WCAG 2.1 and 2.2 audit**: it flagged "Label in name" (2.5.3) on the hand's cards and the board's tokens, whose
    button wrapped all the card's text. The button is now placed over the thumbnail or token (purely visual) and alone
    carries the name: what a screen reader announces does not change.
  - The pages' "← Home" links disappear: the logo and the tabs replace them (except "My account", which the API
    session is changing in parallel).

## Log

- 2026-10-22 — created, from the design review before going live.
- 2026-10-23 — refined and started (batch 2, front-end session): choices noted above.
- 2026-10-23 — delivered: tab bar at the bottom below 768 px (booster stock, duels to play, aria-current, 44 px, safe area), hidden in a game, header on desktop, focus on the title on every page, axe audit WCAG 2.1 and 2.2 AA
