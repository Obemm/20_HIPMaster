# US-071 — Say why a card in hand cannot be played

- **Epic**: EPIC-04
- **Status**: Done
- **Priority**: Must
- **Size**: M
- **Branch**: `us-071-raison-carte-main`

## Story

As a **player**, I want **to know why a card in my hand cannot be played right now** so that **I am not left stuck in
front of a card without understanding what I need to play it**.

## Acceptance criteria

- [x] **Given** my turn and an evolution card in hand (Apigee AI Gateway) without its source card on my board,
      **when** I select it, **then** its detail says "Evolution of Apigee API Gateway: deploy Apigee API Gateway first,
      then evolve it.", instead of today's generic message.
- [x] **Given** my turn, **when** a card in my hand is not playable, **then** the API view says why, in priority order:
      card not yet supported by the engine; evolution without its source on the board; full board (5 components) for a
      component; insufficient Throughput, with the effective cost (reductions included) and the available Throughput
      ("You need 5 Throughput, you have 3."); no possible target for a spell or an incident. A card that is played in
      another way (Migration, Multi-model routing) is playable: no reason is given.
- [x] **Given** the opponent's turn, **when** I look at a card in my hand, **then** the reason is "It's not your turn:
      wait for yours to play this card."; game over, no reason is exposed.
- [x] The reason is computed by the domain (`vueDe`), modelled on `sansAttaque` (US-041); the screen only displays it
      (ADR 0004). It goes into the view of games against the bot and of duels: OpenAPI contracts (`parties.yaml`,
      `duels.yaml`) updated first, the view's Zod schema up to date (the field is not stripped at serialisation).
- [x] **Given** my turn, an unplayable card in hand stays readable (not greyed out) and carries a visible "Not
      playable" mention under its thumbnail; the full reason is part of the card button's accessible description, and
      is displayed in its detail, above its actions (Decommission is still offered).
- [x] Tests: domain (each reason, including evolution without a source), API (games and duels), screen; an e2e journey
      shows the reason for an evolution without a source; `npm run check` and `npm run test:e2e` pass, axe-core audit
      included.

## Notes

- Feedback from the project owner on 2026-10-23: impossible to play "Apigee AI Gateway" (no. 40). It is an evolution
  of "Apigee API Gateway" (no. 18): it is not deployed, it is played with "Evolve …" when the source is on the board
  (`posesPossibles`). The card's detail only offered "Decommission", and the generic message ("Throughput, full board,
  or card not yet playable") did not even appear.
- `injouable` field (text or `null`) on every card of `vue.moi.main`, as long as the game is not over. It is deduced
  from the legal actions already computed by `actionsPossibles` (a card is playable as soon as a `poser`, `evoluer`,
  `jouer`, `migrer` or `router` action plays it), then from simple checks to name the obstacle: no extra target
  computation, the view stays just as fast for the bots.
- `reconstituer` (view → state, for the bots) removes the field, as it removes `attaque` from components.
- The "Not playable" mention carries the full reason in a `sr-only` text (absolute position): each card in the hand is
  `relative`, otherwise this text escaped the scrolling hand and widened the page on phones (horizontal overflow seen
  by the mobile e2e tests, intercepted clicks).
- Decommissioning is not "playing": a card that can only be decommissioned is unplayable, and its reason is displayed
  above the "Decommission" button.

## Log

- 2026-10-23 — created, after the project owner's feedback on Apigee AI Gateway; status "In progress".
- 2026-10-23 — delivered: Each card in hand carries, in the API view (games and duels), the reason it cannot be played (injouable, computed by vueDe): evolution without a source, full board, missing Throughput (effective cost), no target, unsupported card, opponent's turn. The screen displays a "Not playable" mention under the thumbnail, the reason in the accessible description and in the detail above the actions; the generic message disappears. Domain, API, screen tests; e2e of Apigee AI Gateway without its source; e2e suite 97/97.
