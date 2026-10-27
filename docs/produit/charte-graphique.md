# Interface style guide

> "Electric night" identity set by US-061 ([ADR 0037](../decisions/0037-identite-visuelle-nuit-electrique.md)).
> The card illustrations have their own document: [art direction](direction-artistique.md).

## Principles

1. **A game, not a form**: you see cards before you read, and every screen has one main action, in gold.
2. **The night of the illustrations**: navy blue, violet and cyan halos, a dot pattern; the shell (banner, logo, tab
   bar) stays night-coloured even in the light theme, like the back of a card.
3. **A single gold action per screen**; the rest in indigo (links, selection) or outlined.
4. **Legible first**: AA contrasts in both themes, checked by a test; targets of at least 44 px; body text stays in the
   system font.
5. **Sober motion**: short, never looping, and none at all if the system asks to reduce animations.

## Colours (tokens of `apps/web/src/styles.css`)

Every interface colour is a `--hip-*` token, exposed to Tailwind (`bg-surface`, `text-texte-doux`…). A new colour is
declared in both themes and joins the pairs checked by `apps/web/contrastes.test.ts`.

| Token           | Light     | Dark      | Role                                                             |
| --------------- | --------- | --------- | ---------------------------------------------------------------- |
| `fond`          | `#f3f4fb` | `#0b1029` | Page background (under the halos and the pattern)                |
| `surface`       | `#ffffff` | `#151c3d` | Panels, tiles, fields                                            |
| `surface-haute` | `#e9ebf8` | `#1f2852` | Chips, hover, inset area                                         |
| `texte`         | `#151a36` | `#eef1ff` | Main text                                                        |
| `texte-doux`    | `#474f72` | `#b8c0e0` | Secondary text                                                   |
| `bordure`       | `#d6daee` | `#2c3768` | Decorative separators                                            |
| `bordure-forte` | `#7a82aa` | `#6b76ad` | Field outline (3:1)                                              |
| `accent`        | `#4f46e5` | `#a5b4fc` | Links, selection, focus, filled secondary button                 |
| `sur-accent`    | `#ffffff` | `#0b1029` | Text on the accent                                               |
| `action`        | `#fbbf24` | `#fbbf24` | The main action (gold button), the Throughput gem                |
| `sur-action`    | `#1f1400` | `#1f1400` | Text on gold                                                     |
| `or`            | `#b45309` | `#fbbf24` | Gold text (large heading only in light)                          |
| `alerte`        | `#b91c1c` | `#fca5a5` | Errors                                                           |
| `succes`        | `#15803d` | `#86efac` | Successes                                                        |
| Shell           | —         | —         | Dark theme tokens, whatever the theme (`.coquille`)              |
| Badge           | `#e11d48` | `#e11d48` | Notification counter of a tab, white text                        |
| Rarity          | —         | —         | `.cadre-commune` to `.cadre-legendaire`: frame, background, halo |
| Family          | —         | —         | `ILLUSTRATIONS_FAMILLE` gradients (`carte.ts`), always described |

## Typography

- **Headings, buttons, numbers, tabs**: Exo 2 (OFL), served by the site (`public/polices/exo-2-latin.woff2`, 41 KB,
  preloaded) — `font-titre` class, applied by default to `h1`, `h2`, `h3`.
- **Body text**: the system font (`system-ui`), which displays without waiting.

| Role                    | Class               | Size                                      | Weight |
| ----------------------- | ------------------- | ----------------------------------------- | ------ |
| Game name (home)        | `titre-hero`        | 3.25 → 5.5 rem depending on the screen    | 900    |
| Page title (`h1`)       | `titre-page`        | 1.875 → 2.625 rem depending on the screen | 800    |
| Overline (above the h1) | `surtitre`          | 0.8125 rem, spaced capitals               | 700    |
| Section title (`h2`)    | `text-2xl` or `-lg` | 1.5 rem (1.125 in a panel)                | 800    |
| Text                    | —                   | 1 rem                                     | 400    |
| Secondary text          | `text-sm`           | 0.875 rem                                 | 400    |

## Shapes and spacing

- Radii: button `0.875rem`, panel and tile `1.25rem`, chip as a pill; cards keep their proportions (`cqw`, US-009).
- Pages: `px-4` on phones, `px-6` beyond; `max-w-6xl` width for card grids, `max-w-3xl` for text screens; `gap-6`
  between the blocks of a page, `gap-12` between the sections of the home page.
- Shadows: `--hip-ombre` (soft in light, deep in dark, with a thin highlight at the top).

## Shared components (classes of `styles.css`)

