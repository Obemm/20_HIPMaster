# 0037 — "Electric night" visual identity: brand tokens, self-hosted font, night shell

- **Date**: 2026-10-24
- **Status**: Accepted (validated by the project owner on 2026-10-24)

## Context

The review of 2026-10-22 and the project owner say the same thing: the site "looks like a management application".
Greyscale interface (the accent was the text colour), system font, no logo, Angular's tab icon, a home page without a
single card, booster odds in a table. Only the cards had colour. The owner asks for "a real online game site, with an
attractive design".

Constraints: strict CSP of `firebase.json` (no inline style or script, resources served by the site, no CDN), AA
contrasts in both themes (ADR 0012), designed for the phone first (the board fits in 375 × 667), weight budget of
free hosting, illustrations still provisional (night-blue background and halos, ADR 0016).

## Decision

1. **An "electric night" atmosphere**, that of the illustrations: night blue (`#0b1029`), two halos (violet at the top
   of the page, cyan at the bottom) and a discreet dot pattern. The light theme stays (ADR 0012): pale lavender
   background, the same halos toned down, white surfaces.
2. **The game shell stays night in both themes**: banner, logo and tab bar, like the back of a card. Its tokens are
   redefined on `.coquille`; the browser bar takes its colour (`theme-color`).
3. **Two brand colours, each with its role**:
   - **electric indigo** (`--hip-accent`: `#4f46e5` in light, `#a5b4fc` in dark) for links, selection and focus;
   - the **gold** of energy, like Throughput (`--hip-action` `#fbbf24`, text `#1f1400`), reserved for **a screen's
     main action** ("Play against the bot", "Open a booster"…), as a raised button; a dark gold (`--hip-or`
     `#b45309`) for gold text on a light background;
   - pink `#e11d48` for notification badges; rarity frames keep their hues (US-009).
4. **A self-hosted title font: Exo 2** (OFL licence), a single variable file (weights 100 to 900) reduced to Latin
   characters, French included, 41 KB, served from `public/polices` and preloaded. It is used for titles, buttons,
   card figures and tabs on desktop; body text keeps the system font.
5. **Shared components as global CSS classes** (`bouton`, `bouton-jeu`, `bouton-plein`, `bouton-contour`, `panneau`,
   `tuile`, `puce`, `titre-page`, `surtitre`, `lien`, `dos-carte`, `gemme-debit`) in `styles.css`: the CSP forbids
   the stylesheets that Angular components inject into the page.
6. **An SVG logo**: two fanned cards, the face carrying a gold hub of connections (integration). It serves as the
   favicon (SVG, and ICO 16/32/48 for browsers that require it), the home-screen icon (180 px) and the preview image
   of shared links (Open Graph, 1200 × 630 as JPEG, taken from the real rendering of the home page).
7. **Restrained micro-animations**, all under `prefers-reduced-motion: no-preference`: page fade-in (200 ms, opacity
   only so as not to shift the game's fixed elements), the home page fan that unfolds, a button that presses down, a
   tile that lifts.
8. **Contrasts are checked by a test** (`apps/web/contrastes.test.ts`), halos included: axe does not measure text
   placed on a gradient. For the same reason, buttons and card frames get their relief from shadows, never from a
   gradient behind text.

## Alternatives considered

- **Dark theme only** (WikiMasters, most games): more spectacular, but ADR 0012 keeps the system's choice; the night
  shell gives the identity without imposing dark on the pages.
- **A rounded mobile-game font** (Lilita One, Baloo 2, Fredoka): very "game", but childish for an acculturation tool
  and less readable when small; **Oxanium** (techno, 16 KB): close, colder. Exo 2 holds both registers, technical and
  game.
- **The font through an npm package** (`@fontsource`): provenance tracked by the dependencies, but the import goes
  through the Tailwind chain then esbuild and copies all the variants; a committed file with its licence beside it is
  simpler.
- **A component library** (Angular Material…): weight, and precisely the look of a management application.
- **A Figma mock-up first**: impossible tonight; the before and after screenshots attached to the PRs stand in for it,
  and a mock-up remains possible for later changes.
- **Gradients on buttons and frames**: shinier, but axe would no longer check the contrast of the text placed on
  them.

## Consequences

- New tokens (`surface-haute`, `bordure-forte`, `action`, `sur-action`, `or`, `succes`, halos, pattern, shadow): every
  interface colour stays a token, in both themes, and passes the contrast test.
- 41 KB of font at first load (preloaded, then cached); the logo and icons weigh less than 20 KB.
- To stay under the 500 KB budget of the initial bundle (504 KB with the enriched home page), the game board, the
  duel and the "Invite" page are loaded on demand: 438 KB at first load (110 KB transferred).
- Screens adopt the shared classes as US-068 progresses; the graphic charter describes them.
- The axe audit classes the contrast of text placed directly on the backdrop as "incomplete": the tokens test covers
  it.
- The preview image shows real cards: to regenerate when the final illustrations arrive (US-017).
