# US-009 — Playing-card style card design

- **Epic**: EPIC-05
- **Status**: Done
- **Priority**: Should
- **Size**: L
- **Branch**: `us-009-design-cartes`

## Story

As a **player on the integration team**, I want **the cards to look like real collectible cards**
so that **I feel like browsing them, collecting them and showing them off**.

## Acceptance criteria

### The card (reusable `hip-vignette-carte` component)

- [x] **Given** a card from the catalogue, **then** it is displayed in portrait format (ratio close to 5:7), with
      rounded corners, with from top to bottom: a banner (rarity badge and cost in Throughput), an **illustration
      area**, the name in bold, the type and the family, a short text (effect or abilities), then a separate footer
      with **Attack** (sword icon) and **HP** (shield icon) for components and evolutions.
- [x] Each **rarity** has its own frame and background (common, rare, epic, legendary, increasingly pronounced), and
      can also be read through a label and a symbol, never through colour alone.
- [x] Each **family** has its own accent colour and pictogram, reused in the illustration area as long as the real
      illustrations (later stories of EPIC-05) do not exist.
- [x] The component depends only on the API data: it will be used as is for the deck, the boosters and combat.

### The catalogue

- [x] On a phone (375 px), the cards are displayed in a **2-column grid**, then 3 to 5 columns on wider screens,
      without horizontal scrolling.
- [x] The filters by family and by rarity and the counter announced to screen readers are kept.

### The detail (WikiMasters style)

- [x] **When** I choose a card, **then** its detail opens in a **modal window** above the catalogue: the card enlarged
      on one side, a panel on the other (stacked on a phone) with the name, a rarity badge, Throughput / Attack / HP
      tiles, the described abilities, the effect, the "In real life" text and, for an evolution, the link to its
      source card.
- [x] The URL `/cartes/:numero` opens this detail directly and stays shareable; on closing (button, Escape key, click
      outside), I get back to the catalogue **with my filters** and the focus returns to the chosen card.
- [x] In the modal, the focus stays trapped and the title is announced (`dialog` role, `aria-modal`, accessible name).

### Quality

- [x] Contrasts meet WCAG AA on every rarity frame; hover effects respect `prefers-reduced-motion`.
- [x] Unit tests of the card component and of the modal; the catalogue e2e journeys are adapted, with no axe-core
      violation on mobile and desktop; `npm run check`, `npm run build` and `npm run test:e2e` pass.
- [x] A screenshot of the card and of the detail, on mobile and desktop, is attached to the PR.

## Notes

- **Visual reference**: the card detail window of WikiMasters (screenshot shared by the project owner on 2026-10-18).
  ATK / DEF is transposed into Attack / HP and the cost in Throughput is added. Neither their visuals nor their icons
  are reused: only the composition.
- **Out of scope**: labels, favourites, market and auctions, discarding in exchange for currency (EPIC-03 and
  EPIC-07); real illustrations and the image optimisation pipeline (later stories of EPIC-05); holographic effects.
- **Icons**: inline SVG in the project, with no new dependency.
- **Theme**: settled on 2026-10-18 by the project owner, the front end follows the system preference, light or dark
  ([ADR 0012](../../decisions/0012-theme-clair-sombre.md)).
- **Screenshots**: `docs/produit/captures/us-009-*.png`.

## Log

- 2026-10-18 — created, based on the WikiMasters screenshot; US-008 validated by the project owner.
- 2026-10-18 — ADR 0012 (theme following the system, colour tokens); components `hip-icone` (in-house SVG
  pictograms) and `hip-vignette-carte` (5:7 portrait, sizes in `cqw`, frame and halo per rarity, provisional
  illustration per family); catalogue as a grid of 2 to 5 columns; detail in a native `<dialog>` on a child route of
  the catalogue (filters kept, Escape, click on the backdrop, focus returned to the card); 13 front-end unit tests,
  e2e and axe-core audit in light and dark; screenshots attached. In review.
- 2026-10-18 — delivered: cards in a playing-card design (frame per rarity, provisional illustration per family), detail in a modal window, light or dark theme following the system (ADR 0012)
