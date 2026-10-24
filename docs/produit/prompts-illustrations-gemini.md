# Prompts d'illustration pour Gemini — set 1

Une **créature à elle** pour chacune des 71 cartes (US-017), générée par Gemini (application web). Le fichier est
produit à partir du catalogue (`packages/domain/src/set-1.ts`) et de la
[direction artistique](direction-artistique.md) ; les prompts sont en anglais, la langue que les générateurs suivent le
mieux.

## La consigne

Le premier essai (« machine-créature de la salle serveur », même cadrage isométrique que la première image) donnait
toujours le même robot de face, dans une arche, avec un halo : seule la couleur changeait. Désormais, l'image de
référence ne transmet **que le rendu** (trait, ombrage doux en aplats, lumière, fond bleu nuit) ; chaque carte reçoit
une créature **à elle** : espèce, silhouette, posture et petite scène tirées de ce que la carte représente. La famille
se lit à la palette et aux motifs, la rareté à l'intensité de la lumière.

Chaque prompt assemble :

1. l'**ouverture** commune, qui dit de ne reprendre que le rendu de l'image de référence ;
2. le **sujet** : la créature de la carte (ligne « Créature » ci-dessous, en français) ;
3. le sens de la carte (son « En vrai », en français, pour le contexte) ;
4. la **rareté** : sobre (commune), quelques reflets (rare), une aura et des particules (épique), une aura éclatante,
   des particules et des rayons (légendaire) ;
5. le **bloc de style** de la famille (palette, lueur, motifs) et les interdits (texte, logos, personnes réelles).

## Mode d'emploi

1. Dans la conversation Gemini du projet, joindre l'image de **SFTP** (`2-sftp.jpeg`, la référence de rendu) et coller
   le prompt de la carte. Pour une **évolution** (26, 39, 40), joindre aussi l'image de sa carte d'origine (9, 31, 18) comme seconde image de référence.
2. Regarder l'image avant de la garder : aucun texte ni logo, une créature bien différente des précédentes, famille et
   rareté lisibles en petit. Sinon, régénérer ou retoucher le sujet (seule la phrase « Subject » change).
3. Télécharger l'image (JPEG 2400 × 1792), archiver l'original hors du dépôt
   (`originaux/<numéro>-<nom>.jpeg`, [ADR 0015](../decisions/0015-illustrations-statiques-optimisees.md)), le
   convertir en PNG dans `packages/illustrations/sources/set-1/<numéro>.png`, décrire l'image dans
   `packages/illustrations/set-1.json` (texte alternatif, consigne, provenance), puis lancer `npm run illustrations`.

