# Direction artistique des illustrations

> Validée sur l'essai d'US-016, puis corrigée pendant US-017 (2026-10-24) : une créature à elle par carte.

## L'idée

Chaque carte est une **créature à elle** : une espèce, une silhouette, une posture et une petite scène tirées de ce
que la carte représente, comme les créatures d'un jeu de cartes. FTP est un vieux pélican facteur dont la poche du bec,
grande ouverte, laisse tout voir ; SFTP un coursier blindé à carapace de cadenas dans un tunnel chiffré ; une passerelle
API un griffon gardien perché sur une porte fortifiée ; le RAG un écureuil bibliothécaire. Les créatures peuvent être
en partie mécaniques, faites de pièces de la salle serveur. Le ton suit l'univers ([univers.md](univers.md)) :
affectueux et un peu moqueur pour les anciennes briques, spectaculaire pour les modernes, inquiétant (sans horreur)
pour le bestiaire.

Le premier essai (une « machine-créature de la salle serveur » pour toutes, dans le cadrage de la première image)
donnait toujours le même robot de face dans une arche, avec un halo : **seule la couleur changeait**, les cartes ne se
distinguaient pas. D'où la règle : on partage le **rendu**, jamais le personnage.

## Ce qui est commun, ce qui est propre à chaque carte

- **Commun à tout le set** (repris de l'image de référence, SFTP) : la qualité du trait, l'ombrage doux en aplats
  (_cel shading_), la lumière, le fond bleu nuit et sa lueur.
- **Propre à la famille** : la palette, la couleur de la lueur et les motifs du décor (tableau ci-dessous).
- **Propre à la rareté** : l'intensité de la lumière (voir les règles de composition).
- **Propre à la carte** : la créature (espèce et silhouette jamais reprises ailleurs dans le set), sa posture, sa
  scène. La liste des 71 créatures est dans [prompts-illustrations-gemini.md](prompts-illustrations-gemini.md).
- **Les évolutions** (webMethods.io, Solace Agent Mesh, Apigee AI Gateway) reprennent l'espèce et la silhouette de
  leur carte d'origine (Integration Server, Solace Event Mesh, Apigee API Gateway), en plus grand et plus
  spectaculaire : on les reconnaît d'un coup d'œil.

## Règles de composition

- **Format 4:3 paysage**, **une seule créature principale** lisible à 170 px de large (grille du téléphone) ; de
  petits personnages secondaires sont permis s'ils restent au second plan.
- **Vue de trois quarts, dynamique**, dans une petite scène à elle ; pas de créature debout de face dans une arche, pas
  de disque de lumière derrière elle, pas de cadrage symétrique.
- Formes franches, ombrage doux en aplats, fond sombre bleu nuit avec une lueur de la couleur de la famille.
- **Interdits** : texte, lettres et chiffres dans l'image ; logos et marques de produits (Apigee, Solace, webMethods…) ;
  personnes réelles reconnaissables ; données d'entreprise.
- La **rareté** se lit à l'intensité : une commune est sobre, une rare a quelques reflets, une épique une aura et des
  particules, une légendaire une aura éclatante, des particules et des rayons qui emplissent la scène.

## Palette par famille (reprend les accents d'US-009)

| Famille            | Couleurs dominantes     | Motif récurrent                         |
| ------------------ | ----------------------- | --------------------------------------- |
| Fichiers & Batch   | ambre, orange brûlé     | dossiers, bandes perforées, horloges    |
| Messagerie & ESB   | bleu ciel, bleu profond | tuyaux, moyeux, câbles en étoile        |
| API                | émeraude, vert sombre   | portes, remparts, badges d'accès        |
| iPaaS              | sarcelle, cyan          | nuages, connecteurs emboîtables         |
| Événementiel (EDA) | violet, indigo          | ondes, fils lumineux, maillage          |
| IA agentique       | fuchsia, pourpre        | constellations, yeux lumineux, synapses |
| Patterns           | ardoise, gris bleuté    | engrenages, aiguillages, plans          |
| Bestiaire          | rouge, rose sombre      | fissures, fumée, créatures menaçantes   |

## Consigne type (pour Gemini)

Les consignes sont écrites **en anglais**, la langue que les générateurs suivent le mieux ; tout le reste du projet
reste en français. Chaque consigne assemble une **ouverture** commune (ne reprendre de l'image de référence que le
rendu), le **sujet** propre à la carte (sa créature), son sens, sa **rareté** et le **bloc de style** de sa famille :

> _Bloc de style_ : `Digital illustration for a collectible card game, landscape 4:3, one single main creature
readable at small size, clean bold shapes, soft cel shading, dark navy blue background with a subtle {couleur} glow,
limited palette dominated by {couleurs}, motifs: {motifs}. Strictly no text, no letters, no numbers, no logos, no
brand marks, no watermark, no real people.`

Les 71 prompts prêts à l'emploi et leur mode d'emploi : [prompts-illustrations-gemini.md](prompts-illustrations-gemini.md).
Gemini (application web) rend des JPEG 2400 × 1792, convertis en PNG puis déclinés par `npm run illustrations`
([ADR 0015](../decisions/0015-illustrations-statiques-optimisees.md)).

## Texte alternatif

Une phrase en français qui décrit **ce que montre l'image**, sans répéter le nom de la carte (il est déjà lu) :
« Un vieux pélican facteur en vol, la poche du bec grande ouverte et pleine de dossiers ».

## L'interface autour des cartes (US-061)

L'interface parle la même langue que les illustrations ([charte graphique](charte-graphique.md),
[ADR 0037](../decisions/0037-identite-visuelle-nuit-electrique.md)) :

- **La nuit des illustrations devient celle du site** : fond bleu nuit `#0b1029`, halos violet et cyan, trame de
  points. En thème clair, les mêmes halos sur un fond lavande pâle ; le bandeau et la barre d'onglets restent de nuit,
  comme le dos d'une carte.
- **Le dos de carte** reprend cette nuit, une trame en losanges, un liseré doré et le logo au centre : il tient la
  place des cartes pendant un chargement et figurera les paquets de boosters (US-062).
- **Le logo** : deux cartes en éventail, la face porte un moyeu de connexions doré, l'intégration en un signe.
- **L'or est l'énergie** : la gemme de Débit des cartes et le bouton de l'action principale ont la même couleur.
- **La rareté se lit à l'intensité**, sur l'interface comme dans l'image : une commune est sobre, une épique ou une
  légendaire porte un halo.
- Les illustrations définitives doivent rester lisibles **sur fond clair comme sur fond sombre** : le cadre de la
  carte les sépare toujours du fond de la page.
