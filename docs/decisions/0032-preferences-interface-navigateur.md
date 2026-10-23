# 0032 — Interface preferences kept by the browser

- **Date**: 2026-10-23
- **Status**: Accepted

## Context

Comfort batch 2 for phones adds small interface preferences: the "How to play?" help opens by itself only at the
first game (US-059), and the hints before "End my turn" can be turned off (US-065). These choices must last from one
visit to the next, including for a visitor without an account, who can play against the bot. The site has no cookie
or tracker, and the API session loads in parallel with a privacy page (US-053).

## Decision

- Interface preferences are kept in the browser's **`localStorage`**, under keys prefixed with `hipmaster.` (like
  the session token, ADR 0017). They are never sent to the API.
- A single Angular service (`PreferencesService`) reads and writes them, and exposes them as signals. Any read or
  write that is refused (strict private browsing, full storage) is ignored: the preference then holds for the visit.
- Only preferences with no consequence on the game go there: nothing the server decides (ADR 0004).

## Alternatives considered

- **Preferences in the account, in the database**: they would follow the player from one device to another, but
  require an account, an API route and a migration for minor settings; to reconsider if preferences multiply.
- **Cookie**: sent with every request to no use for the server, and subject to the consent banner we avoid.
- **Remember nothing**: the help would reopen at every game, which is exactly what the review of 2026-10-22
  criticises.

## Consequences

- Preferences are specific to each browser: a player on two devices sees the help once on each.
- The privacy page (US-053) can cite them as strictly functional local storage.
- Unit and e2e tests start from an empty storage: the help opens by itself, which must be allowed for in the
  journeys (or marked as seen before the first load).
