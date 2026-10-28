# US-093 — Fix the contributor kit after a first trial

- **Epic**: EPIC-08
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-093-contributor-kit-frictions`

## Story

As an **architect proposing a card with my AI assistant**, I want **a kit that holds no trap** (a red CI that is not
my fault, a check that contradicts another, a balance warning nobody tells me how to handle) so that **my first card
PR passes the CI and the review without back-and-forth**.

## Acceptance criteria

- [x] `e2e/contributeurs.spec.ts` does not depend on the community cards of the real catalogue: the mocked
      `/api/v1/cartes` responses set the author of every card, and the empty-state journeys mock a catalogue with no
      author; the card prompt (step 5) lists this file among the card counts to update.
- [x] `CONTRIBUTING.md` says, like the card prompt, that the illustration test stays red until the picture is added,
      and that `npm test -w @hipmaster/web` then runs the front-end tests.
- [x] The guide and `CONTRIBUTING.md` say that the contributor measures the balance before the PR on two seeds
      (`npm run simuler:carte -- <n>`, then `-- <n> 400 2`), adjusts the card when a ⚠️ is confirmed, decides with a
      third seed when the seeds disagree, and give the hint for a card too narrow (a fallback effect, like Idempotent
      Consumer's "otherwise draw a card").
- [x] The "card" PR template has a "Balance" section for the contributor's measurements.
- [x] The guide points to `docs/produit/cartes-set-1.md` and `set-1.ts` to check duplicates, and to
      `prompts-illustrations-gemini.md` before choosing the creature; it gives a benchmark for the power of spell and
      incident effects.
- [x] Step 6 of the card prompt matches `cartes-set-1.md` (English column names, "Author" column, "Composition" line);
      the model commit f189195 comes with a warning that its backlog and illustration files are out of scope.
- [x] Minor frictions: links that the AI could not open are flagged in the PR; the `ia` field of incidents is
      explained; `npm ci` is required in every new clone or worktree.

## Notes

- Source: the trial of 2026-10-28, an AI playing a first-time contributor who added a card no. 75 "Breaking change"
  (not merged) only from `CONTRIBUTING.md` and the documents it cites; 12 frictions, P1 to P3.
- Out of scope: the simulation output in French (`scripts/simuler-carte.ts`), the trial card itself.

## Log

- 2026-10-28 — created (EPIC-08), from the friction report of the contributor trial.
- 2026-10-28 — delivered: contributor kit fixed after the first trial: balance measured by the contributor on two seeds with rules and a Balance section in the card PR template, effect power benchmark, duplicate and creature pointers, prompt step 5 and 6 updated, CONTRIBUTING agrees on the illustration test, community e2e journeys independent of the real catalogue
