# Consigne pour votre générateur d'images : dessiner la carte

Chaque carte a sa **créature à elle** : un animal ou une chimère dont la silhouette, la posture et le petit décor
racontent ce que la carte représente (un pélican facteur pour FTP, un loup qui hurle pour EDA). Le rendu est commun à
tout le jeu : il est donné par une **image de référence**. Règles et raisons :
[direction artistique](../produit/direction-artistique.md), ADR
[0047](../decisions/0047-illustrations-generees-par-gemini.md).

Le porteur du projet utilise Gemini (application web) ; un autre générateur qui accepte une image de référence
convient, s'il vous autorise à utiliser l'image dans un jeu interne non commercial.

## Mode d'emploi

1. **Imaginez la créature** : une espèce, une posture et un décor tirés de ce que la carte fait, différents des
   cartes existantes (voir les [consignes du catalogue](../produit/prompts-illustrations-gemini.md)). Décrivez-la en
   une ou deux phrases, en anglais.
2. **Joignez l'image de référence du rendu** : l'illustration de SFTP,
   `apps/web/public/illustrations/set-1/2-640.<empreinte>.webp` dans votre clone. Pour une **évolution**, joignez
   aussi l'image de la carte d'origine, en seconde image.
3. **Assemblez la consigne** ci-dessous et envoyez-la au générateur.
4. **Regardez l'image** avant de la garder : aucun texte, chiffre ni logo ; aucune personne réelle ; une seule
   créature, lisible en petit ; bien différente des autres cartes ; la palette de sa famille. Sinon, régénérez en ne
   changeant que la phrase « Subject ».
5. **Intégrez-la** (voir plus bas), puis joignez l'original à votre PR.

## La consigne

Remplacez les parties entre chevrons. Pour une évolution, remplacez la première phrase par l'ouverture « évolution »
des [consignes du catalogue](../produit/prompts-illustrations-gemini.md#mode-demploi).

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Do NOT reuse its setting either: no cable-covered floor, no punched tapes hanging on the sides, no server racks framing the picture; give the scene its own place and camera angle, drawn from the subject. Subject: <la créature, sa posture et son décor, en anglais>. It embodies "<nom de la carte>" (enterprise integration, <famille>). What it means (French, for context only): « <texte En vrai> ». Rarity: <phrase de rareté>. <bloc de style de la famille>
```

### Phrase de rareté

| Rareté     | Phrase                                                                                 |
| ---------- | -------------------------------------------------------------------------------------- |
| Commune    | `common card: sober, minimal light effects`                                            |
| Rare       | `rare card: a few subtle glints and light effects`                                     |
| Épique     | `epic card: a bright aura around the creature and sparkling particles`                 |
| Légendaire | `legendary card: a radiant aura, sparkling particles and light rays filling the scene` |

### Bloc de style de la famille

Chaque bloc commence par la même phrase, puis donne la palette et les motifs de la famille, et finit par les
interdits :

```text
Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle <lueur> glow, limited palette dominated by <palette>, motifs: <motifs>. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

| Famille            | `<lueur>` | `<palette>`            | `<motifs>`                             |
| ------------------ | --------- | ---------------------- | -------------------------------------- |
| Fichiers & Batch   | amber     | amber and burnt orange | folders, punched tapes, clocks         |
| Messagerie & ESB   | sky blue  | sky blue and deep blue | pipes, hubs, star-shaped cables        |
| API                | emerald   | emerald and dark green | gates, ramparts, access badges         |
| iPaaS              | teal      | teal and cyan          | clouds, interlocking connectors        |
| Événementiel (EDA) | violet    | violet and indigo      | waves, glowing threads, mesh           |
| IA agentique       | magenta   | magenta and purple     | constellations, glowing eyes, synapses |
| Patterns           | slate     | slate and bluish grey  | gears, railway switches, blueprints    |
| Bestiaire          | crimson   | red and dark pink      | cracks, smoke, menacing creatures      |

Une phrase de décor peut suivre (« Setting: … »), si le générateur reprend trop la scène de la référence.

## Intégrer l'image

Votre assistant de code peut faire ces étapes pour vous (« intègre l'illustration de la carte N selon
docs/contribuer/consigne-illustration.md ») ; le détail est dans le
[README des illustrations](../../packages/illustrations/README.md).

1. Enregistrez l'original en PNG, au format 4:3 et d'au moins 640 px de large, dans
   `packages/illustrations/sources/set-1/<numéro>.png`. Ce dossier est ignoré par Git.
2. Ajoutez l'entrée de la carte à la fin de `packages/illustrations/set-1.json` : `numero`, `alt` (ce que montre
   l'image, en une phrase, sans le nom de la carte), `altEn` (la même chose en anglais britannique), `consigne` (le
   texte envoyé au générateur) et `provenance` (`outil` et `date`).
3. Lancez `npm run illustrations` à la racine : il produit les images servies
   (`apps/web/public/illustrations/set-1/`) et met à jour le manifeste
   (`apps/web/src/app/cartes/illustrations.generated.ts`).
4. Commitez `set-1.json`, les images produites et le manifeste, **pas l'original** ; joignez l'original (le fichier
   d'origine du générateur) à la description de votre PR, pour que le porteur du projet l'archive.
5. Ajoutez la créature à [prompts-illustrations-gemini.md](../produit/prompts-illustrations-gemini.md), dans la
   section de sa famille, sur le modèle des autres cartes.

Le porteur du projet valide l'image pendant la relecture, comme pour toutes les cartes : il peut demander une autre
créature ou la régénérer lui-même.
