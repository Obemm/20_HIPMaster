# US-004 — Base de données locale

- **Epic** : EPIC-00
- **Statut** : Prête
- **Priorité** : Must
- **Taille** : XS
- **Branche** : `us-004-base-de-donnees`

## Récit

En tant que **développeur**, je veux **une base PostgreSQL locale lancée en une commande, avec migrations**
afin de **stocker joueurs, cartes et collections**.

## Critères d'acceptation

- [ ] **Étant donné** Docker Desktop lancé, **quand** je tape `npm run db:up`, **alors** PostgreSQL démarre sur le port 5433.
- [ ] **Quand** je tape `npm run db:migrate`, **alors** la migration `drizzle/0000_init.sql` est appliquée.
- [ ] `npm run db:studio` permet de consulter la table `cartes`.

## Notes

ADR [0003](../../decisions/0003-postgresql-drizzle.md). Configuration, schéma et première migration déjà en place ;
reste à les vérifier avec Docker Desktop démarré (il ne l'était pas le 2026-10-16).

## Journal

- 2026-10-16 — création, configuration écrite.
