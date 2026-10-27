# US-078 — Fingerprinted illustrations, cached for a year

- **Epic**: EPIC-05
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Decision**: [ADR 0046](../../decisions/0046-illustrations-a-empreinte-cache-long.md), which completes ADR 0015
- **Branch**: `us-078-illustrations-empreinte`

## Story

As a **player on a phone**, I want **illustrations I have already seen never to be downloaded again** so that **the
catalogue and the games display quickly, even on an average network**.

## Context

Carried over from US-057 (2026-10-24), of which it was the last criterion: the illustrations
(`apps/web/public/cartes/`, US-015 pipeline, ADR 0015) have no fingerprint in their name; `firebase.json` can
therefore only keep them for a day (`max-age=86400`), and they share the `/cartes/` prefix with an Angular route (the
catalogue). The pipeline and the files change with US-017, in progress: the story is carried out with it or just
after.

## Acceptance criteria

- [x] **Given** the illustration pipeline, **then** every produced file carries a fingerprint of its content in its
      name (`53-640.a1b2c3d4.avif`, 8 characters of the SHA-256), picked up by the manifest the front end reads; the
      script deletes orphan files (card removed, old fingerprint).
- [x] **Given** a redone image, **then** it changes name, and the old one is no longer served.
- [x] **Given** Firebase Hosting, **then** the illustrations are served under their own prefix (`/illustrations/`, the
      old `/cartes/set-1/` disappears), kept for a year (`Cache-Control: public, max-age=31536000, immutable`), and a
      missing image answers 404 (not `index.html`).
- [x] **Given** the service worker (ADR 0038), **then** its image group follows the new prefix, in both languages.
- [x] **Given** the deployment, **then** the `site` step and the production e2e tests check the header of an
      illustration and the 404 of a missing illustration, in French and in English.

## Technical notes

- The 284 versioned files are renamed by the fingerprint of their current bytes (no re-encoding: the originals are not
  in the repository), then the manifest is regenerated; `npm run illustrations` produces the same names from the same
  bytes.
- Catch-all rewrite: `!/illustrations/**` → `/index.html`, an exclusion documented by Firebase Hosting.

## Log

- 2026-10-24 — created, carried over from US-057.
- 2026-10-25 — refined and coded: the owner did not see the new illustrations 53 to 71 (same name, one-day cache and
  service worker). Fingerprint in the name, `/illustrations/` prefix, one-year cache, 404, ADR 0046.
- 2026-10-25 — delivered: fingerprinted illustrations under /illustrations/, cached for a year, 404 if missing,
  service worker and deployment checks up to date (ADR 0046)
