# Vision produit

## Idée

**HIPMaster** est un jeu de cartes à collectionner (TCG) qui se joue dans le navigateur, sur le modèle de
WikiMasters et de l'Async TCG présenté dans la vidéo « J'ai demandé à une IA de RECODER WikiMaster… »
(voir [inspirations.md](inspirations.md)).

## Boucle de jeu visée

1. **Ouvrir** des boosters (gratuits à intervalle régulier, ou gagnés en combat).
2. **Collectionner** : compléter un set de cartes de raretés différentes (commune, rare, épique, légendaire).
3. **Jouer** : construire un deck et affronter un bot (plusieurs niveaux), puis d'autres joueurs.
4. **Échanger** : troquer ses doubles, se comparer au classement.

## Pour qui

Joueurs occasionnels qui veulent une partie courte (moins de 5 minutes) sur téléphone ou ordinateur.

## Objectifs

1. **Rapide** : un booster s'ouvre en moins d'une seconde, une partie dure moins de 5 minutes.
2. **Partout** : pensé d'abord pour le téléphone.
3. **Juste** : la logique de jeu (tirages, combats) est calculée côté serveur, impossible à tricher.
4. **Pour tous** : accessible (contrastes, clavier), sans achat obligatoire.

## Questions ouvertes (à trancher dans EPIC-01)

- **Univers** : de quoi parlent les cartes (que signifie « HIP ») ? Articles Wikipédia, thème dev, autre ?
- **Origine des cartes** : générées depuis une source de données (ex. API Wikipédia + fréquentation) ou écrites à la main ?
- **Combat** : QCM sur le contenu des cartes (WikiMasters) ou plateau RAM / attaque / PV (Async TCG) ?
- **Monétisation** : aucune, ou objets cosmétiques sans valeur réelle ?

## Hors périmètre (pour l'instant)

Paiements réels, application mobile native, marché entre joueurs avec argent réel.
