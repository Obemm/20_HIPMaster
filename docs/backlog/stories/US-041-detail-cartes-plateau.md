# US-041 — View the details of the cards on the board

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Should
- **Size**: M
- **Branch**: `us-041-detail-cartes-plateau`

## Story

As a **player**, I want to **view the details of any component in play, mine or the opponent's** so that **I
understand what it does before attacking it or defending against it**.

## Acceptance criteria

- [x] **Given** a game in progress (against the bot or in a duel), **when** I tap a component on the board (my side
      or the opponent's), on my turn or during the opponent's turn, **then** it is selected and its card is shown
      enlarged, as for the hand (US-040): name, type, family, rarity, cost, effect, abilities with their definition,
      evolution, "In real life". To this is added its **current state**: remaining HP out of the card's HP, current
      attack (bonuses included) next to the card's attack, and its statuses spelled out (deployed this turn, has
      already attacked, immobilised, no abilities, duplicate, zero attack, coupled, tooled). The statuses remain those
      the server exposes: nothing is recomputed in the front end (ADR 0004).
- [x] **Given** my turn, **when** I select one of my components that can attack, **then** it becomes the attacker
      (the possible targets light up, as today) and its details say "Choose a target". A component that cannot attack
      can also be selected; its details say why it does not attack when the server knows (deployed this turn, has
      already attacked, immobilised, zero attack).
- [x] **Given** a chosen attacker, **when** I tap a possible target (a lit-up opposing component or the opposing
      System), **then** it is selected and its details are shown, **without attacking**; below the details, an
      "Attack with [attacker]" button launches the attack. Looking and acting remain two distinct gestures
      everywhere: selecting never plays, the actions are always below the details.
- [x] **Given** a selected target, **when** I tap another of my possible attackers, **then** it becomes the
      attacker, its details replace the target's and the possible targets light up again for it.
- [x] Only one detail panel at a time: selecting a card in the hand closes the board's details, and vice versa.
      Tapping the component again, the "Close" button or the Esc key closes the details; focus returns to the token.
      The details are readable on a phone, without horizontal scrolling, and do not leave the game.
- [x] The log and the short rule remain accurate: the short rule (US-039) now says "select the attacker, then its
      target, then confirm the attack".
- [x] Screen tests; `npm run check` passes; `npm run test:e2e` passes (the attack journeys add the third tap), axe-core
      audit included.

## Notes

- Follow-up to US-040, based on the same digital card game principle: everything visible can be inspected.
- **Project owner's decision (2026-10-19)**: selection = details, attack confirmed. Three gestures instead of two to
  attack, but a single gesture everywhere to look (hand and board), the actions always below the details, and no more
  attacks launched by mistake on a phone. Dropped: "tapping a lit-up target attacks right away" (inconsistent with
  the hand: selecting never plays there) and an ⓘ button on each token (two tight touch targets per token).
- The token (`hip-jeton-composant`) remains purely visual; the button around it is no longer disabled: it is always
  clickable for looking, and `aria-pressed` reflects the selection. "Can attack" and "possible target" remain
  signalled visually and in the accessible name.
- The board details reuse the US-040 panel (a single "chosen card", hand or board): the component is shown with
  `hip-vignette-carte`, and an "In play" box carries the current state. The "Attack with…" button sends the
  `attaquer` action already provided by `vue.actions`; no rule in the front end.
- During the opponent's turn, the details are shown without actions, with the US-040 message ("on your turn").
- "Why this component does not attack" comes from the server: the view exposes `sansAttaque` (text from
  `raisonDeNePasAttaquer`, already used to refuse the action) on my components during my turn, absent otherwise.
  OpenAPI contract (`parties.yaml`) and API schema updated; nothing is recomputed in the front end.

## Log

- 2026-10-19 — created, at the project owner's request, by splitting US-040.
- 2026-10-19 — refined: gesture settled (selection = details, attack confirmed below the target's details);
  criteria detailed; status "Ready". Branch started from `us-040-detail-cartes-main` (PR #34), to be rebased onto
  `main` after its merge.
- 2026-10-19 — delivered: Tapping a board component (mine, the opponent's) or the opposing System shows it enlarged with its current state; my components say why they do not attack (sansAttaque, exposed by the view); the attack is confirmed by "Attack with…" below the target's details. Short rule and end-of-turn warning updated; e2e adapted (three taps). E2E suite: a single failure, a 30 s overrun of a two-browser duel under load, which passes on its own.
