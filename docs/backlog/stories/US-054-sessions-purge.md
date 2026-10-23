# US-054 — Des sessions qui expirent et des données qui ne s'accumulent pas

- **Epic** : EPIC-09
- **Statut** : À affiner
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

- [ ] **Étant donné** une session inutilisée depuis une durée réglable (90 jours par défaut), **alors** elle est
      refusée (401) ; chaque usage prolonge la session (au plus une écriture par jour et par session).
- [ ] **Étant donné** la politique de conservation écrite (durées par type de donnée, reprises dans la page de
      confidentialité, US-053, ADR 0031), **quand** la purge s'exécute, **alors** elle supprime les sessions
      expirées, les défis jamais acceptés (7 jours), les parties contre le bot expirées, et peut alléger l'état complet
      des duels terminés depuis longtemps.
- [ ] **Étant donné** un compte, même inactif depuis des années, **alors** la purge ne supprime **jamais** ni le
      compte, ni sa collection, ni ses récompenses, ni l'historique utile aux scores (US-069) : d'un duel terminé, au
      moins le gagnant, les deux joueurs, la raison de la fin et la date restent, même quand l'état complet est
      allégé. Seul le joueur supprime son compte (US-053).
- [ ] **Étant donné** la production, **alors** la purge tourne chaque nuit (Cloud Scheduler et Cloud Run Job, sans
      tâche de fond dans l'API) et journalise ce qu'elle a supprimé.
- [ ] Tests de la purge sur une base de test, horloge injectée.

## Notes

- Décision du porteur du projet (2026-10-23) : « il faut aussi que les comptes joueurs, leurs collections et les scores
  soient conservés ». Plus de suppression des comptes inactifs. Seules des données techniques expirent : sessions
  inutilisées 90 jours (le joueur se reconnecte avec son code), journaux techniques et sauvegardes 30 jours (rétention
  par défaut de Cloud Logging, US-051), parties contre le bot abandonnées (24 heures, ADR 0030 : une récompense gagnée
  reste acquise), défis jamais acceptés.
- Alléger un duel terminé : garder dans des colonnes (ou un résumé) ce que lisent « Mes duels » et les futurs scores
  avant de vider `etat`, puis adapter les lectures qui l'extraient aujourd'hui du JSON (`lireMesDuels`).
- Les index nécessaires à la purge sont posés dans US-057.

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne.
- 2026-10-23 — décision du porteur du projet : comptes, collections et scores conservés sans limite ; la purge ne
  touche que des données techniques (mise à jour depuis US-053).
