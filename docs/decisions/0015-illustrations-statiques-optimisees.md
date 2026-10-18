# 0015 — Card illustrations: optimised static files, originals kept out of the repository

- **Date**: 2026-10-18
- **Status**: Accepted

## Context

EPIC-05 gives an illustration to each of the 71 cards of set 1, with a target: images optimised as WebP or AVIF, under
100 KB, with alternative text. The originals produced by a generator (Recraft or another) weigh several megabytes
each; the card is displayed at about 170 px wide in a phone grid, and up to about 300 px in the detail view.

## Decision

- **Originals**: one PNG per card, in **4:3** format, placed in `packages/illustrations/sources/set-1/<numero>.png`.
  This folder is **ignored by Git**: 71 originals of several megabytes each would weigh the repository down for good.
- **Variants**: the `npm run illustrations` script (package `@hipmaster/illustrations`, with `sharp`) produces for each
  card **two widths (320 and 640 px) × two formats (AVIF and WebP)** in `apps/web/public/cartes/set-1/`. These files
  are **versioned**: they are what the game serves. A test rejects any file of 100 KB or more.
- **Metadata**: `packages/illustrations/set-1.json` describes each illustration: card number, alternative text,
  generation instruction (_prompt_) and provenance (tool, date). The script derives from it a typed manifest,
  `apps/web/src/app/cartes/illustrations.generated.ts`, which the front end imports: it knows without a request which
  cards have an image.
- **Display**: a `<picture>` element (AVIF then WebP, `srcset` on the two widths, fixed dimensions, lazy loading). A
  card without an illustration keeps its background and its family pictogram (US-009).
- **Going live** (ADR 0008): the variants go to an **Azure Storage Account** behind a CDN, and the originals are
  archived there in a private container. Until then, the originals stay on the project owner's workstation and in the
  generator's history.

## Alternatives considered

- **Originals in Git** (or Git LFS): simple to restore, but about 150 MB of history added to the repository, and LFS
  needs a GitHub quota.
- **On-the-fly optimisation** (Angular `NgOptimizedImage` with an image service, or a CDN that resizes): depends on an
  online service that does not exist yet.
- **A single size in WebP**: simpler, but the image is blurry in the detail view on a high-density screen, or too
  heavy in the grid.
- **Images in the database**: rejected, files stay out of the database.

## Consequences

- The game calls no image service: everything is static, served by the front end.
- Regenerating the variants requires the originals: they must be archived before changing workstation.
- The `@hipmaster/illustrations` package depends on neither Angular nor the API; the game domain is not touched.
