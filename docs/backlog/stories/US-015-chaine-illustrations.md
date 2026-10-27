# US-015 — Illustration import and optimisation pipeline

- **Epic**: EPIC-05
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-015-chaine-illustrations`

## Story

As the **project owner**, I want to **drop in a card's original image and see it in the game, optimised, with a single
command** so that **I can illustrate the 71 cards without hand retouching or oversized images**.

## Acceptance criteria

- [x] **Given** a PNG dropped in `packages/illustrations/sources/set-1/<number>.png` and described in
      `packages/illustrations/set-1.json`, **when** I run `npm run illustrations`, **then** four files are produced in
      `apps/web/public/cartes/set-1/` (AVIF and WebP, 320 and 640 px wide, 4:3 format).
- [x] Each produced file weighs **less than 100 KB**; a test checks it on all the versioned files.
- [x] The script refuses, with a clear message, a missing original, one that is too small (under 640 px wide), an
      entry without alternative text, and an entry that targets a card number that does not exist.
- [x] The script writes the manifest `apps/web/src/app/cartes/illustrations.generated.ts` (number → alternative text).
- [x] **Given** a card that has an illustration, **then** the thumbnail displays it in its illustration area
      (`<picture>`, AVIF then WebP, `srcset`, `loading="lazy"`, fixed dimensions) with its alternative text; a card
      without an illustration keeps its background and its family pictogram.
- [x] The originals are ignored by Git; the procedure is explained in `packages/illustrations/README.md`.
- [x] `npm run check`, `npm run build` and `npm run test:e2e` pass, with no axe-core violation.

## Notes

- Storage and format decision: [ADR 0015](../../decisions/0015-illustrations-statiques-optimisees.md).
- The pipeline does not depend on any generator: it serves Recraft (US-016, US-017) as well as hand-made images.
- Out of scope: choosing the tool and the style (US-016), producing the 71 illustrations (US-017), sending the images
  to Azure (at go-live, ADR 0008).

## Log

- 2026-10-18 — created, when EPIC-05 was broken down; ADR 0015.
- 2026-10-18 — `@hipmaster/illustrations` package (validation of `set-1.json` with Zod, `sharp` variants in AVIF and
  WebP at 320 and 640 px cropped to 4:3 on the most striking area, quality lowered in steps below 100 KB, manifest
  formatted by Prettier, nothing is written on error, images of a removed card deleted); `npm run illustrations`;
  `ILLUSTRATIONS_CARTES` token and `<picture>` in `hip-vignette-carte`, family pictogram kept when there is no image.
  End-to-end trial with a synthetic original for the FTP card (4 files of 5 to 11 KB, 640 px AVIF chosen on a ×2
  screen), then removed: no real illustration is delivered. 20 unit tests added, 18 e2e journeys and axe-core audit
  green. In review.
- 2026-10-18 — merged with US-013 (game screen): inside a button (`titre` set to `false`), the illustration becomes
  decorative (empty alternative text) so as not to weigh down the button name; test added, 28 e2e journeys green.
- 2026-10-18 — delivered: illustration import and optimisation pipeline, merged by PR #12
