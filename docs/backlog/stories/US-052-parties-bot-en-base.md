# US-052 — Parties contre le bot gardées en base

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-052-parties-bot-en-base`

## Récit

En tant que **joueur**, je veux **que ma partie contre le bot survive à une mise à jour du jeu ou à une pause** afin
de **ne pas perdre une partie en cours sans raison**.

## Contexte

L'ADR 0014 garde les parties contre le bot dans la mémoire de l'API (une `Map` par processus) et impose une seule
instance. Sur Cloud Run (ADR 0021) :

- chaque déploiement remplace l'instance : avec le déploiement continu (US-050) et le rythme actuel de plusieurs
  merges par jour, les parties en cours seraient perdues plusieurs fois par jour ;
- l'arrêt à zéro (après une quinzaine de minutes sans requête) et les recyclages d'instance effacent aussi tout ;
- garder une instance allumée en permanence (`min-instances=1`) limiterait les pertes, mais ferait payer une instance
  à toute heure, sans régler les déploiements ;
- l'écran de partie annonce qu'une partie « expire après 30 minutes sans activité » : ce serait faux.

Les duels sont déjà en base (ADR 0020), avec le même moteur et un état sérialisable (ADR 0013) : 11 à 18 Ko par
partie, 1,5 ms de calcul par action du bot en moyenne.

Décision : ADR [0030](../../decisions/0030-parties-bot-en-base.md), qui remplace l'ADR 0014.

## Critères d'acceptation

- [x] **Étant donné** une partie contre le bot en cours, **quand** l'API redémarre (nouvelle instance sur la même
      base), **alors** la partie reprend là où elle en était (test d'API).
- [x] **Étant donné** deux actions envoyées en même temps sur une même partie, **alors** une seule est appliquée,
      l'autre reçoit 409 (version, comme les duels).
- [x] **Étant donné** une partie sans activité depuis une durée réglable, **alors** elle est considérée comme
      expirée à la lecture et purgée ensuite ; le texte de l'écran de partie dit la vraie règle.
- [x] **Étant donné** des parties anonymes (sans compte), **alors** elles restent possibles (ADR 0017) et leur nombre
      est borné par la limitation de débit (US-047) et la purge.
- [x] Le service Cloud Run peut passer à plusieurs instances (ADR 0021) ; l'ADR 0014 est remplacé par un nouvel ADR.

## Conception

- Table `parties` : identifiant, propriétaire facultatif (joueur et empreinte de la session, tous deux absents pour
  une partie anonyme), decks, niveau, état complet du moteur (JSON), `version`, dates de création et de dernier coup.
  Supprimer le compte ou fermer la session supprime ses parties (clés étrangères en cascade).
- **Une action = une seule écriture**, conditionnée à la version lue : l'action du joueur, puis tout le tour du bot,
  sont calculés en mémoire et écrits ensemble (`UPDATE … WHERE version = $lue`). Deux actions simultanées : la
  première écrit, l'autre ne trouve plus sa version et reçoit **409**. `If-Match` (facultatif, comme les duels) refuse
  d'emblée une action fondée sur une version dépassée ; la réponse porte `version` et l'en-tête `ETag`.
- **Expiration : 24 heures sans coup joué** (création ou action ; une simple lecture ne compte pas), réglable. Une
  partie expirée répond 404 dès la lecture ; elle est supprimée à la création de partie suivante, avec toutes les
  autres parties expirées. Aucune tâche de fond.
- **Plafond : 1 000 parties**, réglable : à la création, au-delà, la partie anonyme la moins récemment jouée est
  supprimée, et seulement à défaut celle d'un joueur connecté (règle d'ADR 0025, inchangée).
- La migration ne fait qu'ajouter une table : la version en ligne n'en dépend pas (règle des migrations compatibles
  de `docs/exploitation/README.md`). Les parties en mémoire de l'ancienne révision sont perdues une dernière fois au
  déploiement.

## Notes

- La récompense de victoire reste garantie une seule fois par partie (`recompenses.partie_id`).
- Passer Cloud Run à plusieurs instances reste une décision d'exploitation : les compteurs de la limitation de débit
  sont propres à chaque instance (ADR 0025), et chaque instance ouvre son propre pool de connexions (ADR 0023).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0014 et 0021).
- 2026-10-23 — affinée : conception, ADR [0030](../../decisions/0030-parties-bot-en-base.md), contrat OpenAPI d'abord.
- 2026-10-23 — livrée : parties contre le bot en base (table parties, migration 0010 en ajout seul) : une action et le tour du bot écrits en une seule fois sous condition de version (409 au perdant, If-Match facultatif, ETag) ; expiration 24 h sans coup joué évaluée à la lecture, purge et plafond de 1 000 parties (anonymes d'abord) à la création ; reprise après redémarrage testée ; concurrence éprouvée sur PostgreSQL 18 ; ADR 0030 remplace 0014
- 2026-10-23 — décision du porteur du projet : les parties contre le bot sont des données de partie en cours, pas des
  scores ; leur expiration reste possible, mais une récompense gagnée reste acquise (test ajouté, ADR 0030).
