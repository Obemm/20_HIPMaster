# US-065 — Nudges at the right moment

- **Epic**: EPIC-11
- **Status**: Done
- **Priority**: Should
- **Size**: S
- **Branch**: `us-065-coups-de-pouce`

## Story

As a **beginner player**, I want **to be warned when I am about to end my turn while letting a useful action go by**
so that **I learn the game's reflexes without reading the rules**.

## Context

US-039's finding (a game lost without a single point of damage) comes from a turn ended without attacking. The server
already provides everything needed: the list of the player's possible actions (`vue.actions`) and, for each component,
the reason it cannot attack (`sansAttaque`, US-041). The front end invents no rule (ADR 0004): it reads this
information and says it at the right moment.

## Acceptance criteria

- [x] **Given** a turn where at least one of my components can attack, **when** I click "End my turn", **then** a
      non-blocking message says so ("2 of your components can still attack"), with "End anyway" and "Back to the
      board".
- [x] **Given** enough Throughput to deploy a card from my hand, **when** I click "End my turn", **then** the same
      message mentions it ("You can still deploy Pub/Sub").
- [x] **Given** an opposing component with Guard, **when** I choose an attacker, **then** the screen reminds me that
      this component must fall before the System, and the System appears as an unavailable target with its reason.
- [x] **Given** a player who has turned off nudges (setting kept by the browser), **then** none is displayed any more.
- [x] Active against the bot as in duels: they reveal nothing the player cannot see themselves.
- [x] Messages announced to screen readers, usable with the keyboard and at 375 px; unit tests and e2e journeys.

## Notes

- No new API route: everything comes from the view returned by the server.
- Choices made:
  - **Before ending**: "End my turn" opens, if anything remains to be done, a non-modal message at the bottom of the
    screen (`role="alertdialog"`, focus on "Back to the board", Escape goes back), with "End anyway". What remains to
    be done comes only from `vue.actions`: `attaquer` actions (components that can still attack) and the actions that
    deploy or play a card from the hand (`poser`, `evoluer`, `jouer`, `router`, `migrer`); decommissioning does not
    count, it is not an oversight.
  - **Guard**: when an attacker is chosen and the server does not offer the System as a target, the System's button
    says "Unavailable", with "Guard" if a visible opposing component carries that ability; the attacker's detail
    reminds that this component must fall before the System. The front end decides no target (ADR 0004).
  - **Setting**: a "Nudges" checkbox in the "How to play" help, kept by the browser
    ([ADR 0032](../../decisions/0032-preferences-interface-navigateur.md)); unchecked, no message, no reminder, and no
    warning about forgotten attacks (US-039).

## Log

- 2026-10-23 — created, at the project owner's request ("a tutorial mode or a bot that advises the player").
- 2026-10-23 — refined and started (batch 2, front-end session): choices noted above.
- 2026-10-23 — delivered: non-blocking message before "End my turn" (attacks and cards still possible according to vue.actions), System "Unavailable: Guard" and Guard reminder, setting in the help kept by the browser, active in duels (ADR 0032)
- 2026-10-24 — anomaly reported live: after "End my turn", choosing the System or a card opened the detail sheet over
  the message, which kept its buttons hidden underneath. Choosing a card or a component now closes the message
  (component test that failed before the fix).
