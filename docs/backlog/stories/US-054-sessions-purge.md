# US-054 — Des sessions qui expirent et des données qui ne s'accumulent pas

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-054-sessions-purge`

## Récit

En tant que **porteur du projet**, je veux **que les sessions inutilisées expirent et que les données périmées soient
supprimées** afin de **limiter l'effet d'un jeton volé, tenir la promesse de la page de confidentialité et garder
une base petite et rapide**.

## Contexte

Revue du 2026-10-22 : rien n'est jamais supprimé. Les sessions n'expirent pas (le message 401 parle pourtant de
session « expirée »), et les comptes abandonnés, les défis expirés, les duels terminés (avec leur état complet de 11 à
18 Ko) et les récompenses s'accumulent sans fin. Le jeton est gardé dans le navigateur (ADR 0017) : un jeton volé
donne un accès permanent.

## Critères d'acceptation

- [x] **Étant donné** une session inutilisée depuis une durée réglable (90 jours par défaut), **alors** elle est
      refusée (401) ; chaque usage prolonge la session (au plus une écriture par jour et par session).
- [x] **Étant donné** la politique de conservation écrite (durées par type de donnée, reprises dans la page de
      confidentialité, US-053, ADR 0031), **quand** la purge s'exécute, **alors** elle supprime les sessions
      expirées, les défis jamais acceptés (7 jours), les parties contre le bot expirées, et peut alléger l'état complet
      des duels terminés depuis longtemps.
- [x] **Étant donné** un compte, même inactif depuis des années, **alors** la purge ne supprime **jamais** ni le
      compte, ni sa collection, ni ses récompenses, ni l'historique utile aux scores (US-069) : d'un duel terminé, au
      moins le gagnant, les deux joueurs, la raison de la fin et la date restent, même quand l'état complet est
      allégé. Seul le joueur supprime son compte (US-053).
- [x] **Étant donné** la production, **alors** la purge tourne chaque nuit (Cloud Scheduler et Cloud Run Job, sans
      tâche de fond dans l'API) et journalise ce qu'elle a supprimé.
- [x] Tests de la purge sur une base de test, horloge injectée.

## Conception

ADR [0035](../../decisions/0035-purge-donnees-techniques.md).

- **Sessions** : colonne `sessions.utilisee_le` (migration `0012_sessions_utilisees`, ajout seul, valeur par défaut
  `now()`, index pour la purge). `joueurDuJeton` refuse une session inutilisée depuis `SESSIONS_DUREE_JOURS` (90 par
  défaut) et la prolonge au plus une fois par jour. Toutes les routes passent par lui (`exigerJoueur`, parties,
  administration) avec les réglages posés par `construireApp` (`sessions`). Contrat `comptes.yaml` 1.5.0.
- **Purge** (`apps/api/src/purge/purge.ts`, commande `apps/api/src/purger.ts`, `npm run purge -w apps/api`) :
  parties contre le bot sans coup depuis 24 heures, défis jamais acceptés depuis 7 jours, sessions expirées (et leurs
  parties) ; bilan journalisé par sorte. Jamais les tables `joueurs`, `collection`, `recompenses`, ni un duel
  commencé.
- **Alléger les duels terminés** : non retenu. L'état complet porte l'historique des scores (US-069) et le volume reste
  faible ; `lireMesDuels` n'a donc pas à changer.
- **Production** : job Cloud Run `hipmaster-purge` (image de l'API, compte `hipmaster-purge` qui ne lit que
  `database-url`), lancé à 5 h 25 (Paris) par Cloud Scheduler, cinq minutes avant la sauvegarde (un seul réveil de
  Neon). `infrastructure.sh` (étape 17) crée le compte, son droit et la tâche planifiée, et ajoute le job à l'alerte
  des jobs ; `deployer.sh purge` crée ou met à jour le job ; le workflow de déploiement ne fait que le mettre à jour
  s'il existe. Mise en service : accord du porteur du projet (guide d'exploitation, « Purge des données techniques »).
- **Page `/confidentialite`** : plus de « bientôt » ; elle dit que les données techniques sont effacées chaque nuit.

## Notes

- Décision du porteur du projet (2026-10-23) : « il faut aussi que les comptes joueurs, leurs collections et les scores
  soient conservés ». Plus de suppression des comptes inactifs. Seules des données techniques expirent : sessions
  inutilisées 90 jours (le joueur se reconnecte avec son code), journaux techniques et sauvegardes 30 jours (rétention
  par défaut de Cloud Logging, US-051), parties contre le bot abandonnées (24 heures, ADR 0030 : une récompense gagnée
  reste acquise), défis jamais acceptés.
- Alléger un duel terminé : garder dans des colonnes (ou un résumé) ce que lisent « Mes duels » et les futurs scores
  avant de vider `etat`, puis adapter les lectures qui l'extraient aujourd'hui du JSON (`lireMesDuels`).
- Les index nécessaires à la purge sont posés dans US-057 ; celui de `sessions.utilisee_le` arrive avec sa colonne.
- **Mise en service** : le code, les scripts et le guide sont livrés, mais la purge ne tournera chaque nuit qu'après
  les commandes du guide d'exploitation (« Mettre la purge en service »), lancées avec l'accord du porteur du projet.
  L'expiration des sessions, elle, s'applique dès le déploiement.

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne.
- 2026-10-23 — décision du porteur du projet : comptes, collections et scores conservés sans limite ; la purge ne
  touche que des données techniques (mise à jour depuis US-053).
- 2026-10-24 — affinée et commencée (branche partie d'US-058) : expiration des sessions à la lecture, purge par une
  commande dédiée et un job Cloud Run planifié, ADR 0035. Aucune commande GCP lancée : la mise en service attend
  l'accord du porteur du projet.
- 2026-10-24 — livrée : sessions refusées après 90 jours sans usage (SESSIONS_DUREE_JOURS), prolongées au plus une fois par jour ; purge des parties contre le bot abandonnées, des défis jamais acceptés et des sessions expirées par une commande dédiée, jamais un compte, une collection, une récompense ni un duel commencé (test sur un compte inactif depuis des années, dix ans plus tard) ; job Cloud Run hipmaster-purge et tâche Cloud Scheduler de 5 h 25 dans les scripts GCP, mise en service soumise au porteur du projet ; page de confidentialité sans « bientôt » ; ADR 0035
- 2026-10-24 — purge mise en service en production par le porteur du projet (`infrastructure.sh`, `deployer.sh purge`) :
  premier passage réussi (0 session, 0 défi, 0 partie supprimés), tâche planifiée « 25 5 * * * » (Europe/Paris) active.
