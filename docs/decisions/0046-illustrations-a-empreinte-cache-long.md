# 0046 — Hashed illustrations under `/illustrations/`, cached for a year

- **Date**: 2026-10-25
- **Status**: Accepted

## Context

The US-015 pipeline (ADR 0015) wrote `apps/web/public/cartes/set-1/<number>-<width>.<format>`: when an image was
redone (US-017), its name did not change. Served with `Cache-Control: public, max-age=86400` and kept by the service
worker (ADR [0038](0038-pwa-service-worker-angular.md)), the old image stayed displayed for players: on 2026-10-25,
the project owner did not see the new illustrations 53 to 71. The one-day cache was itself a compromise: without a
hash, images could not be kept longer (US-057, ADR [0039](0039-requetes-legeres-cache-compression.md)). Finally, the
illustrations shared the `/cartes/` prefix with an Angular route (the catalogue), and a missing image returned
`index.html` with a 200 (the `**` rewrite).

## Decision

- **Hash in the name**: each produced file is named `<number>-<width>.<hash>.<format>`, the hash being the first 8
  hexadecimal characters of the SHA-256 of its content (for example `53-640.a1b2c3d4.avif`). A redone image changes
  address; an unchanged image keeps its own, and stays in the cache.
- **Own prefix**: files go to `apps/web/public/illustrations/set-1/`, served at the root of the site under
  `/illustrations/set-1/` for both languages (ADR [0042](0042-site-bilingue-i18n-angular.md)). The old
  `/cartes/set-1/` folder disappears.
- **Manifest**: `illustrations.generated.ts` carries, besides the alternative texts, `FICHIERS_SET_1` (number → format
  → width → file name); the front end builds its `srcset` from these names. The script deletes any file of the folder
  that is no longer expected (removed card, or old hash).
- **Firebase Hosting**: `/illustrations/**` is served with `Cache-Control: public, max-age=31536000, immutable`, like
  Angular's hashed bundles; the rewrite to the root page becomes `!/illustrations/**` (exclusion documented by
  Firebase), so a missing illustration answers **404**.
- **Service worker**: the `images` group of `ngsw-config.json` follows the `/illustrations/**` pattern, an absolute
  address that each language takes over unchanged.
- **Checks**: a test verifies that each versioned file carries the hash of its content and that the manifest is up to
  date; `scripts/gcp/hebergement.test.ts` verifies the header and the absence of a rewrite; the production e2e tests
  verify, in both languages, the address, the header and the 404; the `site` step of the deployment checks an
  illustration of the build and a missing address on the live site.

## Alternatives considered

- **Version parameter in the URL** (`…/53-640.avif?v=a1b2`): the file on disk does not change name, so an old
  published version and a new one compete for the same resource; some caches ignore the query string.
- **Folder per set version** (`/illustrations/v3/…`): each change to one image makes all the others be downloaded
  again.
- **Keeping a short cache** (one day, or `no-cache` with revalidation): simple, but every visit revalidates up to 284
  files and the old image stays visible until expiry.
- **Letting Angular hash the images** (`outputHashing: media`): it only hashes files referenced by CSS, not those of
  the `public/` folder.

## Consequences

- A viewed illustration is never downloaded again, and a redone image appears with the next front-end version.
- The front-end manifest grows by about 10 KB (uncompressed): the names of 284 files.
- Regenerating with another version of `sharp` can change the bytes, hence the names, even without a new original:
  this is correct (the content has changed) but produces a wider diff.
- The immutable header also applies to the 404 response of a missing address: harmless, since a hashed name is only
  published with its content, in the same site version.
- The old `/cartes/set-1/…` addresses now lead to the root page, like any path without a language.
