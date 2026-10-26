# 0049 — Playing with your own deck: checked again at launch, frozen in the game

- **Date**: 2026-10-26
- **Status**: Accepted
- **Completes**: [0048](0048-decks-des-joueurs.md) (player decks), [0020](0020-duels-asynchrones.md) (duels),
  [0030](0030-parties-bot-en-base.md) (games against the bot)

## Context

US-084 lets a player play with one of their decks (ADR 0048) against the bot and in duels, alongside loaned decks.
The server is authoritative (ADR 0004): a deck is checked at the moment it is used, since the collection and the
catalogue may have changed since it was saved (slots freed, ADR 0048). A game against the bot keeps its full state in
the database (ADR 0030); so does a duel (ADR 0020), but it **waits for its opponent** for up to 7 days: the creator's
deck is chosen long before the game starts, and it may be modified or deleted in the meantime. The `deck` columns of
games and `deck_createur` / `deck_adversaire` of duels currently hold the identifier of a loaned deck, which the front
end translates into a name. The live version must keep working during a deployment (ADR 0028).

## Decision

- **A single `deck` field** in `POST /parties`, `POST /duels`, `POST /duels/hasard` and
  `POST /duels/{id}/rejoindre`: the identifier of a loaned deck (`heritage`…), or that (UUID) of one of the signed-in
  player's decks. Using one's own deck requires an account: an anonymous game only plays with a loaned deck.
- **Checked again at launch**: the server reads the deck again, frees the slots of vanished cards (`libererPlaces`)
  and requires a **complete and valid** deck for the collection of the moment (`problemesDeck`, ADR 0048). Otherwise:
  422 `deck-incomplet` (the deck exists but cannot be used), or 422 `deck-inconnu` (neither loaned nor this player's).
- **Frozen in the game**: the composition is copied at launch, and never read again.
  - Against the bot, it enters the engine state (`creerPartie`); the `deck` column keeps the deck identifier as a
    record.
  - In a duel, the **creator** freezes their composition as soon as the challenge or open duel is created: two
    optional columns, `cartes_createur` (integer array) and `nom_deck_createur`, empty for a loaned deck. At launch,
    the engine receives this copy, even if the deck has changed or disappeared since. The **opponent** freezes theirs
    when joining: it enters the engine state, and `deck_adversaire` keeps the deck identifier.
- **The name of one's own deck is displayed** to the opponent like that of a loaned deck ("Ada challenges you with
  Tout API"): the duel view carries `nomDeckCreateur` when the creator plays one of their decks. The name is chosen by
  the player, like their username.
- **Unchanged**: the bot plays a loaned deck drawn at random; the guided game keeps its fixed decks (ADR 0041); the
  score, the rating and the rewards do not depend on the deck (US-069, ADR 0044).

## Alternatives considered

- **Reading the creator's deck again at duel launch**: the creator does not play what they chose if they modified
  their deck in the meantime, and the duel fails when the opponent joins if the deck has become incomplete or been
  deleted: a challenge broken by an unrelated action. Rejected.
- **Forbidding the modification or deletion of a deck committed to a pending duel**: a hidden lock that the player
  would not understand, for a duel that can wait 7 days. The copy is simpler.
- **A `deckPerso` field next to `deck`**: two mutually exclusive fields to validate, for a distinction that the shape
  of the identifier already makes (a UUID is never the identifier of a loaned deck).
- **Copying the composition into a `decks_figes` table**: one more join for 20 numbers read once.

## Consequences

- Modifying or deleting a deck changes nothing for games and duels in progress or pending.
- The migration only adds optional columns to `duels`: the live version ignores them. During a deployment, a duel
  created by the new version with one's own deck cannot be joined by the old one (deck unknown to it): the opponent
  retries after the switch, a few minutes at most.
- Launching a game with one's own deck costs two more reads (the deck, the collection), only in that case.
