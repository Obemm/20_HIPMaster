# US-075 — An epic status that always matches its stories

- **Epic**: EPIC-00
- **Status**: Done
- **Priority**: Must
- **Size**: XS
- **Branch**: `us-075-statut-epics`

## Story

As the **project owner**, I want **the status and progress of each epic to be right, in its file as in the tracking
board** so that I can **see at a glance what is finished**.

## Context

Finding by the project owner (2026-10-23): finished epics were still "In progress". `scripts/cloturer-story.py` did
set the epic to "Done" in the board, but only ever wrote "In progress" in the epic's file (EPIC-00, EPIC-02, EPIC-04).
And the board's progress was not recounted when a story was added to an epic (EPIC-03 shown as 2/2 instead of 2/3,
EPIC-07 0/0 instead of 0/1, EPIC-10 0/5 instead of 0/6).

## Acceptance criteria

- [x] **Given** the closing of a story, **then** its epic's status is deduced from its stories ("Done" when all are
      done, "In progress" when some are) and is written identically in the epic's file and in the board.
- [x] **Given** `python scripts/cloturer-story.py --recompter`, **then** the status and progress of each epic are
      recomputed and rewritten everywhere, without closing anything: to be run after adding a story.
- [x] The repository's epics are recounted: no discrepancy between files and board.

## Log

- 2026-10-23 — created, following the project owner's finding.
- 2026-10-23 — delivered: epic status and progress deduced from their stories, identical in the epic's file and the
  board; --recompter option; all epics recounted
