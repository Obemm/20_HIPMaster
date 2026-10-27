# Way of working: epics and user stories

## Vocabulary

- **Epic** (`EPIC-XX`): a large goal, split into several stories. E.g. "Open a booster and see your cards".
- **User story** (`US-XXX`): a user need that can be delivered in a few hours to 2 days.
  Wording: _As a [persona], I want [action] so that [benefit]._
- **Acceptance criteria**: verifiable conditions (Given / When / Then format) that say when the story is finished.

Numbers are unique and never reused. A story belongs to a single epic.

## Story life cycle

`To refine` → `Ready` → `In progress` → `In review` → `Done`

- **Ready** (Definition of Ready): persona identified, benefit clear, acceptance criteria written, size estimated.
- **Done** (Definition of Done):
  - all acceptance criteria are verified;
  - `npm run check` and `npm run build` pass;
  - usable with a keyboard and on mobile (375 px wide), sufficient contrast;
  - tests added when there is logic;
  - [CHANGELOG.md](../../CHANGELOG.md) updated, status updated in the story file and in [TABLEAU.md](TABLEAU.md).
- To close a story, run `python scripts/close-story.py US-XXX "summary"`: it sets the status, ticks the criteria, adds
  the log entry and updates the board and the epic. The CHANGELOG is still written by hand.

## Traceability in Git

- **Branch** per story: `us-012-daily-booster`.
- **Commits**: Conventional Commits with the ID as scope: `feat(US-012): open a booster`.
- **Important decision** (technical choice, giving something up…): an ADR in [../decisions/](../decisions/README.md),
  cited in the story.

## Size (estimate)

`XS` < 1 h · `S` ½ day · `M` 1 day · `L` 2 days · beyond that: split the story.

## Priority (MoSCoW)

`Must` essential · `Should` important · `Could` bonus · `Won't` not now (kept for the record).

## Creating an epic or a story

Copy a template from [templates/](templates/), name it `EPIC-XX-short-title.md` or `US-XXX-short-title.md`, then add it
to [TABLEAU.md](TABLEAU.md).
