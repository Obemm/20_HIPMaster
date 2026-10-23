# US-058 — Des duels équitables : hasard imprévisible et appariement sûr

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-058-duels-equitables`

## Récit

En tant que **joueur de duel**, je veux **être sûr que mon adversaire ne peut ni prévoir mes cartes ni contourner les
règles** afin que **le jeu reste juste, comme le promet la vision produit**.

## Contexte

Revue de l'API du 2026-10-22 :

- **hasard prévisible** : le moteur utilise mulberry32, un générateur dont l'état tient sur 32 bits, et la graine
  d'un duel est tirée sur 31 bits (`apps/api/src/duels/duels.ts`). Les decks prêtés sont publics. Un joueur qui
  connaît l'algorithme (le dépôt est public) peut retrouver la graine à partir de sa main et de ses premières
  pioches, en essayant les 2³¹ graines, puis voir la main adverse et toutes les pioches à venir. Un duel asynchrone
  lui laisse des jours pour le faire ;
- **appariement** : quand la file « adversaire au hasard » est vide, deux joueurs qui cherchent à quelques
  millisecondes d'écart créent chacun un duel ouvert et s'attendent mutuellement ; un double clic peut placer un
  joueur dans deux duels ;
- la règle « pas de booster contre un adversaire déjà affronté le jour même » n'est évaluée qu'à la première lecture
  par le vainqueur : lire le résultat le lendemain la contourne (le plafond quotidien de 3 boosters tient).

## Critères d'acceptation

- [x] **Étant donné** un nouveau duel, **alors** son hasard vient d'un générateur dont l'état ne peut pas être
      retrouvé à partir de ce qu'un joueur voit (état d'au moins 128 bits, graine tirée par `node:crypto`) ; les
      parties restent rejouables à partir de leur état (ADR 0013, révisé par un nouvel ADR).
- [x] **Étant donné** deux recherches simultanées d'adversaire, **alors** elles aboutissent à un seul duel entre
      les deux joueurs ; un joueur ne peut pas avoir deux duels ouverts en attente.
- [x] **Étant donné** un duel terminé, **alors** la règle de l'adversaire déjà affronté est évaluée à la date de fin
      du duel, quelle que soit la date de lecture.
- [x] Les duels en cours créés avec l'ancien générateur se terminent normalement. Tests sur PostgreSQL (US-056).

## Conception

- **Hasard** (ADR [0034](../../decisions/0034-hasard-et-appariement.md), qui révise l'ADR 0013) : le moteur gagne un
  générateur **ChaCha20** (RFC 8439) écrit en TypeScript pur dans `packages/domain/src/combat/alea.ts`. Son état
  (clé de 256 bits et compteur de blocs) vit dans `EtatPartie.alea` : la partie reste rejouable. L'API tire la clé
  avec `randomBytes(32)` (`apps/api/src/hasard.ts`) au lancement d'un duel **et** d'une partie contre le bot (qui
  rapporte aussi des boosters). La vue d'un joueur ne contient jamais le générateur.
- **Compatibilité** : `creerPartie` accepte toujours une graine entière (mulberry32) : simulations, tests, et duels ou
  parties créés avant ce changement, qui se terminent avec leur générateur. Aucune migration de données.
- **Appariement** : `chercherAdversaire` prend d'abord un verrou consultatif de transaction
  (`pg_advisory_xact_lock(hashtext('hipmaster:appariement'))`) : les recherches passent une à une, la suivante voit le
  duel ouvert par la précédente. `SKIP LOCKED` reste pour un défi ouvert rejoint au même instant par son lien.
- **Adversaire déjà affronté** : `recompenseDuel` compte les autres duels entre les deux joueurs créés le jour (UTC) de
  la fin du duel (`majLe`), avant cette fin ; l'horloge de lecture n'intervient plus.
- **Contrat** : aucune route ni aucun schéma ne change ; `duels.yaml` décrit l'appariement sérialisé et le jour retenu
  pour la récompense.

## Journal

- 2026-10-22 — création, issue de la revue de l'API avant mise en ligne.
- 2026-10-24 — affinée et commencée : ChaCha20 à clé tirée par `node:crypto`, verrou consultatif pour l'appariement,
  règle de l'adversaire déjà affronté au jour de la fin (ADR 0034). Sans le verrou, les deux nouveaux tests
  d'appariement simultané échouent sur PostgreSQL 18 (plusieurs joueurs en attente, plusieurs duels ouverts pour un
  même joueur) ; avec lui, ils passent.
- 2026-10-24 — livrée : hasard des duels et des parties contre le bot par ChaCha20 (RFC 8439, domaine pur), clé de 256 bits tirée par node:crypto, jamais envoyée ; duels et parties créés avant gardent mulberry32 et se terminent normalement ; recherches d'adversaire sérialisées par un verrou consultatif de transaction (file vide et double clic éprouvés sur PostgreSQL 18) ; règle de l'adversaire déjà affronté évaluée au jour de la fin du duel ; ADR 0034
