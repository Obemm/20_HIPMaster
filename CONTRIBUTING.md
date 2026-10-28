# Proposing a card

HIPMaster welcomes cards from the IT community: a technology, a pattern or an incident you have lived through, with a
short text that explains what it means in an information system. A proposed card is a **pull request**
(ADR [0050](docs/decisions/0050-cartes-communaute-par-pull-request.md)).

The repository is written in English (ADR [0051](docs/decisions/0051-english-repository-language.md)): rules,
decisions, backlog and docs are open to you, and so are proposals of features, not only cards. Some older code
comments are still in French. The game itself is bilingual, French being its reference language
(<https://hipmaster.web.app/en/>, on invitation: ask the project owner).

## Before you start

Read the guide **[Designing a card](docs/contribuer/regles-cartes.md)**: families, types, rarities, typical stats,
abilities, the "In real life" text, content rules and the proposal template. Fill in the template: you will give it to
your AI assistant and paste it into your pull request.

**The repository is public, and so is your pull request as soon as you open it**: read the
[content rules](docs/contribuer/regles-cartes.md#content-rules) before pushing anything.

## Step by step

1. **Fork** the repository on GitHub, then clone your fork. You need no rights on the original repository.
2. **Install** the project: Node 24.15 or later, then `npm ci` (see the [README](README.md#getting-started)). Run
   `npm ci` again in every new clone or worktree: without its own `node_modules`, a folder nested in another checkout
   silently uses the parent's packages, and the checks run on the old catalogue.
3. **Create a branch** named `carte-<card-name>`.
4. **Write the card with your AI coding assistant**, from your template: give it the
   [card prompt](docs/contribuer/consigne-carte.md) (the card, its French and English texts, its "Learn more" sheet,
   the tests), then draw its creature with the [illustration prompt](docs/contribuer/consigne-illustration.md).
5. **Check**: `npm run check` must pass (lint, format, types, tests), except for one test until the picture is added:
   "chaque carte du set 1 a son illustration". As it stops `npm test` before the front-end tests, also run
   `npm test -w @hipmaster/web` meanwhile. `npm run dev` shows the card in the catalogue (<http://localhost:4200>,
   French version; `npm run start:en` serves the English one).
6. **Measure the balance**: `npm run simuler:carte -- <card number>`, then on a second seed
   `npm run simuler:carte -- <card number> 400 2` (about a minute and a half each). Adjust the card before opening the
   pull request when a ⚠️ shows on both seeds, and put your measurements in its "Balance" section: see
   [Balance](docs/contribuer/regles-cartes.md#balance) in the guide.
7. **Open the pull request** against `main` with the "card" template, by adding `?expand=1&template=carte.md` to the
   compare URL: `https://github.com/Obemm/20_HIPMaster/compare/main...<your-account>:<your-branch>?expand=1&template=carte.md`.
   Paste your template, attach the original illustration, give your balance measurements and tick your checks.

No GitHub account, or no time? Send your filled-in template to the project owner, who will add the card for you.

## After the pull request

The project owner reviews the card with the checklist of the template (accuracy, clarity, confidentiality, duplicates,
rules, balance, illustration). The CI measures your card's balance: the "Équilibrage des cartes nouvelles" job shows,
in its summary, how the card changes each starter deck, as you measured it in step 6. You get an answer in the pull request within two
weeks: merged, changes requested, or declined with a reason. Once merged, the card goes live automatically, with your
name.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), with a lowercase subject:
`feat(carte): add the graphql api card`. The pull request is squash-merged, so its title becomes the commit on `main`.
