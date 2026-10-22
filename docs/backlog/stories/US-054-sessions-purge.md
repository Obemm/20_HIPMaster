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
      confidentialité, US-053), **quand** la purge s'exécute, **alors** elle supprime les sessions expirées, les
      défis jamais acceptés, l'état complet des duels terminés depuis longtemps (le résultat reste) et les données
      des comptes inactifs au-delà de la durée annoncée.
- [ ] **Étant donné** la production, **alors** la purge tourne chaque nuit (Cloud Scheduler et Cloud Run Job, sans
      tâche de fond dans l'API) et journalise ce qu'elle a supprimé.
- [ ] Tests de la purge sur une base de test, horloge injectée.

## Notes

- Durées à fixer avec le porteur du projet : sessions 90 jours, comptes inactifs 12 mois, journaux techniques 30 jours
  (rétention par défaut de Cloud Logging).
- Les index nécessaires à la purge sont posés dans US-057.

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne.