Ouverture commune, et sa variante pour les évolutions :

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene.
```

```text
Generate a new image. From the first reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment; do NOT reuse its character, pose or composition. The second reference image shows the base form of this card’s creature: draw its evolved form, keeping its species and recognizable silhouette, upgraded and more spectacular, in a new dynamic three-quarter pose, in its own small scene, with no circular halo behind it.
```

## Fichiers & Batch

### 1 — FTP

Fichiers & Batch · composant · Légendaire

**Créature** : un vieux pélican facteur, immense et poussiéreux, en vol plané au-dessus de piles de cartons ; la poche de son bec, grande ouverte, déborde de dossiers papier que tout le monde peut lire, un cadenas ouvert pend à sa sacoche.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a huge, venerable, dusty old pelican postman gliding over stacks of cardboard boxes; its wide-open beak pouch overflows with paper folders anyone can read, an open padlock dangles from its satchel. It embodies "FTP" (enterprise integration, Fichiers & Batch). What it means (French, for context only): « Transfert de fichiers en clair. Officiellement interdit chez Elis. Officieusement… ». Rarity: legendary card: a radiant aura, sparkling particles and light rays filling the scene. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle amber glow, limited palette dominated by amber and burnt orange, motifs: folders, punched tapes, clocks. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 2 — SFTP

Fichiers & Batch · composant · Rare · **image de référence du rendu**

**Créature** : un coursier mécanique blindé, à carapace de cadenas et queue en forme de clé, qui file dans un tunnel chiffré en portant des dossiers scellés.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a sturdy armored mechanical courier creature with a padlock-shaped shell and a key-shaped tail, carrying sealed folders through a glowing encrypted tunnel. It embodies "SFTP" (enterprise integration, Fichiers & Batch). What it means (French, for context only): « Le transfert de fichiers chiffré par SSH, peu à peu remplacé par les API et les événements. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle amber glow, limited palette dominated by amber and burnt orange, motifs: folders, punched tapes, clocks. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 3 — EDI

Fichiers & Batch · composant · Rare

**Créature** : une vieille tortue archiviste dont la carapace est un classeur de bordereaux normés, qui tend un document tamponné à une tortue partenaire par-dessus un petit pont.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a wise old tortoise whose shell is a filing cabinet of standardized forms, handing a stamped document to a partner tortoise across a small bridge. It embodies "EDI" (enterprise integration, Fichiers & Batch). What it means (French, for context only): « Échanges de documents normés entre partenaires. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle amber glow, limited palette dominated by amber and burnt orange, motifs: folders, punched tapes, clocks. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 4 — Fichier CSV

Fichiers & Batch · composant · Commune

**Créature** : une longue chenille dont chaque anneau est une case de tableur, les anneaux reliés par de petits crochets en forme de virgule ; deux anneaux sont mal accrochés.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a long caterpillar whose body segments are spreadsheet cells, joined by small comma-shaped hooks, two of the segments slightly misaligned. It embodies "Fichier CSV" (enterprise integration, Fichiers & Batch). What it means (French, for context only): « Le format universel, au séparateur variable. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle amber glow, limited palette dominated by amber and burnt orange, motifs: folders, punched tapes, clocks. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 5 — Fichier à positions fixes

Fichiers & Batch · composant · Commune

**Créature** : un crabe méticuleux aux pinces en forme de règle graduée, qui découpe une longue bande de papier en colonnes parfaitement égales.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a meticulous crab with ruler-shaped claws, slicing a long paper strip into perfectly equal columns. It embodies "Fichier à positions fixes" (enterprise integration, Fichiers & Batch). What it means (French, for context only): « « Le montant est en colonnes 47 à 52. » ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle amber glow, limited palette dominated by amber and burnt orange, motifs: folders, punched tapes, clocks. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 6 — Cron

Fichiers & Batch · composant · Commune

**Créature** : une araignée mécanique portant un cadran d'horloge sur le dos, qui tisse sous la lune une toile de fils du temps et fait tinter une clochette.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a clockwork spider with a clock face on its back, spinning a web of time threads under the moon, ringing a tiny bell. It embodies "Cron" (enterprise integration, Fichiers & Batch). What it means (French, for context only): « Le planificateur des traitements de nuit. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle amber glow, limited palette dominated by amber and burnt orange, motifs: folders, punched tapes, clocks. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 7 — Répertoire de dépôt

Fichiers & Batch · composant · Commune

**Créature** : un gros hamster gardien, les bajoues gonflées, assis au fond d'un bac de tri sur un tas de dossiers qui attendent leur tour.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a plump guardian hamster with puffed cheeks, sitting at the bottom of a sorting bin on a heap of folders waiting their turn. It embodies "Répertoire de dépôt" (enterprise integration, Fichiers & Batch). What it means (French, for context only): « Là où les fichiers attendent d’être traités. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle amber glow, limited palette dominated by amber and burnt orange, motifs: folders, punched tapes, clocks. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 8 — Fichier .ok témoin

Fichiers & Batch · composant · Commune

**Créature** : une minuscule luciole-lanterne qui s'allume, fière, au sommet d'une pile de fichiers terminée.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a tiny firefly lantern creature lighting up proudly on top of a finished stack of files. It embodies "Fichier .ok témoin" (enterprise integration, Fichiers & Batch). What it means (French, for context only): « Un fichier vide déposé à la fin du transfert, qui prouve que le fichier est complet. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle amber glow, limited palette dominated by amber and burnt orange, motifs: folders, punched tapes, clocks. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

## Messagerie & ESB

### 9 — webMethods Integration Server 10.15

Messagerie & ESB · composant · Épique

**Créature** : une énorme pieuvre-moyeu mécanique au centre d'une salle, des dizaines de tentacules-tuyaux en étoile, un peu datée, rafistolée de rustines et de boulons.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a huge mechanical octopus hub in the middle of a room, dozens of pipe tentacles radiating outward like a star, a bit dated, patched with bandages and bolts. It embodies "webMethods Integration Server 10.15" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « L’ESB historique d’Elis, hébergé sur site. ». Rarity: epic card: a bright aura around the creature and sparkling particles. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 10 — Universal Messaging

Messagerie & ESB · composant · Rare

**Créature** : un long serpent-tuyau transparent enroulé autour d'un pylône, dans le corps duquel circulent des messages lumineux.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a long transparent pipe-serpent coiled around a pylon, glowing messages travelling inside its see-through body. It embodies "Universal Messaging" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « La messagerie de webMethods. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 11 — MWS – My webMethods Server

Messagerie & ESB · composant · Rare

**Créature** : une chouette veilleuse à moitié endormie, perchée sur une console, les yeux en écrans de supervision ; une roue de chargement tourne au-dessus de sa tête.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a half-asleep watchful owl perched on a control console, its eyes are monitoring screens, a loading spinner wheel turning above its head. It embodies "MWS – My webMethods Server" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « L’administration et la supervision de webMethods. « La page charge… » ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 12 — MQSeries

Messagerie & ESB · composant · Rare

**Créature** : un vieil éléphant patient qui porte sur son dos une longue file de caisses bien rangées, sa trompe tenant délicatement la suivante.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a patient old elephant carrying a long orderly queue of crates on its back, its trunk carefully holding the next crate. It embodies "MQSeries" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « L’ancêtre des files de messages. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 13 — Adaptateur SAP

Messagerie & ESB · composant · Rare

**Créature** : un castor ingénieur, outils à la ceinture, qui branche une prise géante en forme de cube dans un immense barrage de pierre.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a beaver engineer with tools on its belt, plugging a giant cube-shaped adapter plug into a massive stone dam. It embodies "Adaptateur SAP" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « Le passage obligé vers l’ERP. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 14 — webMethods Designer

Messagerie & ESB · composant · Commune

**Créature** : un caméléon architecte, un compas sur l'oreille, qui dessine dans l'air des schémas de flux lumineux avec sa langue-stylet.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a chameleon architect with a compass tucked behind its ear, drawing glowing flow diagrams in the air with its stylus-like tongue. It embodies "webMethods Designer" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « L’atelier de développement des flows webMethods. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 15 — Flow service

Messagerie & ESB · composant · Commune

**Créature** : une loutre qui glisse sur une suite de toboggans et de tuyaux, un colis serré contre elle, d'étape en étape.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: an otter sliding down a chain of pipes and water slides, hugging a parcel as it goes from step to step. It embodies "Flow service" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « L’unité de traitement de webMethods. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 16 — Adaptateur JDBC

Messagerie & ESB · composant · Commune

**Créature** : une taupe mineuse, lampe frontale allumée, qui pousse des wagonnets chargés de lignes de tableau hors d'une mine en forme de cylindre.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a mole miner with a glowing headlamp, pushing mine carts loaded with table rows out of a cylinder-shaped database mine. It embodies "Adaptateur JDBC" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « Lire et écrire en base de données. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 17 — SOAP / WSDL

Messagerie & ESB · composant · Commune

**Créature** : une créature cérémonieuse faite de bulles de savon, en redingote, qui porte une enveloppe dans une enveloppe dans une enveloppe.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a pompous creature made of soap bubbles wearing a formal tailcoat, carrying an envelope inside an envelope inside an envelope. It embodies "SOAP / WSDL" (enterprise integration, Messagerie & ESB). What it means (French, for context only): « Le service web d’avant REST, décrit en XML. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle sky blue glow, limited palette dominated by sky blue and deep blue, motifs: pipes, hubs, star-shaped cables. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

## API

### 18 — Apigee API Gateway

API · composant · Épique

**Créature** : un griffon gardien, ailes à demi déployées, perché sur une grande porte fortifiée ; il inspecte une file de petits colis et ne laisse passer que ceux qui montrent un badge, des perles-compteurs de quota à son collier.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a noble guardian griffin with half-spread wings, perched on top of a large fortified gate, inspecting a queue of tiny parcels and letting through only those showing an access badge, quota counter beads on its collar. It embodies "Apigee API Gateway" (enterprise integration, API). What it means (French, for context only): « La passerelle API d’Elis : point d’entrée unique, sécurité, quotas et statistiques. ». Rarity: epic card: a bright aura around the creature and sparkling particles. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle emerald glow, limited palette dominated by emerald and dark green, motifs: gates, ramparts, access badges. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 19 — Apigee API Hub

API · composant · Rare

**Créature** : un grand escargot dont la coquille est une bibliothèque en spirale remplie de catalogues, de petits visiteurs qui feuillettent ses rayons.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a large snail whose shell is a spiral library of catalog books, with tiny visitors browsing its shelves. It embodies "Apigee API Hub" (enterprise integration, API). What it means (French, for context only): « Le catalogue des API. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle emerald glow, limited palette dominated by emerald and dark green, motifs: gates, ramparts, access badges. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 20 — OAuth2

API · composant · Rare

**Créature** : un lynx portier à l'œil vif qui remet aux visiteurs des clés lumineuses temporaires, qui s'estompent peu à peu.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a sharp-eyed lynx doorman handing out glowing temporary keys that slowly fade away. It embodies "OAuth2" (enterprise integration, API). What it means (French, for context only): « La délégation d’autorisation par jeton. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle emerald glow, limited palette dominated by emerald and dark green, motifs: gates, ramparts, access badges. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 21 — Rate limiting

API · sort · Rare

**Créature** : un paresseux suspendu à une barrière, qui ne laisse passer les gouttes lumineuses qu'une à une, une foule de gouttes qui attend derrière.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a sloth hanging from a gate bar, letting glowing droplets through only one at a time, a crowd of droplets waiting behind it. It embodies "Rate limiting" (enterprise integration, API). What it means (French, for context only): « Limiter le nombre d’appels d’un consommateur. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle emerald glow, limited palette dominated by emerald and dark green, motifs: gates, ramparts, access badges. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 22 — API REST

API · composant · Commune

**Créature** : un chien de rapport joyeux, mi-mécanique, qui va chercher des cubes lumineux de porte en porte et les rapporte dans sa gueule.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a cheerful half-mechanical retriever dog fetching glowing cubes from door to door and bringing them back in its mouth. It embodies "API REST" (enterprise integration, API). What it means (French, for context only): « Des ressources, des verbes HTTP et du JSON. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle emerald glow, limited palette dominated by emerald and dark green, motifs: gates, ramparts, access badges. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 23 — OpenAPI

API · composant · Commune

**Créature** : un axolotl scribe qui déroule un long parchemin-plan lumineux, sur lequel sont dessinées des portes et des flèches.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: an axolotl scribe unrolling a long glowing blueprint scroll on which doors and arrows are drawn. It embodies "OpenAPI" (enterprise integration, API). What it means (French, for context only): « Le contrat d’une API REST. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle emerald glow, limited palette dominated by emerald and dark green, motifs: gates, ramparts, access badges. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 24 — Portail développeur

API · composant · Commune

**Créature** : un phare-créature au visage accueillant, qui guide de petits bateaux vers un quai chargé de documentation.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a lighthouse creature with a welcoming face, guiding small boats toward a dock stacked with documentation. It embodies "Portail développeur" (enterprise integration, API). What it means (French, for context only): « Là où les consommateurs découvrent les API et s’y abonnent. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle emerald glow, limited palette dominated by emerald and dark green, motifs: gates, ramparts, access badges. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 25 — Webhook

API · composant · Commune

**Créature** : un martin-pêcheur qui plonge comme un hameçon pour livrer un message lumineux à l'instant où une cloche sonne.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a kingfisher diving like a fishing hook to deliver a glowing note the very instant a bell rings. It embodies "Webhook" (enterprise integration, API). What it means (French, for context only): « L’API qui rappelle quand quelque chose se passe. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle emerald glow, limited palette dominated by emerald and dark green, motifs: gates, ramparts, access badges. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

## iPaaS

### 26 — webMethods.io

iPaaS · évolution · Légendaire · carte d'origine : webMethods Integration Server 10.15 (9)

**Créature** : la pieuvre-moyeu d'Integration Server, devenue légère et flottante au milieu des nuages ; ses tentacules-tuyaux sont devenus des connecteurs emboîtables.

```text
Generate a new image. From the first reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment; do NOT reuse its character, pose or composition. The second reference image shows the base form of this card’s creature: draw its evolved form, keeping its species and recognizable silhouette, upgraded and more spectacular, in a new dynamic three-quarter pose, in its own small scene, with no circular halo behind it. Subject: the mechanical octopus hub, evolved: now sleek and floating among clouds, its pipe tentacles turned into snap-together connectors. It embodies "webMethods.io" (enterprise integration, iPaaS). It is the evolution of "webMethods Integration Server 10.15". What it means (French, for context only): « L’intégration en mode iPaaS, sans serveur à maintenir. ». Rarity: legendary card: a radiant aura, sparkling particles and light rays filling the scene. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle teal glow, limited palette dominated by teal and cyan, motifs: clouds, interlocking connectors. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 27 — Connecteur ERP

