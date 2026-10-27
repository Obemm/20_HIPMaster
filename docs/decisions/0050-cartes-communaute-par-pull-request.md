# 0050 — Community cards proposed by pull request, from a fork, with a kit for the contributor's AI

- **Date**: 2026-10-27
- **Status**: Accepted
- **Completes**: [0011](0011-catalogue-cartes-versionne.md) (the catalogue is versioned code),
  [0022](0022-depot-public.md) (public repository) and [0047](0047-illustrations-generees-par-gemini.md) (generated
  illustrations, reviewed by the owner)

## Context

On 2026-10-19, EPIC-08 planned for contributors to propose their cards **from the game** (form, preview, "My
proposals"), for a reviewer to process them in a **review queue** in the application, then for a command to turn the
accepted proposal into code (ADR 0011). That amounted to three stories of size M to L, storage of proposals in the
database, a reviewer role and an identity ADR.

On 2026-10-27 the project owner specified who will contribute: **their colleagues, the architects**. They know Git and
GitHub, and already use AI code assistants. The repository is public (ADR 0022); every merge into `main` with a green
CI is deployed (ADR 0028). Adding a card touches about twenty files (US-077: card, "Learn more" sheet in French and
in English, translation, tests that count the cards, e2e journey, scaled-down illustrations, documentation).

## Decision

- **A community card is a pull request.** The contributor **forks** the repository and opens a PR to `main`. They have
  no write access to the repository: `main` and continuous deployment depend only on the project owner.
- **The contributor kit** is versioned in the repository:
  - `CONTRIBUTING.md` and the guide `docs/contribuer/`: card creation rules (families, types, rarities, orders of
    magnitude of statistics, existing abilities), content rules (confidentiality, tone), annotated examples and the
    life cycle of a proposal (US-027);
  - **a card-creation prompt** to give to the contributor's code assistant: it lists all the files to touch and
    requires `npm run check` to be green (US-028);
  - **an illustration prompt** to give to their image generator, with the reference image for the rendering, drawn
    from the rules of ADR 0047 (a distinct creature, no text, no logo, no real person) (US-028).
- **Review happens in the PR** (US-029): a "card" PR template carries the checklist (technical accuracy,
  understandable "In real life" text, confidentiality, no duplicate, plausible balance); `CODEOWNERS` requests the
  project owner's review; the CI checks the catalogue invariants. The project owner reviews and validates the
  illustration, as for other cards (ADR 0047), before merging.
- **Community cards follow the existing catalogue**: next numbers (75, 76…), same illustration folder, no separate
  set. They are distinguished by an **author** field on the card (display name chosen by the contributor), which
  serves for credit and for the "community" filter (US-030, US-031).
- **Illustrations**: the contributor produces the image with the tool of their choice and commits its **scaled-down
  versions** (`npm run illustrations`); the original, outside the repository (ADR 0015), is attached to the PR so that
  the project owner archives it.

## Alternatives considered

- **Form in the game, review queue and integration command** (initial plan of EPIC-08): accessible to non-developers,
  but three heavy stories, proposals stored in the database, a reviewer role to create, and a re-entry as code anyway.
  The targeted contributors do not need it.
- **Colleagues as repository collaborators** (write access): branches in the repository itself, slightly simpler for
  them, but every merge goes to production (ADR 0028): `main` would have to be protected and rights managed.
  Rejected in favour of the fork.
- **Separate community set**: more visible, but a second numbering and a second illustration folder in the domain and
  the front end. The author field is enough to tell the cards apart.
- **Proposals by message or in a workshop, integrated by the project owner**: remains possible for those who do not
  want to go through GitHub (the US-027 guide serves for this too), but the whole load falls back on the project
  owner.

## Consequences

- EPIC-08 needs no database, no proposal screen and no reviewer role: US-028 and US-029 become documentation and
  GitHub configuration, US-030 a domain field.
- The quality of a proposal depends on the prompt given to the AI: it must stay up to date with every change to the
  catalogue (new file to touch, new ability).
- Since the repository is public, a PR is visible to everyone **from the moment it is opened**, before any review: the
  guide's confidentiality rule applies to the contributor themselves, before opening the PR.
- The CI of PRs coming from a fork receives no secret (GitHub's default behaviour): nothing more to protect.
- **No story per card** (decision of the project owner, 2026-10-27): a card PR belongs to EPIC-08 and writes nothing
  in `docs/backlog/`. It is the only exception to the project's rule "all code in a story".
- **Kit in English** (decision of the project owner, 2026-10-27, US-086): the repository is shared with
  English-speaking colleagues. `CONTRIBUTING.md`, the guide and prompts of `docs/contribuer/` and the "card" PR
  template are in English; a proposal may be written in English, the contributor's AI writes the game texts in French
  (reference language, ADR 0043) and in English, and keeps in French what the project holds in French (comments,
  `cartes-set-1.md`, CHANGELOG). PRs are squash-merged, under a French title. It is the only exception to the
  project's rule "everything in French".
- **No new mechanic in a card PR** (same decision): no new ability, no effect that requires a new state or status of
  the combat engine. Such an idea becomes a separate story, handled by the project owner; the card prompt asks the AI
  to stop and flag it.
