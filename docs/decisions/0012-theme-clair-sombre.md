# 0012 — Light or dark theme following the system preference, through colour tokens

- **Date**: 2026-10-18
- **Status**: Accepted

## Context

US-009 gives the cards a real playing-card design, modelled on WikiMasters, which uses a dark theme. The front end
had only a light theme, with Tailwind colours hard-coded (`text-zinc-700`, `bg-white`…): in a browser in dark mode,
the page stayed white, and without an explicit background some texts became hard to read.

## Decision

- The front end **follows the system preference** (`prefers-color-scheme`): light by default, dark if the device asks
  for it. No in-app switch for now.
- Interface colours go through **tokens**: `--hip-*` CSS variables defined in `apps/web/src/styles.css` for each theme,
  exposed to Tailwind by `@theme inline` (`bg-fond`, `text-texte`, `text-texte-doux`, `border-bordure`, `bg-surface`,
  `bg-accent`…). Components no longer hard-code greys.
- The cards' **rarity frames** also have their tokens, adapted to each theme (`.cadre-commune` to
  `.cadre-legendaire`). Vivid colours specific to a family or a statistic use Tailwind's `dark:` variant, which
  follows the same system preference.
- `color-scheme: light dark` is declared, so that native controls (drop-down lists, scroll bars) follow the theme.
- Each theme must pass the axe-core audit (WCAG AA): the e2e journeys run it in light and in dark.

## Alternatives considered

- **Dark theme only** (like WikiMasters): closer to the reference, but forces dark on those who read better in light,
  and contradicts the established use of the light theme on the workstation.
- **Manual in-app switch**: useful later, but requires remembering a choice; the tokens will make it simple to add
  (a class on `<html>` that redefines the variables).
- **`dark:` variant everywhere, without tokens**: doubles every colour class in all templates, and makes adding a
  switch far more costly.

## Consequences

- Any new interface colour is first declared as a token, in both themes.
- The accessibility e2e journeys run in both themes, which makes the CI a little longer.
- A manual switch can be added without touching the components.