iPaaS · composant · Rare

**Créature** : un bœuf puissant attelé à un chariot en forme de pont, qui relie deux grands entrepôts.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a strong ox harnessed to a bridge-shaped cart, linking two large warehouses. It embodies "Connecteur ERP" (enterprise integration, iPaaS). What it means (French, for context only): « Un connecteur prêt à l’emploi vers l’ERP. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle teal glow, limited palette dominated by teal and cyan, motifs: clouds, interlocking connectors. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 28 — Connecteur SaaS

iPaaS · composant · Commune

**Créature** : un colibri qui file entre des îles-nuages flottantes et branche un petit câble sur chacune.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a hummingbird zipping between floating cloud islands, plugging a little cable into each one. It embodies "Connecteur SaaS" (enterprise integration, iPaaS). What it means (French, for context only): « Brancher une application cloud en quelques minutes. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle teal glow, limited palette dominated by teal and cyan, motifs: clouds, interlocking connectors. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 29 — Workflow low-code

iPaaS · composant · Commune

**Créature** : un golem sympathique fait de blocs emboîtables colorés, qui réarrange ses propres membres en organigramme.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a friendly golem made of snap-together blocks, rearranging its own limbs into a flowchart. It embodies "Workflow low-code" (enterprise integration, iPaaS). What it means (French, for context only): « Un flux dessiné plutôt que codé. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle teal glow, limited palette dominated by teal and cyan, motifs: clouds, interlocking connectors. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 30 — Mapping de données

