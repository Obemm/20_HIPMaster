# EPIC-13 — Un set 2 : architecture et pratiques

- **Statut** : À affiner
- **Priorité** : Could

## Objectif

Le set 1 parle des briques de l'intégration (fichiers, API, ESB, événements, iPaaS, IA agentique). Le porteur du
projet voudrait, un jour, étendre l'acculturation aux **façons de concevoir et de livrer** ces systèmes : le
_Domain-Driven Design_, les architectures en microservices, le DevOps… Sujets notés le 2026-10-24, sans engagement
de date.

## Indicateur de réussite

- Un set 2 jouable dont chaque carte enseigne un concept, avec sa fiche « En savoir plus » (EPIC-12).
- Les mécaniques de combat restent celles du set 1 (ADR 0010) ; de nouvelles capacités seulement si un concept
  l'exige.

## Stories

- [ ] US-076 — Concevoir le set 2 : DDD, microservices, DevOps

## Pistes de contenu (à trier)

- **DDD** : contexte délimité, langage omniprésent, agrégat, carte de contextes, couche anticorruption.
- **Microservices** : découpage par domaine, passerelle d'API, service mesh, saga, disjoncteur, base par service,
  ou au contraire le monolithe modulaire.
- **DevOps** : intégration et déploiement continus, infrastructure en code, observabilité, déploiement progressif,
  retour arrière, culture du post-mortem sans blâme.
- Les incidents de ces mondes (couplage distribué, « microservices en cascade », dérive de configuration) pour les
  sorts et incidents.

## Hors périmètre

- Changer l'architecture de HIPMaster lui-même : ces sujets sont ici des thèmes de cartes, pas une refonte de l'app.
