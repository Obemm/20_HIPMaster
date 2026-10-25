# @hipmaster/illustrations

Chaîne d'import et d'optimisation des illustrations des cartes (US-015,
[ADR 0015](../../docs/decisions/0015-illustrations-statiques-optimisees.md)).

## Ajouter ou remplacer l'illustration d'une carte

1. Déposer l'original en PNG dans `sources/set-1/<numero>.png` : au format **4:3** de préférence (il est recadré sur
   la zone la plus intéressante sinon), **640 px de large au moins** (1365 × 1024 conseillé).
2. Décrire l'image dans [`set-1.json`](set-1.json) :

   ```json
   {
     "numero": 1,
     "alt": "Un vieux serveur de fichiers couvert de post-it, dans un local technique sombre",
     "altEn": "An old file server covered in sticky notes, in a dark server room",
     "consigne": "La consigne donnée au générateur, pour pouvoir refaire l'image",
     "provenance": { "outil": "Recraft", "date": "2026-10-18" }
   }
   ```

   Le texte alternatif dit **ce que montre l'image**, en une phrase, sans répéter le nom de la carte (il est déjà lu).
   Il s'écrit dans les deux langues du site (US-081) : `alt` en français, `altEn` en anglais (britannique, comme le
   reste de la version `/en/`) ; les deux sont obligatoires.

3. Lancer, à la racine du dépôt :

   ```bash
   npm run illustrations
   ```

   Le script produit `apps/web/public/illustrations/set-1/<numero>-{320,640}.<empreinte>.{avif,webp}` et régénère le
   manifeste `apps/web/src/app/cartes/illustrations.generated.ts` : les textes alternatifs (langue → numéro → texte,
   chaque version du site lit ceux de sa langue) et les noms des fichiers de chaque carte. Il **n'écrit rien** si une
   erreur subsiste (original absent ou trop petit, texte alternatif manquant, numéro de carte inconnu, fichier de
   100 Ko ou plus).

4. Commiter `set-1.json`, les images produites et le manifeste. **Pas les originaux** : `sources/` est ignoré par Git ;
   les archiver à part (ils seront rangés dans un Azure Storage Account à la mise en ligne).

Retirer une carte de `set-1.json` puis relancer le script supprime ses images servies.

## Empreinte et cache (US-078)

L'**empreinte** est faite des 8 premiers caractères hexadécimaux du SHA-256 du fichier
([ADR 0046](../../docs/decisions/0046-illustrations-a-empreinte-cache-long.md)) : une image refaite change de nom, une
image inchangée garde le sien. C'est ce qui permet à Firebase Hosting de servir `/illustrations/**` avec
`Cache-Control: public, max-age=31536000, immutable` : un joueur ne retélécharge jamais une image déjà vue, et voit la
nouvelle dès la version suivante du site. Le script supprime les fichiers d'une ancienne empreinte ; le front ne lit
que les noms du manifeste. Ne jamais renommer ni retoucher un fichier à la main : le test des fichiers versionnés
refuse un nom dont l'empreinte ne correspond pas au contenu.

## Illustrations provisoires (US-018)

En attendant de vraies illustrations, `npm run illustrations:provisoires` dessine les 71 cartes par le code
(`src/vectoriel/`, [ADR 0016](../../docs/decisions/0016-illustrations-provisoires-vectorielles.md)), réécrit
`set-1.json` puis lance la déclinaison. Le générateur est déterministe : il fait foi, il n'y a pas d'original à
archiver. Pour remplacer une carte par une vraie illustration, déposer son original et mettre à jour son entrée dans
`set-1.json`, puis lancer `npm run illustrations` (et non plus `illustrations:provisoires`, qui écraserait l'entrée).
