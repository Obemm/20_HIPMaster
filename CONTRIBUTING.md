# Proposer une carte

HIPMaster accueille les cartes de la communauté IT : une technologie, un pattern ou un incident vécu, avec un texte qui
explique ce qu'il représente dans un SI. Une carte proposée est une **pull request**
(ADR [0050](docs/decisions/0050-cartes-communaute-par-pull-request.md)).

## Avant de commencer

Lisez le guide **[Concevoir une carte](docs/contribuer/regles-cartes.md)** : familles, types, raretés, ordres de
grandeur des statistiques, capacités, texte « En vrai », règles de contenu et gabarit de proposition. Remplissez le
gabarit : c'est lui que vous donnerez à votre IA et que vous reprendrez dans la PR.

**Le dépôt est public, et votre PR l'est dès son ouverture** : relisez les
[règles de contenu](docs/contribuer/regles-cartes.md#règles-de-contenu) avant de pousser quoi que ce soit.

## La démarche

1. **Forkez** le dépôt sur GitHub, puis clonez votre fork. Vous n'avez besoin d'aucun droit sur le dépôt d'origine.
2. **Installez** le projet : Node 24.15 ou plus, puis `npm ci` (voir le [README](README.md#démarrage)).
3. **Créez une branche** `carte-<nom-de-la-carte>`.
4. **Écrivez la carte avec votre assistant IA**, à partir de votre gabarit : donnez-lui la
   [consigne de carte](docs/contribuer/consigne-carte.md) (la carte, sa traduction anglaise, sa fiche « En savoir
   plus », les tests), puis dessinez la créature avec la [consigne d'illustration](docs/contribuer/consigne-illustration.md).
5. **Vérifiez** : `npm run check` doit passer (lint, format, types, tests), et `npm run dev` vous montre la carte dans
   le catalogue (localhost:4200).
6. **Ouvrez la PR** vers `main` avec le modèle « carte », en ajoutant `?expand=1&template=carte.md` à l'adresse de
   comparaison : `https://github.com/Obemm/20_HIPMaster/compare/main...<votre-compte>:<votre-branche>?expand=1&template=carte.md`.
   Collez-y votre gabarit, joignez l'original de l'illustration et cochez vos vérifications.

Pas de compte GitHub, ou pas le temps ? Envoyez le gabarit rempli au porteur du projet : il intégrera la carte lui-même.

## Après la PR

Le porteur du projet relit la carte avec la liste de contrôle du modèle (exactitude, clarté, confidentialité,
doublons, règles, équilibrage, illustration). La CI mesure l'équilibrage de votre carte : le job « Équilibrage des
cartes nouvelles » affiche, dans son résumé, ce qu'elle change dans chaque deck prêté ; vous pouvez le mesurer
vous-même avant, avec `npm run simuler:carte -- <numéro>` (une minute et demie environ). Il répond dans la PR : fusionnée, à retravailler ou refusée avec un motif, en moins de deux
semaines. À la fusion, la carte est mise en ligne automatiquement, avec votre nom.

Les commits suivent les [Conventional Commits](https://www.conventionalcommits.org/fr/) en français, sujet en
minuscules : `feat(carte): la carte api graphql`.