iPaaS · sort · Commune

**Créature** : un papillon dont une aile est faite de carrés et l'autre de ronds : les jetons carrés qui le traversent en ressortent ronds.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a butterfly with one wing made of squares and the other of circles: square tokens flying through it come out round. It embodies "Mapping de données" (enterprise integration, iPaaS). What it means (French, for context only): « Transformer un format en un autre. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle teal glow, limited palette dominated by teal and cyan, motifs: clouds, interlocking connectors. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

## Événementiel (EDA)

### 31 — Solace Event Mesh

Événementiel (EDA) · composant · Épique

**Créature** : une méduse géante et lumineuse dont les tentacules forment un maillage qui relaie des étincelles d'événements dans toutes les directions.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a giant luminous jellyfish whose tentacles form a mesh network relaying sparks of events in every direction. It embodies "Solace Event Mesh" (enterprise integration, Événementiel (EDA)). What it means (French, for context only): « Le maillage d’événements d’Elis : un événement publié atteint tous ses abonnés. ». Rarity: epic card: a bright aura around the creature and sparkling particles. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle violet glow, limited palette dominated by violet and indigo, motifs: waves, glowing threads, mesh. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 32 — Solace Event Portal

Événementiel (EDA) · composant · Rare

**Créature** : une girafe astronome dont le long cou atteint les étoiles : elle range des constellations d'événements dans un grand atlas du ciel.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a giraffe astronomer whose long neck reaches the stars, filing event constellations into a large sky atlas. It embodies "Solace Event Portal" (enterprise integration, Événementiel (EDA)). What it means (French, for context only): « Le catalogue des événements. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle violet glow, limited palette dominated by violet and indigo, motifs: waves, glowing threads, mesh. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 33 — Event broker

