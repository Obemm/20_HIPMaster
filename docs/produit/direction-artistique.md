# Art direction of the illustrations

> Validated on the US-016 trial, then corrected during US-017 (2026-10-24): one creature of its own per card.

## The idea

Each card is a **creature of its own**: a species, a silhouette, a posture and a small scene drawn from what the card
represents, like the creatures of a card game. FTP is an old postman pelican whose beak pouch, wide open, lets you see
everything; SFTP an armoured courier with a padlock shell in an encrypted tunnel; an API gateway a guardian griffin
perched on a fortified gate; RAG a librarian squirrel. The creatures may be partly mechanical, made of server-room
parts. The tone follows the universe ([univers.md](univers.md)): affectionate and a little mocking for the old
components, spectacular for the modern ones, unsettling (without horror) for the bestiary.

The first trial (a "server-room machine-creature" for all of them, in the framing of the first image) always gave the
same robot seen from the front in an arch, with a halo: **only the colour changed**, the cards could not be told
apart. Hence the rule: the **rendering** is shared, never the character.

## What is common, what is specific to each card

- **Common to the whole set** (taken from the reference image, SFTP): the quality of the line, the soft flat shading
  (_cel shading_), the light, the navy blue background and its glow.
- **Specific to the family**: the palette, the colour of the glow and the motifs of the setting (table below).
- **Specific to the rarity**: the intensity of the light (see the composition rules).
- **Specific to the card**: the creature (species and silhouette never reused elsewhere in the set), its posture, its
  scene and its **setting**: the first pack, which reused the SFTP setting (floor of cables, punched tapes hanging on
  the sides), looked too alike. The list of the 74 creatures is in [prompts-illustrations-gemini.md](prompts-illustrations-gemini.md).
- **The evolutions** (webMethods.io, Solace Agent Mesh, Apigee AI Gateway) reuse the species and silhouette of their
  original card (Integration Server, Solace Event Mesh, Apigee API Gateway), larger and more spectacular: they are
  recognised at a glance.

## Composition rules

- **4:3 landscape format**, **a single main creature** legible at 170 px wide (phone grid); small secondary
  characters are allowed if they stay in the background.
- **Three-quarter view, dynamic**, in a small scene of its own; no creature standing face-on in an arch, no disc of
  light behind it, no symmetrical framing.
- Bold shapes, soft flat shading, dark navy blue background with a glow in the family colour.
- **Forbidden**: text, letters and numbers in the image; logos and product brands (Apigee, Solace, webMethods…);
  recognisable real people; company data.
- **Rarity** reads through intensity: a common is sober, a rare has a few highlights, an epic an aura and particles, a
  legendary a dazzling aura, particles and rays that fill the scene.

## Palette per family (takes up the accents of US-009)

| Family             | Dominant colours    | Recurring motif                        |
| ------------------ | ------------------- | -------------------------------------- |
| Files & Batch      | amber, burnt orange | folders, punched tapes, clocks         |
| Messaging & ESB    | sky blue, deep blue | pipes, hubs, star cabling              |
| API                | emerald, dark green | gates, ramparts, access badges         |
| iPaaS              | teal, cyan          | clouds, snap-together connectors       |
| Event-driven (EDA) | violet, indigo      | waves, glowing threads, mesh           |
| Agentic AI         | fuchsia, purple     | constellations, glowing eyes, synapses |
| Patterns           | slate, bluish grey  | gears, switches, blueprints            |
| Bestiary           | red, dark pink      | cracks, smoke, menacing creatures      |

## Standard prompt (for Gemini)

The prompts are written **in English**, the language that generators follow best; the rest of the project is in
English. Each prompt assembles a common **opening** (take only the rendering from the reference image), the
card's own **subject** (its creature), its meaning, its **rarity** and the **style block** of its family:

> _Style block_: `Digital illustration for a collectible card game, landscape 4:3, one single main creature
readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle {couleur} glow,
limited palette dominated by {couleurs}, motifs: {motifs}. Strictly no text, no letters, no numbers, no logos, no
brand marks, no watermark, no real people.`

The 71 ready-to-use prompts and their instructions: [prompts-illustrations-gemini.md](prompts-illustrations-gemini.md).
Gemini (web application) renders 2400 × 1792 JPEGs, converted to PNG then derived by `npm run illustrations`
([ADR 0015](../decisions/0015-illustrations-statiques-optimisees.md)).

## Alternative text

A sentence in French that describes **what the image shows**, without repeating the card's name (it is already read):
"Un vieux pélican facteur en vol, la poche du bec grande ouverte et pleine de dossiers".

## The interface around the cards (US-061)

The interface speaks the same language as the illustrations ([style guide](charte-graphique.md),
[ADR 0037](../decisions/0037-identite-visuelle-nuit-electrique.md)):

- **The night of the illustrations becomes the site's night**: navy blue background `#0b1029`, violet and cyan halos,
  dot pattern. In the light theme, the same halos on a pale lavender background; the banner and the tab bar stay
  night-coloured, like the back of a card.
- **The card back** takes up this night, a diamond pattern, a gold edging and the logo in the centre: it stands in for
  the cards during loading and will depict the booster packs (US-062).
- **The logo**: two cards fanned out, the face bearing a gold connection hub, integration in a single sign.
- **Gold is energy**: the cards' Throughput gem and the main action button have the same colour.
- **Rarity reads through intensity**, in the interface as in the image: a common is sober, an epic or a legendary
  carries a halo.
- The final illustrations must stay legible **on a light background as on a dark one**: the card frame always
  separates them from the page background.
