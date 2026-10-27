# US-068 — A visual review of the whole site

- **Epic**: EPIC-10
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-068-revue-visuelle`

## Story

As the **project owner**, I want **a visual review of all the live site's pages** so that **I get a coherent, polished
whole, beyond the home page and the board**.

## Acceptance criteria

- [x] **Given** each screen (home, catalogue, card detail, account, boosters, collection, duels, game), **then** a
      screenshot at 375 px and on desktop, in both themes, is taken and its visual defects noted (alignments, spacing,
      title hierarchy, colours, empty and error states).
- [x] **Given** this survey, **then** the fixes are sorted and split into stories, or done here if they are small.
- [x] The rules adopted (spacing, sizes, shared components) are written in a charter page.
- [x] **Given** the e2e journeys, **then** they all pass, axe audit included, and the board still fits in 375 × 667.

## Survey (2026-10-24, after US-061's identity)

Screenshots of 16 screens, phone (375 × 667) and desktop (1280 × 800), light and dark: 64 screenshots before, 64
after (Playwright capture script, no window; sheets in `docs/produit/captures/us-068-*`).

| Screen                    | Defects noted                                                                              | Fix                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Play                      | A wall of rules before being able to choose; decks as text boxes; "Play with" in indigo    | Difficulty as tiles, decks as game boxes (flagship cards), "Play with" in gold, collapsible rule      |
| My duels                  | List of grey boxes, duel state drowned in text                                             | Duel cards: opponent's initial, state badge (Your move, Their turn, Victory…), golden edge            |
| Challenge / random        | "← Play" link, decks as text                                                               | Overline, decks as game boxes, action in gold                                                         |
| Challenge received, queue | "← Play" link, field and buttons in form style                                             | Page title, shared field, "Copy the link" and "Take up the challenge" in gold                         |
| Board (game, duel)        | "End my turn" same colour as the rest; opposing System on the background; dull end of game | "End my turn" in gold; System on a surface; "Victory!" in gold, logical next step in gold             |
| Boosters                  | One sentence and one button                                                                | Overline, "Open a booster" in gold; the pack and the reveal come with US-062                          |
| Collection                | Thin progress bar, grey tiles, form filters, "Missing" in grey text                        | Progress panel, golden gauge, rarities as card frames, filters in a panel, badges                     |
| Catalogue                 | Title and description in quotation marks, form filters                                     | Overline, instruction ("tap a card"), filters in a panel                                              |
| Card detail               | Statistics in grey boxes                                                                   | Figures in Exo 2 on a recessed background, "In real life" in a panel, "Learn more" as a shared button |
| My account                | "← Home" link (removed elsewhere by US-060), bare sections, seven button styles            | Sections as panels, shared fields, gold for "Create my account" and "Got it", red set apart           |
| Privacy                   | "← Home" link, long page with no landmarks                                                 | Overline, sections as panels                                                                          |
| Invite                    | Form and list in administration style                                                      | Panels, shared fields, status as a badge, "Create the invitation" in gold                             |
| Footer                    | A lone link                                                                                | Logo and game signature, link                                                                         |
| Empty and error states    | "Try again" in the old style                                                               | Shared button; messages unchanged (US-055)                                                            |

Nothing is big enough for a separate story: everything is done here, except the staged booster opening (US-062) and
installation on a phone (US-063), already planned.

## Before / after screenshots

- Phone: [Play and My duels](../../produit/captures/us-068-jouer-duels-tel-avant-apres.jpg),
  [Collection and My account](../../produit/captures/us-068-collection-compte-tel-avant-apres.jpg),
  [Challenge, board and boosters](../../produit/captures/us-068-defi-plateau-tel-avant-apres.jpg)
- Desktop: [Catalogue and detail](../../produit/captures/us-068-bureau-avant-apres.jpg),
  [Invite and privacy](../../produit/captures/us-068-bureau-2-avant-apres.jpg)

## Decisions

- **A single gold action per screen**: "Play with…", "Challenge with…", "Take up the challenge…", "End my turn",
  "Open a booster", "Create my account", "Create the invitation". Secondary actions are outlined or solid indigo,
  account deletion and attack are red.
- **A deck is presented like a game box**: its three flagship cards (the rarest, then the most expensive, according to
  the catalogue) in a mini fan, its name, its description. The catalogue (21 KB) is therefore read on "Play",
  "Challenge" and when taking up a challenge.
- **The short rule is collapsed** on "Play": the "How to play" help opens by itself on the first game (US-059), and
  the deck choice comes first.
- The "← Home" links on "My account" and on privacy disappear, as elsewhere since US-060; "← My account" stays on
  "Invite", which has no tab.
- Drop-down lists keep their system arrow: a background-image arrow would prevent axe from measuring the contrast of
  their text.

## Notes

- Project owner's request (2026-10-23), to be done after the visual identity (US-061) in order to start from the new
  charter.
- Charter: [graphic charter](../../produit/charte-graphique.md), completed with the screen components.

## Log

- 2026-10-23 — created, noted for later at the project owner's request.
- 2026-10-24 — refined and started (overnight session): survey of the 16 screens, fixes, charter completed.
- 2026-10-24 — delivered: Visual survey of the 16 screens (phone and desktop, two themes) and fixes: decks as game boxes, duels as cards with a state badge, main actions in gold, shared panels, fields and gauge, charter completed.
- 2026-10-24 — anomaly reported live: on phones, the hand's cards (80 px) cut off the attack and HP, the texts at their
  minimum size overflowing the card format. Below 7.5 rem wide, the illustration shrinks, the type · family line
  disappears and the name fits on two lines; e2e journey added (it failed before).