Événementiel (EDA) · composant · Rare

**Créature** : un scarabée standardiste aux nombreux bras, qui branche chaque étincelle dans la bonne prise d'un grand standard.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a many-armed beetle switchboard operator, plugging each spark into the right socket of a large switchboard. It embodies "Event broker" (enterprise integration, Événementiel (EDA)). What it means (French, for context only): « Reçoit, stocke et distribue les événements. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle violet glow, limited palette dominated by violet and indigo, motifs: waves, glowing threads, mesh. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 34 — CDC

Événementiel (EDA) · composant · Rare

**Créature** : une grenouille arboricole accrochée à une tour de base de données, qui attrape avec sa langue chaque ligne modifiée comme une mouche.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a tree frog clinging to a database tower, catching each changed row with its tongue like a fly. It embodies "CDC" (enterprise integration, Événementiel (EDA)). What it means (French, for context only): « Change Data Capture : capturer les changements d’une base et les publier. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle violet glow, limited palette dominated by violet and indigo, motifs: waves, glowing threads, mesh. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 35 — Pub/Sub

Événementiel (EDA) · composant · Commune

**Créature** : un coq crieur public au sommet d'une tour, qui annonce à la ronde ; de nombreux petits oiseaux à antenne l'écoutent.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a rooster town crier on top of a tower broadcasting far and wide, many small birds with antennas listening. It embodies "Pub/Sub" (enterprise integration, Événementiel (EDA)). What it means (French, for context only): « Un éditeur, plusieurs abonnés. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle violet glow, limited palette dominated by violet and indigo, motifs: waves, glowing threads, mesh. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 36 — Topic

Événementiel (EDA) · composant · Commune

**Créature** : un arbre-créature aux yeux doux dont chaque branche est un canal lumineux, les étincelles se posant chacune sur la bonne branche.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a gentle tree creature with kind eyes whose branches are glowing channels, each spark perching on the right branch. It embodies "Topic" (enterprise integration, Événementiel (EDA)). What it means (French, for context only): « L’adresse hiérarchique d’un événement. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle violet glow, limited palette dominated by violet and indigo, motifs: waves, glowing threads, mesh. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 37 — File d’attente

Événementiel (EDA) · composant · Commune

**Créature** : une colonne de fourmis disciplinées, chacune portant un message, qui entrent une à une dans la fourmilière.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a disciplined column of ants, each carrying a glowing message, entering their anthill one at a time. It embodies "File d’attente" (enterprise integration, Événementiel (EDA)). What it means (French, for context only): « Garde les messages tant qu’ils ne sont pas consommés. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle violet glow, limited palette dominated by violet and indigo, motifs: waves, glowing threads, mesh. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 38 — AsyncAPI

Événementiel (EDA) · composant · Commune

**Créature** : un hippocampe cartographe qui trace sur un parchemin flottant la carte des courants lumineux qui l'entourent.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a seahorse cartographer drawing a map of the glowing currents around it on a floating scroll. It embodies "AsyncAPI" (enterprise integration, Événementiel (EDA)). What it means (French, for context only): « Le contrat d’une API événementielle. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle violet glow, limited palette dominated by violet and indigo, motifs: waves, glowing threads, mesh. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

## IA agentique

### 39 — Solace Agent Mesh

IA agentique · évolution · Légendaire · carte d'origine : Solace Event Mesh (31)

**Créature** : la méduse-maillage de Solace Event Mesh, plus grande et couronnée de constellations ; de petits agents lumineux chevauchent ses tentacules et discutent entre eux.

```text
Generate a new image. From the first reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment; do NOT reuse its character, pose or composition. The second reference image shows the base form of this card’s creature: draw its evolved form, keeping its species and recognizable silhouette, upgraded and more spectacular, in a new dynamic three-quarter pose, in its own small scene, with no circular halo behind it. Subject: the giant mesh jellyfish, evolved: bigger, crowned with constellations, small glowing agent sprites riding its tentacles and talking to each other. It embodies "Solace Agent Mesh" (enterprise integration, IA agentique). It is the evolution of "Solace Event Mesh". What it means (French, for context only): « Les agents d’IA branchés sur l’event mesh, qui dialoguent en A2A et utilisent MCP. ». Rarity: legendary card: a radiant aura, sparkling particles and light rays filling the scene. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 40 — Apigee AI Gateway

IA agentique · évolution · Légendaire · carte d'origine : Apigee API Gateway (18)

**Créature** : le griffon gardien d'Apigee API Gateway, évolué : ailes parcourues de circuits neuronaux, couronne de lumière, il filtre un flot de bulles de pensée au lieu de colis.

```text
Generate a new image. From the first reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment; do NOT reuse its character, pose or composition. The second reference image shows the base form of this card’s creature: draw its evolved form, keeping its species and recognizable silhouette, upgraded and more spectacular, in a new dynamic three-quarter pose, in its own small scene, with no circular halo behind it. Subject: the guardian griffin, evolved: its wings now traced with neural circuits, wearing a crown of light, filtering a stream of thought bubbles instead of parcels. It embodies "Apigee AI Gateway" (enterprise integration, IA agentique). It is the evolution of "Apigee API Gateway". What it means (French, for context only): « La future passerelle IA d’Elis : quotas de tokens, cache sémantique, garde-fous et routage entre modèles. ». Rarity: legendary card: a radiant aura, sparkling particles and light rays filling the scene. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 41 — LLM

