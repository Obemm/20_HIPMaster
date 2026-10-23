# EPIC-09 — Mise en ligne sur Google Cloud

- **Statut** : En cours
- **Priorité** : Must

## Objectif

Mettre HIPMaster en ligne dans l'espace Google Cloud du porteur du projet, pour l'équipe d'intégration et des
collègues **sur invitation** (choix du 2026-10-22), **sans frais** : Firebase Hosting, Cloud Run et une base Neon
gratuite, que Claude installe, déploie et maintient en ligne de commande
(ADR [0021](../../decisions/0021-hebergement-gcp.md), accepté le 2026-10-22). Le détail des constats est dans la
[revue avant mise en ligne](../../revues/2026-10-22-revue-mise-en-ligne.md).

## Indicateur de réussite

- Un collègue invité crée son compte, ouvre un booster et gagne une partie depuis son téléphone, sur l'adresse
  publique du jeu.
- Un merge sur `main` est en ligne en moins de 15 minutes, sans geste manuel ; un retour arrière prend moins de
  5 minutes.
- La facture mensuelle reste sous 1 € et la consommation de la base sous son quota gratuit ; une panne déclenche une
  alerte.

## Stories

- [x] US-046 — Une API prête pour Cloud Run
- [x] US-047 — Les protections indispensables avant l'ouverture
- [x] US-048 — Inscription sur invitation
- [x] US-049 — Infrastructure gratuite et reproductible
- [x] US-050 — Déploiement continu vers Cloud Run et Firebase Hosting
- [x] US-051 — Supervision, sauvegardes vérifiées et scan de sécurité
- [x] US-052 — Parties contre le bot gardées en base
- [x] US-053 — Page de confidentialité et suppression de son compte
- [ ] US-054 — Des sessions qui expirent et des données qui ne s'accumulent pas
- [x] US-055 — Un front robuste au démarrage à froid et aux sessions expirées
- [x] US-056 — La CI teste l'API sur un vrai PostgreSQL
- [ ] US-057 — Des requêtes légères : index, lectures bornées, cache et chargement à la demande
- [ ] US-058 — Des duels équitables : hasard imprévisible et appariement sûr
- [x] US-072 — Une page « Inviter » réservée au porteur du projet

Ordre suggéré, en trois lots :

1. **Avant la première mise en ligne** (le site existe, seul le porteur du projet y joue) : US-046, US-056, US-047,
   US-048, US-055, US-049 et US-050.
2. **Avant d'envoyer les invitations** : US-052 (sans elle, chaque déploiement efface les parties en cours), US-051,
   US-053, puis l'ergonomie mobile d'EPIC-10 (US-059, US-060).
3. **Ensuite** : US-054, US-057, US-058.

US-072 (décidée le 2026-10-23) s'ajoute au lot 2 : inviter depuis le site, avec le seul compte du porteur du
projet, avant d'envoyer les invitations.

## Hors périmètre

- Ouverture publique à tous (sans invitation) : demanderait de revoir l'usage des marques et l'exposition aux abus.
- Environnement de préproduction `stg` : prévu par l'ADR 0021, à créer quand le rythme de livraison le justifiera.
- Domaine personnel : l'adresse `hipmaster.web.app` suffit pour commencer.
- Pare-feu applicatif (Cloud Armor) : demande un équilibreur de charge, hors budget à cette échelle.
