# US-029 — Relire et instruire les propositions

- **Epic** : EPIC-08
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-029-relire-propositions`

## Récit

En tant que **relecteur** (porteur du projet ou architecte désigné), je veux **examiner les propositions et y
répondre** afin de **ne publier que des cartes justes, équilibrées et sans contenu sensible**.

## Critères d'acceptation

- [ ] Un ADR fixe comment le **rôle de relecteur** est attribué et vérifié côté serveur.
- [ ] Une file liste les propositions par statut (proposée, à retravailler, acceptée, refusée), la plus ancienne en
      premier.
- [ ] **Quand** je relis une proposition, **alors** je peux commenter, demander des modifications, l'accepter ou la
      refuser avec un motif ; l'auteur voit la décision et le motif dans « Mes propositions ».
- [ ] La relecture suit une liste de contrôle visible : exactitude technique, texte « En vrai » compréhensible,
      confidentialité, pas de doublon avec une carte existante, équilibrage plausible.
- [ ] Les routes de relecture refusent tout joueur sans le rôle (403, Problem Details).
- [ ] Tests de l'API (droits, transitions de statut) et de l'écran ; audit axe-core au vert.

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard).