IA agentique · composant · Épique

**Créature** : une immense baleine paisible qui nage dans une mer de jetons lumineux, le corps parcouru de chemins neuronaux.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: an enormous calm whale swimming through a sea of glowing tokens, its body patterned with neural pathways. It embodies "LLM" (enterprise integration, IA agentique). What it means (French, for context only): « Le grand modèle de langage. ». Rarity: epic card: a bright aura around the creature and sparkling particles. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 42 — Agent

IA agentique · composant · Rare

**Créature** : un renard malin, sac à dos et ceinture à outils, qui part en mission une carte à la main.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a clever fox with a backpack and a toolbelt, setting off on a mission holding a map. It embodies "Agent" (enterprise integration, IA agentique). What it means (French, for context only): « Un LLM qui planifie et agit avec des outils. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 43 — Orchestrateur multi-agents

IA agentique · composant · Rare

**Créature** : un raton laveur chef d'orchestre qui dirige à la baguette un petit orchestre d'agents lumineux.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a raccoon orchestra conductor directing a group of small glowing agent sprites with a baton. It embodies "Orchestrateur multi-agents" (enterprise integration, IA agentique). What it means (French, for context only): « Répartit le travail entre plusieurs agents. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 44 — Serveur MCP

IA agentique · composant · Rare

**Créature** : un bernard-l'ermite dont la coquille est une boîte à outils, qui tend un outil sorti d'un tiroir à un petit visiteur.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a hermit crab whose shell is a toolbox, offering a tool from one of its drawers to a small visitor. It embodies "Serveur MCP" (enterprise integration, IA agentique). What it means (French, for context only): « Model Context Protocol : expose des outils et des données aux IA. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 45 — Agent Card (A2A)

IA agentique · composant · Rare

**Créature** : un paon qui déploie une queue faite de cartes de compétences lumineuses, qu'une autre créature vient lire.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a peacock fanning out a tail made of glowing skill cards for another creature to read. It embodies "Agent Card (A2A)" (enterprise integration, IA agentique). What it means (French, for context only): « Dans le protocole A2A, la fiche par laquelle un agent se présente à un autre. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 46 — RAG

IA agentique · composant · Rare

**Créature** : un écureuil bibliothécaire qui va chercher des noisettes-documents lumineuses dans un coffre pour nourrir la question d'une créature plus grande.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a squirrel librarian fetching glowing document-nuts from a vault to feed the question of a larger creature. It embodies "RAG" (enterprise integration, IA agentique). What it means (French, for context only): « Retrieval-Augmented Generation : chercher les bons documents avant de répondre. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 47 — Chain of thought

IA agentique · sort · Rare

**Créature** : une chèvre de montagne qui saute de pierre lumineuse en pierre lumineuse, une étape après l'autre, au-dessus d'un gouffre.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a mountain goat leaping from glowing stepping stone to glowing stepping stone, one step after another, across a chasm. It embodies "Chain of thought" (enterprise integration, IA agentique). What it means (French, for context only): « Faire raisonner le modèle étape par étape. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 48 — Human-in-the-loop

IA agentique · sort · Rare

**Créature** : un petit lémurien aux grands yeux, une sphère d'action lumineuse entre les mains, qui attend qu'une grande main de lumière stylisée appose son sceau d'accord.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a small wide-eyed lemur holding a glowing action orb, waiting for a large stylized hand of light to stamp its approval seal. It embodies "Human-in-the-loop" (enterprise integration, IA agentique). What it means (French, for context only): « Un humain valide avant que l’agent agisse. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 49 — Base vectorielle

IA agentique · composant · Commune

**Créature** : une ruche géométrique dont les alvéoles lumineuses regroupent les objets semblables, des abeilles les rangeant par proximité.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a geometric beehive whose glowing cells cluster similar items together, bees sorting them by closeness. It embodies "Base vectorielle" (enterprise integration, IA agentique). What it means (French, for context only): « Retrouver des textes par leur sens plutôt que par leurs mots. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 50 — Fenêtre de contexte

IA agentique · composant · Commune

**Créature** : un hérisson qui porte sur son dos un grand cadre de fenêtre : seul ce qui est dans le cadre est éclairé, le reste se perd dans l'ombre.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a hedgehog carrying a large window frame on its back: only what is inside the frame is lit, everything else fades into shadow. It embodies "Fenêtre de contexte" (enterprise integration, IA agentique). What it means (French, for context only): « Ce que le modèle peut lire d’un coup. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 51 — Prompt système

IA agentique · sort · Commune

**Créature** : un cerf majestueux dont les bois portent des runes lumineuses gravées une fois pour toutes, qui éclaire le chemin d'une petite créature.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a majestic stag whose antlers carry glowing runes engraved once and for all, lighting the path of a small creature. It embodies "Prompt système" (enterprise integration, IA agentique). What it means (French, for context only): « Les consignes permanentes données au modèle. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 52 — Few-shot

