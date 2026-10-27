# US-044 — The quality gate ignores the Claude Desktop app worktrees

- **Epic**: EPIC-00
- **Status**: Done
- **Priority**: Must
- **Size**: XS
- **Branch**: `us-044-quality-gate-ignore-worktrees`

## Story

As a **developer**, I want **`npm run check` not to scan the Git worktrees created by the Claude Desktop app in the
project folder** so that **I do not see the quality gate fail on a copy of the repository that is not mine**.

## Context

Finding of 2026-10-19: `prettier --check .` fails on nine files of
`.claude/worktrees/frosty-elgamal-e2735d/apps/api/drizzle/meta/*.json`. The Claude Desktop app creates its Git
worktrees under `.claude/worktrees/` (ignored by Git through `.git/info/exclude`, a setting local to the machine).
However, `.prettierignore` excludes `apps/api/drizzle` at the root only, not its copies in a worktree. ESLint also
lints the whole copy (`eslint .` goes through a worktree file without ignoring it), which doubles its time and can
bring up the errors of another branch. Vitest (`include` anchored at the root), `ng test` (`apps/web/src`), Playwright
(`testDir: 'e2e'`) and the typecheck (`include: ["src"]`) are not affected.

## Acceptance criteria

- [x] **Given** a worktree present under `.claude/worktrees/`, **when** `prettier --check .` runs, **then** none of its
      files is checked.
- [x] **Given** the same worktree, **when** `eslint .` runs, **then** its files are ignored (measured with
      `eslint --debug .`: 149 files found with the ignore, 286 without).
- [x] **Given** the same worktree, **then** Vitest, `ng test`, Playwright and the typecheck do not scan it either
      (verified: `npx vitest list` lists no test under `.claude/`).
- [x] **Given** a clone without `.git/info/exclude`, **then** `.claude/worktrees/` is ignored by Git through
      `.gitignore`, so that these copies never appear in a commit.
- [x] `npm run check` passes while `.claude/worktrees/frosty-elgamal-e2735d` is present.

## Notes

- `.claude/launch.json` is versioned (configuration of the preview servers): only the `worktrees/` subfolder is
  ignored, not the whole of `.claude/`.
- The `frosty-elgamal-e2735d` worktree belongs to another session: it serves as proof, it is not deleted.

## Log

- 2026-10-19 — created, after `prettier --check .` failed on an app worktree.
- 2026-10-19 — delivered: Prettier, ESLint and Git ignore .claude/worktrees/; check green with the frosty-elgamal-e2735d worktree present (ESLint: 149 files instead of 286)
