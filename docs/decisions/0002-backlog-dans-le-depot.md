# 0002 — Epic/story backlog in Markdown in the repository

- **Date**: 2026-10-16
- **Status**: Accepted

## Context

We want to work with epics and user stories and keep a trace of everything that is done, as on the other projects. The
project is not hosted on GitHub yet.

## Decision

The backlog lives in `docs/backlog/`: one file per epic and per story, a tracking board, and the story IDs in
branches and commits.

## Alternatives considered

- **GitHub Issues + Projects**: visual board and automatic link with PRs, but requires hosting the repository.
- **Jira / Trello**: external tools, separate from the code, oversized for a personal project.

## Consequences

- Works offline, full history in Git, readable by everyone (and by Claude).
- No drag-and-drop view: the board is updated by hand (or by `scripts/close-story.py`).
- Can be migrated to GitHub Issues the day the repository is published.