IA agentique · sort · Commune

**Créature** : un jeune singe imitateur qui copie la pose de trois petites statuettes-exemples posées sur un piédestal.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a young monkey copying the poses of three small example statuettes standing on a pedestal. It embodies "Few-shot" (enterprise integration, IA agentique). What it means (French, for context only): « Montrer quelques exemples au modèle pour qu’il les imite. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle magenta glow, limited palette dominated by magenta and purple, motifs: constellations, glowing eyes, synapses. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

## Patterns

### 53 — Dead Letter Queue

Patterns · sort · Épique

**Créature** : un fantôme trieur postal, très grand, qui range les lettres lumineuses impossibles à livrer dans un meuble à tiroirs à part, pour les renvoyer plus tard.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a tall ghostly mail sorter collecting undeliverable glowing letters into a special chest of drawers, to send them again later. It embodies "Dead Letter Queue" (enterprise integration, Patterns). What it means (French, for context only): « La file où vont les messages en échec, pour être rejoués. ». Rarity: epic card: a bright aura around the creature and sparkling particles. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle slate glow, limited palette dominated by slate and bluish grey, motifs: gears, railway switches, blueprints. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 54 — Circuit Breaker

Patterns · sort · Rare

**Créature** : une anguille électrique qui tient entre ses mâchoires un gros interrupteur ouvert : les étincelles s'arrêtent net devant un petit service fragile.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: an electric eel holding a big open circuit-breaker switch in its jaws, sparks stopping dead in front of a small fragile service. It embodies "Circuit Breaker" (enterprise integration, Patterns). What it means (French, for context only): « Couper les appels vers un service en panne, le temps qu’il se rétablisse. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle slate glow, limited palette dominated by slate and bluish grey, motifs: gears, railway switches, blueprints. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 55 — Content-Based Router

Patterns · sort · Commune

**Créature** : un blaireau aiguilleur qui actionne un levier et envoie chaque colis vers le tapis roulant de sa couleur.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a badger switchman pulling a lever, sending each parcel onto the conveyor belt of its own color. It embodies "Content-Based Router" (enterprise integration, Patterns). What it means (French, for context only): « Router un message selon son contenu. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle slate glow, limited palette dominated by slate and bluish grey, motifs: gears, railway switches, blueprints. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 56 — Splitter

Patterns · sort · Commune

**Créature** : un pivert qui fend une grosse bûche-message en petites bûchettes bien rangées.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a woodpecker splitting a big message log into neat small sticks. It embodies "Splitter" (enterprise integration, Patterns). What it means (French, for context only): « Découper un message en plusieurs. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle slate glow, limited palette dominated by slate and bluish grey, motifs: gears, railway switches, blueprints. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 57 — Idempotent Consumer

Patterns · sort · Commune

**Créature** : un panda placide qui mange un seul biscuit-message pendant que son double identique rebondit sur un bouclier lumineux.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a placid panda calmly eating one message cookie while an identical duplicate bounces off a glowing shield. It embodies "Idempotent Consumer" (enterprise integration, Patterns). What it means (French, for context only): « Recevoir deux fois le même message sans effet de bord. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle slate glow, limited palette dominated by slate and bluish grey, motifs: gears, railway switches, blueprints. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 58 — Retry

Patterns · sort · Commune

**Créature** : un kangourou qui relance patiemment un boomerang lumineux, qui revient en boucle.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a kangaroo patiently throwing a glowing boomerang again and again, its trail forming a loop. It embodies "Retry" (enterprise integration, Patterns). What it means (French, for context only): « Réessayer après un échec, avec modération. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle slate glow, limited palette dominated by slate and bluish grey, motifs: gears, railway switches, blueprints. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

## Bestiaire

### 59 — Prompt injection

Bestiaire · incident · Épique

**Créature** : un diablotin sournois qui glisse un parchemin empoisonné et lumineux dans la sacoche d'un agent endormi, en chuchotant.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a sly imp sneaking a glowing poisoned scroll into the satchel of a sleeping agent creature, whispering. It embodies "Prompt injection" (enterprise integration, Bestiaire). What it means (French, for context only): « Des instructions cachées dans les données détournent l’agent. ». Rarity: epic card: a bright aura around the creature and sparkling particles. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 60 — Mot de passe en clair

Bestiaire · incident · Rare

**Créature** : un gobelin insouciant, perché sur un vieux sac postal, qui porte bien en vue une clé lumineuse en collier, tandis que des yeux l'épient dans l'ombre.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a careless goblin perched on an old mail sack, proudly wearing an unhidden glowing key on a necklace while shadowy eyes peek at it. It embodies "Mot de passe en clair" (enterprise integration, Bestiaire). What it means (French, for context only): « FTP transmet les identifiants sans chiffrement. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 61 — Certificat expiré

Bestiaire · incident · Rare

**Créature** : une créature-parchemin desséchée et triste, au sceau de cire fendu et au ruban fané, qui tombe en poussière à côté d'un sablier vide.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a sad dried-up parchment creature with a cracked wax seal and a faded ribbon, crumbling to dust beside an empty hourglass. It embodies "Certificat expiré" (enterprise integration, Bestiaire). What it means (French, for context only): « Le certificat TLS que personne n’a renouvelé. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 62 — Couplage fort

