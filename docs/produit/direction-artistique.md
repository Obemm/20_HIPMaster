# Direction artistique des illustrations (brouillon, essai US-016)

> Brouillon soumis à l'essai sur 4 cartes. Il sera validé, ou corrigé, par le porteur du projet à la fin d'US-016.

## L'idée

Chaque technologie devient une **machine-créature** de la salle serveur : un objet technique doté d'une personnalité,
comme les créatures d'un jeu de cartes. FTP est un vieux robot facteur couvert de poussière ; une passerelle API est
une forteresse qui filtre ; un agent d'IA est une créature lumineuse reliée à un réseau. Le ton suit l'univers
([univers.md](univers.md)) : affectueux et un peu moqueur pour les anciennes briques, spectaculaire pour les modernes.

## Règles de composition

- **Format 4:3 paysage**, sujet **centré** et lisible à 170 px de large (grille du téléphone) : une seule silhouette
  principale, un fond simple.
- **Vue isométrique** légère, formes franches, ombrage doux en aplats (_cel shading_), fond sombre bleu nuit avec une
  lueur de la couleur de la famille.
- **Interdits** : texte, lettres et chiffres dans l'image ; logos et marques de produits (Apigee, Solace, webMethods…) ;
  personnes réelles reconnaissables ; données d'entreprise.
- La **rareté** se lit à l'intensité : une commune est sobre, une légendaire a un halo et des particules.

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

## Consigne type (pour Recraft)

Les consignes sont écrites **en anglais**, la langue que les générateurs suivent le mieux ; tout le reste du projet
reste en français. Chaque consigne assemble un **sujet** propre à la carte et le **bloc de style** commun :

> _Bloc de style_ : `digital illustration for a collectible card game, light isometric view, single central subject,
clean bold shapes, soft cel shading, dark navy background with a subtle {couleur} glow, limited palette dominated
by {couleurs}, no text, no letters, no numbers, no logos, no watermark`

Réglages : style **Digital illustration**, format **4:3** (paysage), export **PNG**.

## Texte alternatif

Une phrase en français qui décrit **ce que montre l'image**, sans répéter le nom de la carte (il est déjà lu) :
« Un vieux robot facteur couvert de poussière, qui transporte une pile de dossiers ».

## Essai sur 4 cartes

| N°  | Carte                               | Famille          | Sujet proposé                                                                                                       |
| --- | ----------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | FTP                                 | Fichiers & Batch | Vieux robot facteur rouillé et poussiéreux, une pile de dossiers papier dans les bras, un cadenas ouvert pendouille |
| 9   | webMethods Integration Server 10.15 | Messagerie & ESB | Énorme moyeu mécanique au centre d'une salle, des dizaines de tuyaux en étoile, un peu daté, tenu par des rustines  |
| 18  | Apigee API Gateway                  | API              | Forteresse-porte lumineuse qui filtre une file de petits paquets, sentinelles et compteurs de quotas                |
| 39  | Solace Agent Mesh                   | IA agentique     | Créatures lumineuses reliées par un maillage d'ondes, qui se passent des messages dans un ciel de constellations    |

## Prompts pour Gemini

Un prompt prêt à l'emploi par carte du set 1, avec le bloc de style ci-dessus : [prompts-illustrations-gemini.md](prompts-illustrations-gemini.md).

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
