# US-023 — Recevoir et ouvrir des boosters

- **Epic** : EPIC-03
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-023-ouvrir-boosters`

## Récit

En tant que **joueur connecté**, je veux **ouvrir des boosters de cartes** afin de **faire grandir ma collection**.

## Critères d'acceptation

- [x] Un booster contient **5 cartes** tirées **par le serveur** (rareté selon `CHANCES_BOOSTER`, puis carte au
      hasard dans la rareté) ; le tirage est une fonction pure du domaine, au hasard injecté (ADR 0004).
- [x] **Cadeau de bienvenue** : 5 boosters à la création du compte.
- [x] **Recharge** : un booster gratuit toutes les 10 minutes, stock plafonné à 10 (valeurs réglables, à confirmer
      avec le porteur du projet).
- [x] La collection est **stockée en base** (joueur, numéro de carte, nombre d'exemplaires) ; la table provisoire
      `cartes` d'US-004 est retirée par une migration (ADR 0011).
- [x] À l'écran, l'ouverture révèle les 5 cartes en moins d'une seconde, avec une animation qui respecte
      `prefers-reduced-motion` ; les nouvelles cartes sont signalées.
- [x] Contrat OpenAPI avant le code ; tests du tirage (répartition des raretés sur un grand nombre de boosters), de
      l'API et de l'écran ; parcours e2e et audit axe-core au vert.

## Journal

- 2026-10-18 — création.
- 2026-10-18 — valeurs de recharge retenues telles quelles (5 offerts, 1 toutes les 10 minutes, plafond 10), réglables
  dans `REGLES_BOOSTERS`. ADR 0019 : tirage pur dans le domaine (hasard cryptographique côté API), recharge calculée
  à la lecture, ouverture en transaction avec verrou du joueur. Migrations `0002_retrait_cartes` et
  `0003_boosters_collection`. Contrat `openapi/boosters.yaml`, routes `GET /moi/boosters` et
  `POST /moi/boosters/ouvertures` (409 sans stock). Écran « Mes boosters » (décompte de la recharge, révélation en
  0,8 s désactivée si `prefers-reduced-motion`, badge « Nouvelle ! »), lien « Boosters » dans le bandeau. Tests :
  domaine (répartition des raretés sur 20 000 boosters, recharge), API (6), écran (3), e2e (4, axe compris).
- 2026-10-18 — livrée : Boosters : 5 offerts, recharge toutes les 10 minutes, tirage serveur et collection en base
