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
     "consigne": "La consigne donnée au générateur, pour pouvoir refaire l'image",
     "provenance": { "outil": "Recraft", "date": "2026-10-18" }
   }
   ```

   Le texte alternatif dit **ce que montre l'image**, en une phrase, sans répéter le nom de la carte (il est déjà lu).

3. Lancer, à la racine du dépôt :

   ```bash
   npm run illustrations
   ```

   Le script produit `apps/web/public/cartes/set-1/<numero>-{320,640}.{avif,webp}` et régénère le manifeste
   `apps/web/src/app/cartes/illustrations.generated.ts`. Il **n'écrit rien** si une erreur subsiste (original absent
   ou trop petit, texte alternatif manquant, numéro de carte inconnu, fichier de 100 Ko ou plus).

4. Commiter `set-1.json`, les images produites et le manifeste. **Pas les originaux** : `sources/` est ignoré par Git ;
   les archiver à part (ils seront rangés dans un Azure Storage Account à la mise en ligne).

Retirer une carte de `set-1.json` puis relancer le script supprime ses images servies.

## Illustrations provisoires (US-018)

En attendant de vraies illustrations, `npm run illustrations:provisoires` dessine les 71 cartes par le code
(`src/vectoriel/`, [ADR 0016](../../docs/decisions/0016-illustrations-provisoires-vectorielles.md)), réécrit
`set-1.json` puis lance la déclinaison. Le générateur est déterministe : il fait foi, il n'y a pas d'original à
archiver. Pour remplacer une carte par une vraie illustration, déposer son original et mettre à jour son entrée dans
`set-1.json`, puis lancer `npm run illustrations` (et non plus `illustrations:provisoires`, qui écraserait l'entrée).
