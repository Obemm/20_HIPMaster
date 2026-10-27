# Prompt for your image generator: drawing the card

Every card has **its own creature**: an animal or a chimera whose silhouette, pose and small setting tell what the card
stands for (a postman pelican for FTP, a howling wolf for EDA). The rendering is shared by the whole game: it comes
from a **reference image**. Rules and reasons: [art direction](../produit/direction-artistique.md), ADR
[0047](../decisions/0047-illustrations-generees-par-gemini.md).

The project owner uses Gemini (web app); any other generator that accepts a reference image will do, provided it lets
you use the image in a non-commercial internal game.

## How to use it

1. **Imagine the creature**: a species, a pose and a setting drawn from what the card does, different from the
   existing cards (see them in the game's catalogue, or their prompts in
   [prompts-illustrations-gemini.md](../produit/prompts-illustrations-gemini.md)). Describe it in one or two sentences.
2. **Attach the rendering reference image**: the SFTP illustration,
   `apps/web/public/illustrations/set-1/2-640.<hash>.webp` in your clone. For an **evolution**, also attach the
   picture of the original card as a second image.
3. **Assemble the prompt** below and send it to the generator.
4. **Look at the picture** before keeping it: no text, digit or logo; no real person; one single creature, readable at
   small size; clearly different from the other cards; the palette of its family. Otherwise, generate again, changing
   only the "Subject" sentence.
5. **Add it to the game** (see below), then attach the original to your pull request.

## The prompt

Replace the parts in angle brackets.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Do NOT reuse its setting either: no cable-covered floor, no punched tapes hanging on the sides, no server racks framing the picture; give the scene its own place and camera angle, drawn from the subject. Subject: <the creature, its pose and its setting>. It embodies "<card name>" (enterprise integration, <family>). What it means: "<In real life text>". Rarity: <rarity sentence>. <family style block>
```

For an **evolution**, replace everything before "Subject:" with:

```text
Generate a new image. From the first reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment; do NOT reuse its character, pose or composition. The second reference image shows the base form of this card’s creature: draw its evolved form, keeping its species and recognizable silhouette, upgraded and more spectacular, in a new dynamic three-quarter pose, in its own small scene, with no circular halo behind it. Do NOT reuse the setting of either image: give the scene its own place.
```

### Rarity sentence

| Rarity    | Sentence                                                                               |
| --------- | -------------------------------------------------------------------------------------- |
| Common    | `common card: sober, minimal light effects`                                            |
| Rare      | `rare card: a few subtle glints and light effects`                                     |
| Epic      | `epic card: a bright aura around the creature and sparkling particles`                 |
| Legendary | `legendary card: a radiant aura, sparkling particles and light rays filling the scene` |

### Family style block

Every block starts with the same sentence, then gives the family's palette and motifs, and ends with what is
forbidden:

```text
Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle <glow> glow, limited palette dominated by <palette>, motifs: <motifs>. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

| Family             | `<glow>` | `<palette>`            | `<motifs>`                             |
| ------------------ | -------- | ---------------------- | -------------------------------------- |
| Files & Batch      | amber    | amber and burnt orange | folders, punched tapes, clocks         |
| Messaging & ESB    | sky blue | sky blue and deep blue | pipes, hubs, star-shaped cables        |
| API                | emerald  | emerald and dark green | gates, ramparts, access badges         |
| iPaaS              | teal     | teal and cyan          | clouds, interlocking connectors        |
| Event-driven (EDA) | violet   | violet and indigo      | waves, glowing threads, mesh           |
| Agentic AI         | magenta  | magenta and purple     | constellations, glowing eyes, synapses |
| Patterns           | slate    | slate and bluish grey  | gears, railway switches, blueprints    |
| Bestiary           | crimson  | red and dark pink      | cracks, smoke, menacing creatures      |

A setting sentence may follow ("Setting: …") if the generator copies the reference scene too much.

## Adding the picture to the game

Your AI coding assistant can do these steps for you ("add the illustration of card N following
docs/contribuer/consigne-illustration.md"); the details are in the
[illustrations README](../../packages/illustrations/README.md).

1. Save the original as PNG, in 4:3 format and at least 640 px wide, in
   `packages/illustrations/sources/set-1/<number>.png`. This folder is ignored by Git.
2. Add the card's entry at the end of `packages/illustrations/set-1.json`: `numero`, `alt` (what the picture shows, in
   one French sentence, without the card's name), `altEn` (the same in British English), `consigne` (the prompt sent
   to the generator) and `provenance` (`outil` and `date`).
3. Run `npm run illustrations` at the root: it produces the served images (`apps/web/public/illustrations/set-1/`) and
   updates the manifest (`apps/web/src/app/cartes/illustrations.generated.ts`).
4. Commit `set-1.json`, the produced images and the manifest, **not the original**; attach the original (the
   generator's file) to your pull request description, so that the project owner can archive it.
5. Add the creature to [prompts-illustrations-gemini.md](../produit/prompts-illustrations-gemini.md), in its family's
   section, modelled on the other cards.

The project owner validates the picture during the review, as for every card: they may ask for another creature or
generate it again themselves.
