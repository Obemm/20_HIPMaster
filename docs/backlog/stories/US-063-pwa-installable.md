# US-063 — Install the game on your phone (PWA)

- **Epic**: EPIC-10
- **Status**: Done
- **Priority**: Could
- **Size**: S
- **Branch**: `us-063-pwa-installable`

## Story

As a **player on a phone**, I want **to add HIPMaster to my home screen** so that **I can launch it like an app, full
screen, and find it quickly**.

## Context

ADR 0006 announces a front end "delivered as a PWA"; the 2026-10-22 review finds there is no web
manifest, no service worker and no icons: the game is not installable.

## Acceptance criteria

- [x] **Given** the live site, **then** a web manifest (name, theme colours, 192 and 512 px icons, maskable icon,
      `standalone` display) makes it installable on Android and iOS.
- [x] **Given** a returning player, **then** the interface and illustrations load from the service worker's cache
      (`@angular/service-worker`), and calls to `/api/` are never cached.
- [x] **Given** a newly published version, **then** the player is invited to reload instead of keeping the old one
      indefinitely.
- [x] **Given** no network, **then** a clear message says so (the game is played online: the server is authoritative,
      ADR 0004).
- [x] Installable according to Chrome: `Page.getInstallabilityErrors` returns no error (Lighthouse has had no PWA
      category since version 12: this Chrome check replaces its "installable" audit).

## Decisions (ADR 0038)

- **Angular's service worker**, active in production only: interface cached from installation, illustrations and icons
  on demand, **no API call cached** (no `dataGroup`).
- **Update**: checked on every load and every return to the tab; a "A new version of HIPMaster is ready" banner offers
  "Reload".
- **Offline**: the interface opens from the cache; a banner says "No network. HIPMaster is played online…" and
  disappears when the network returns.
- **Icons** taken from the US-061 logo, on the night background; the maskable icon keeps the logo within the safe
  zone.
- **Tests**: the e2e journeys block the service worker (it would bypass the simulated failures); `pwa.spec.ts`
  re-enables it and checks the manifest, the icons, installability and, on the production build, opening offline and
  the absence of the API from the cache.

## Screenshots

- [Offline banner on phone](../../produit/captures/us-063-hors-ligne.jpg)
- [Home screen icons](../../produit/captures/us-063-icones.png)

## Log

- 2026-10-22 — created, from the review before going live (gap between ADR 0006 and the code).
- 2026-10-24 — refined and started (overnight session): ADR 0038.
- 2026-10-24 — delivered: Web manifest and icons, Angular service worker in production (interface and illustrations cached, never the API), "new version" and "no network" banners, installability and offline opening checked in e2e on the production build.