Bestiaire · incident · Rare

**Créature** : deux mules têtues attachées par un joug et une lourde chaîne : l'une s'effondre et entraîne l'autre dans sa chute.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: two stubborn mules bound by a yoke and a heavy chain: one collapses and drags the other down with it. It embodies "Couplage fort" (enterprise integration, Bestiaire). What it means (French, for context only): « Deux systèmes si dépendants que la panne de l’un entraîne l’autre. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 63 — Hallucination

Bestiaire · incident · Rare

**Créature** : un petit génie de fumée qui montre fièrement un mirage tourbillonnant d'objets qui n'existent pas.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a small smoke genie proudly pointing at a swirling mirage of objects that do not exist. It embodies "Hallucination" (enterprise integration, Bestiaire). What it means (French, for context only): « Le modèle invente une réponse plausible mais fausse. ». Rarity: rare card: a few subtle glints and light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 64 — Message poison

Bestiaire · incident · Commune

**Créature** : un champignon vénéneux au chapeau tacheté qui pousse au milieu d'une file de caisses et les contamine : la file est bloquée.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a poisonous spotted toadstool creature sprouting in the middle of a queue of crates and making them sick, the whole queue stuck. It embodies "Message poison" (enterprise integration, Bestiaire). What it means (French, for context only): « Un message que le consommateur ne sait pas traiter et qui bloque la file. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 65 — Timeout

Bestiaire · incident · Commune

**Créature** : un vieux loir endormi devant une porte close, une horloge molle qui coule à côté de lui.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: an old dormouse fast asleep in front of a closed door, a soft melting clock beside it. It embodies "Timeout" (enterprise integration, Bestiaire). What it means (French, for context only): « La réponse n’est jamais arrivée à temps. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 66 — Doublon

Bestiaire · incident · Commune

**Créature** : deux gremlins jumeaux, identiques et espiègles, qui ricanent en portant le même colis.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: two identical mischievous twin gremlins giggling, both carrying the very same parcel. It embodies "Doublon" (enterprise integration, Bestiaire). What it means (French, for context only): « Le même message traité deux fois. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 67 — Fichier vide à 3 h du matin

Bestiaire · incident · Commune

**Créature** : une chauve-souris livreuse qui apporte une boîte ouverte et vide sous la pleine lune, une salle serveur endormie derrière.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a bat courier delivering an open empty box under a full moon, a sleepy server room behind it. It embodies "Fichier vide à 3 h du matin" (enterprise integration, Bestiaire). What it means (French, for context only): « Le traitement de nuit a tourné… sur un fichier vide. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 68 — Encodage cassé

Bestiaire · incident · Commune

**Créature** : une créature bugguée faite de tuiles de mosaïque mélangées et de formes de glyphes cassés (aucune vraie lettre).

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a glitchy creature made of scrambled mosaic tiles and broken glyph-like shapes that are not real letters. It embodies "Encodage cassé" (enterprise integration, Bestiaire). What it means (French, for context only): « ISO-8859-1 contre UTF-8 : les accents deviennent illisibles. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 69 — Contexte saturé

Bestiaire · incident · Commune

**Créature** : une créature-sac de toile tellement bourrée de parchemins que ses coutures craquent et que les premiers s'échappent par le fond.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a cloth-sack creature stuffed to bursting with scrolls, its seams popping, the first scrolls slipping out of the bottom. It embodies "Contexte saturé" (enterprise integration, Bestiaire). What it means (French, for context only): « Trop d’informations : le modèle oublie les consignes du début. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 70 — Boucle d’agents

Bestiaire · incident · Commune

**Créature** : deux petits renards-agents qui se poursuivent la queue en cercle, dans une boucle lumineuse sans fin.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: two small fox agents chasing each other's tails in a circle, in an endless glowing loop. It embodies "Boucle d’agents" (enterprise integration, Bestiaire). What it means (French, for context only): « Deux agents qui se délèguent la tâche l’un à l’autre, sans fin. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```

### 71 — Facture de tokens

Bestiaire · incident · Commune

**Créature** : un cochon-tirelire monstrueux et affamé qui engloutit des pièces lumineuses, un ticket de caisse sans fin qui lui sort de la gueule.

```text
Generate a new image. From the reference image, keep ONLY the rendering style: line quality, soft cel shading, lighting and dark navy background treatment. Do NOT reuse its character, pose or composition: no robot standing in a doorway, no circular halo behind it, no frontal symmetric framing. Invent a creature with a clearly different body shape, size and pose, built from its own motifs, in a dynamic three-quarter view, in its own small scene. Subject: a monstrous hungry piggy bank gulping down glowing coins, an endless blank receipt ribbon spilling from its mouth. It embodies "Facture de tokens" (enterprise integration, Bestiaire). What it means (French, for context only): « Chaque appel au modèle se paie au nombre de tokens. ». Rarity: common card: sober, minimal light effects. Digital illustration for a collectible card game, landscape 4:3, one single main creature readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle crimson glow, limited palette dominated by red and dark pink, motifs: cracks, smoke, menacing creatures. Strictly no text, no letters, no numbers, no logos, no brand marks, no watermark, no real people.
```