| Class                                  | Use                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `bouton bouton-jeu`                    | The screen's main action, in gold and raised; `bouton-large` as a feature |
| `bouton bouton-plein`                  | Assertive secondary action (indigo)                                       |
| `bouton bouton-contour`                | Secondary action, next to a gold action                                   |
| `lien`                                 | Link within a text (indigo, underlined)                                   |
| `panneau`                              | Block set on the background: surface, border, shadow                      |
| `tuile` (+ `tuile-icone`, `-titre`)    | Shortcut to a screen, with its state ("3 in stock")                       |
| `puce`                                 | Round label (family, status)                                              |
| `surtitre`, `titre-page`, `titre-hero` | Heading hierarchy                                                         |
| `etape`                                | Step number                                                               |
| `hip-dos-carte` (`.dos-carte`)         | Card back: loading, pack                                                  |
| `hip-eventail-cartes`                  | Three cards fanned out (home, a guest's arrival)                          |
| `gemme-debit`                          | Throughput cost on a card                                                 |

Angular components have no styles of their own: the CSP refuses the style sheets they would inject.

### Screen components (US-068)

| Class or component                                               | Use                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `bouton-petit`                                                   | Secondary button in a list or a tight bar (at least 36 px tall)                      |
| `bouton-danger`                                                  | Action that destroys or attacks: outline and text in alert red                       |
| `etiquette`, `champ`                                             | Form label and field (text, drop-down list, date)                                    |
| `choix`                                                          | Radio button presented as a tile; the chosen tile takes the accent ring              |
| `hip-boite-deck` (`.mini-eventail`)                              | A deck as a game box: three flagship cards, name, description, supplied button       |
| `statut` + `statut-a-jouer`, `-attente`, `-victoire`, `-defaite` | State as a badge, always a word ("Your turn", "Victory")                             |
| `avatar`                                                         | A player's initial in a circle (decorative)                                          |
| `jauge`                                                          | Progress (collection): track and gold fill                                           |
| `hip-paquet-booster` (`.paquet`), `.pile-paquets`                | Sealed booster pack; the packs in stock fanned out (US-062)                          |
| `.carte-cachee`                                                  | Face-down card: a button, rarity shown by the edging, the halo and in words (US-062) |

## Screen templates

- **Page header**: an `surtitre` (the context: "Between players", "Set 1 · From FTP to agents"), the `h1` in
  `titre-page`, a sentence in `text-texte-doux` saying what to do.
- **Sections**: an `h2` in `text-xl font-extrabold`; the blocks set on the background are `panneau` (`p-4`).
- **Lists of game objects** (decks, duels, invitations): tiles or panels, never table rows; the state in `statut`, the
  action on the right on desktop, full width on phones.
- **Filters**: a grid panel (one column on phones, two or three beyond), `etiquette` + `champ`.
- **Empty states**: a sentence saying why and a link to the action that fills it ("open a booster"); **errors**:
  `hip-erreur-chargement` (the cause in player's words, "Retry").
- **Back**: the tab bar is enough; a "← …" link only for a screen without a tab ("Invite").

## Icons and images

- Icons: `hip-icone` (24 × 24 grid, 2 px stroke, drawn for the project), always accompanied by text.
- Logo: `public/logo.svg` (two cards fanned out, a gold connection hub). Derivatives: `favicon.ico` (16, 32, 48 px),
  `apple-touch-icon.png` (180 px, on the night), `apercu-lien.jpg` (Open Graph preview 1200 × 630, taken from the
  real rendering of the home page fan in the dark theme: to be regenerated with the final illustrations).

## Motion

All animations are under `@media (prefers-reduced-motion: no-preference)`:

- page opening: a 200 ms fade (opacity only: a `transform` on `<main>` would shift the fixed elements);
- home page fan: the cards unfold once (700 ms, staggered by 90 ms);
- raised button: it sinks 3 px when pressed; tile and clickable card: they lift on hover;
- booster opening (US-062): the pack shakes during the opening, the cards are dealt face down (350 ms, staggered by
  90 ms), a flipped card pivots (450 ms), an epic or a legendary bursts out in a flash (0.9 s, 1.3 s for a legendary).

## Accessibility

- Contrasts: `apps/web/contrastes.test.ts` checks each token pair in both themes, the cards of each rarity, the shell
  and the text set on the halos; the e2e journeys pass the axe audit (WCAG 2.2 AA).
- Focus: a 3 px ring in the accent colour, offset by 3 px, on every interactive element.
- No gradient behind text (axe could no longer measure the contrast): the relief comes from the shadows.
