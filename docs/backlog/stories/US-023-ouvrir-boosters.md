# US-023 — Recevoir et ouvrir des boosters

- **Epic** : EPIC-03
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-023-ouvrir-boosters`

## Récit

En tant que **joueur connecté**, je veux **ouvrir des boosters de cartes** afin de **faire grandir ma collection**.

## Critères d'acceptation

- [ ] Un booster contient **5 cartes** tirées **par le serveur** (rareté selon `CHANCES_BOOSTER`, puis carte au
      hasard dans la rareté) ; le tirage est une fonction pure du domaine, au hasard injecté (ADR 0004).
- [ ] **Cadeau de bienvenue** : 5 boosters à la création du compte.
- [ ] **Recharge** : un booster gratuit toutes les 10 minutes, stock plafonné à 10 (valeurs réglables, à confirmer
      avec le porteur du projet).
- [ ] La collection est **stockée en base** (joueur, numéro de carte, nombre d'exemplaires) ; la table provisoire
      `cartes` d'US-004 est retirée par une migration (ADR 0011).
- [ ] À l'écran, l'ouverture révèle les 5 cartes en moins d'une seconde, avec une animation qui respecte
      `prefers-reduced-motion` ; les nouvelles cartes sont signalées.
- [ ] Contrat OpenAPI avant le code ; tests du tirage (répartition des raretés sur un grand nombre de boosters), de
      l'API et de l'écran ; parcours e2e et audit axe-core au vert.

## Journal

- 2026-10-18 — création.
