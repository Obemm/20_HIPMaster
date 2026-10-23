# 0014 — État des parties en cours gardé en mémoire par l'API

- **Date** : 2026-10-18
- **Statut** : Remplacée par 0030
- **Référence Elis** : ADR-020 (API REST : réponse en moins de 3 s pour une API front, design first) — retenu ; aucun
  ADR Elis ne traite de l'état applicatif

## Contexte

US-012 fait jouer les parties contre le bot sur le serveur, qui fait foi (ADR 0004, 0013). Il faut garder l'état
de chaque partie entre deux requêtes. Les parties durent moins de 5 minutes, il n'y a pas encore de comptes joueurs
(EPIC-02), et l'API tourne en une seule instance. Le porteur du projet a choisi, le 2026-10-18, de garder cet état
en mémoire pour le premier jalon jouable.

## Décision

- Les parties en cours vivent dans un **dépôt en mémoire** de l'API (`Map` identifiant → partie), propre à chaque
  instance de l'application.
- Chaque partie a un identifiant **UUID v4** (non devinable), l'état complet du moteur (`EtatPartie`), le deck du
  joueur et celui du bot, et sa date de dernière activité.
- **Expiration** : une partie sans activité depuis 30 minutes est supprimée. **Plafond** : 1 000 parties ; au-delà,
  la partie la moins récemment jouée est supprimée pour faire place. Les deux valeurs sont réglables, et l'horloge
  est injectable pour les tests.
- Le bot joue **dans la requête** du joueur, juste après sa fin de tour : la réponse contient la nouvelle vue et les
  événements du tour du bot. Un tour du bot prend quelques millisecondes, très loin de la limite de 3 s
  d'ADR-020.
- L'API ne renvoie **jamais l'état complet**, seulement la vue du joueur (`vueDe`).
- Le joueur humain est toujours `j1`, le bot `j2`. Le tirage au sort désigne toujours qui commence.

## Alternatives envisagées

- **PostgreSQL** : les parties survivraient à un redémarrage et pourraient être servies par plusieurs instances,
  mais il faudrait une migration et Docker dès le premier jalon. Ce sera reconsidéré avec les comptes joueurs.
- **Redis** : un très bon stockage d'état éphémère partagé, mais un service de plus à exploiter pour un besoin
  qu'une `Map` couvre aujourd'hui.
- **État chez le client (jeton signé)** : sans stockage serveur, mais la vue cachée (main et pioche adverses) devrait
  quand même transiter, chiffrée, et l'état grossit à chaque action.

## Conséquences

- Un **redémarrage de l'API perd les parties en cours** : c'est acceptable pour des parties de 5 minutes sans enjeu.
- L'API doit rester **à une seule instance** tant que ce choix tient : à reconsidérer (nouvel ADR) avant toute mise
  à l'échelle horizontale sur Azure (ADR 0008), ou à l'arrivée des comptes joueurs.
- Sans comptes, **une partie appartient à qui connaît son identifiant**. Le risque est limité : l'identifiant n'est
  pas devinable et la partie n'a pas d'enjeu.
