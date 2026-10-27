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
6. **Ouvrez la PR** vers `main`, avec le gabarit rempli dans la description, l'original de l'illustration en pièce
   jointe et votre nom d'auteur.

Pas de compte GitHub, ou pas le temps ? Envoyez le gabarit rempli au porteur du projet : il intégrera la carte lui-même.

## Après la PR

Le porteur du projet relit la carte (exactitude, clarté, confidentialité, doublons, illustration), mesure son
équilibrage par simulation et répond dans la PR : fusionnée, à retravailler ou refusée avec un motif, en moins de deux
semaines. À la fusion, la carte est mise en ligne automatiquement, avec votre nom.

Les commits suivent les [Conventional Commits](https://www.conventionalcommits.org/fr/) en français, sujet en
minuscules : `feat(carte): la carte api graphql`.
