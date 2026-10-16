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

L'équipe d'intégration d'Elis et les collègues curieux de la plateforme : des joueurs occasionnels qui veulent une
partie courte (moins de 5 minutes) sur téléphone ou ordinateur, et apprendre en jouant.

## Objectifs

1. **Rapide** : un booster s'ouvre en moins d'une seconde, une partie dure moins de 5 minutes.
2. **Partout** : pensé d'abord pour le téléphone.
3. **Juste** : la logique de jeu (tirages, combats) est calculée côté serveur, impossible à tricher.
4. **Pour tous** : accessible (contrastes, clavier), sans achat obligatoire.

## Questions tranchées (US-005, 2026-10-16)

- **Univers** : HIP = la **plateforme d'intégration hybride** d'Elis, du FTP aux agents d'IA — voir [univers.md](univers.md).
- **Origine des cartes** : écrites à la main, en données versionnées — brouillon : [cartes-set-1.md](cartes-set-1.md).
- **Combat** : plateau Débit / attaque / PV contre le SLA du SI adverse — [regles.md](regles.md), ADR 0010.
  Un mode QCM « Certification » est gardé pour plus tard.
- **Monétisation** : aucune ; le jeu est d'abord interne, pour former et animer l'équipe d'intégration.

## Hors périmètre (pour l'instant)

Paiements réels, application mobile native, marché entre joueurs avec argent réel.
