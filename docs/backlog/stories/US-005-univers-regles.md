# US-005 — Univers et règles du jeu

- **Epic** : EPIC-01
- **Statut** : En revue
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-005-univers-regles`

## Récit

En tant que **porteur du projet**, je veux **choisir l'univers des cartes et les règles de combat**
afin de **pouvoir créer le premier set et le moteur de jeu**.

## Critères d'acceptation

- [x] Les questions ouvertes de la [vision](../../produit/vision.md) sont tranchées (univers, origine des cartes, combat, monétisation).
- [x] Les règles tiennent sur une page dans `docs/produit/regles.md`.
- [x] Les caractéristiques d'une carte (familles, statistiques, raretés, capacités) sont listées.
- [x] Un ADR consigne le choix de mécanique de combat.

## Notes

Références : [inspirations](../../produit/inspirations.md) (WikiMasters : QCM ; Async TCG : plateau RAM / attaque / PV).

Livrables : [univers.md](../../produit/univers.md), [regles.md](../../produit/regles.md),
[cartes-set-1.md](../../produit/cartes-set-1.md) (brouillon de 64 cartes), [ADR 0010](../../decisions/0010-combat-plateau.md).

Choix du porteur du projet (échange du 2026-10-16) : univers de la plateforme d'intégration, du FTP à l'IA agentique
(MCP, A2A, LLM, prompting) ; vraies briques Elis en cartes signatures — webMethods Integration Server 10.15 sur site
(avec Universal Messaging et MWS) vers webMethods.io, Apigee API Gateway vers AI Gateway, Solace Event Mesh vers
Solace Agent Mesh (aucun outil d'IA agentique en place : Agent Mesh retenu pour le jeu) ; FTP est officiellement
interdit chez Elis et SFTP progressivement remplacé ; vrais noms de produits, sans logos, jeu interne.

## Journal

- 2026-10-16 — création.
- 2026-10-16 — univers, règles, brouillon du set 1 et ADR 0010 rédigés ; en revue par le porteur du projet.
