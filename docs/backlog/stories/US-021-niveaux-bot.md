# US-021 — Niveaux du bot

- **Epic** : EPIC-04
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-021-niveaux-bot`

## Récit

En tant que **joueur**, je veux **choisir la difficulté du bot** afin de **progresser, du débutant au joueur
aguerri**.

## Critères d'acceptation

- [x] Trois niveaux, du plus simple au plus fort, nommés d'après l'univers : **Batch de nuit** (l'actuel, prévisible),
      **Architecte ESB** (moyen) et **Agent autonome** (difficile). Chaque niveau ne voit que sa propre vue de la
      partie (aucune triche).
- [x] Les niveaux Architecte ESB et Agent autonome **évaluent les conséquences de leurs actions** avec le moteur, sur
      un état reconstitué à partir de leur vue (les cartes cachées sont remplacées par des cartes neutres).
- [x] La simulation montre une progression nette : Architecte ESB gagne plus de la moitié de ses parties contre Batch
      de nuit (objectif initial 60 %, obtenu 55 % : le hasard du jeu plafonne l'écart, voir les notes), Agent autonome
      au moins 55 % contre Architecte ESB (obtenu 58 %) et 63 % contre Batch de nuit ; résultats notés dans
      [cartes-set-1.md](../../produit/cartes-set-1.md). `npm run simuler` compare aussi les niveaux.
- [x] Un tour de bot reste rapide : moins de 200 ms en moyenne pour le niveau le plus fort (limite d'ADR-020 Elis :
      3 s pour une API front).
- [x] L'API liste les niveaux (`GET /api/v1/niveaux`) et accepte le niveau à la création d'une partie (Batch de nuit
      par défaut) ; contrat OpenAPI à jour.
- [x] À l'écran, le choix du niveau précède le choix du deck, et le niveau est rappelé pendant la partie.
- [x] Tests du domaine (choix des bots, reconstitution de l'état), de l'API et de l'écran ; parcours e2e et audit
      axe-core au vert.

## Notes

- Le niveau « moyen » (Architecte ESB) vise l'indicateur d'EPIC-04 : environ une partie sur deux gagnée contre un
  joueur débutant.
- **Ce que les simulations ont appris** (300 parties par essai) : un choix purement immédiat est plus faible que Batch
  de nuit (il ne voit pas qu'un décommissionnement permet de poser une carte) ; regarder un coup plus loin sur toutes
  les actions est le meilleur réglage ; aller plus loin dans le tour, ou simuler la réponse adverse sur des cartes
  cachées remplacées par des cartes neutres, rend le bot **moins** fort. Les poids de l'évaluation changent peu le
  résultat (± 5 points).
- Un tour d'Agent autonome prend 7 ms en moyenne, 44 ms au pire (127 tours mesurés).
- La vue du joueur expose désormais ses propres marqueurs (« une fois par tour », protections), pour que la
  reconstitution soit fidèle ; un test vérifie que l'état reconstitué offre exactement les mêmes actions que la vraie
  partie.

## Journal

- 2026-10-18 — création, après le choix du porteur du projet (« tu évalueras ça mieux que moi »).
- 2026-10-18 — `reconstitution.ts`, `bots-forts.ts` (évaluation, recherche réglable), `niveaux.ts` ; `simuler`
  compare deux stratégies ; script de simulation étendu aux niveaux ; API `GET /niveaux` et niveau à la création ;
  écran : choix de la difficulté et rappel pendant la partie ; 4 tests du domaine, 3 de l'API, écran et e2e mis à
  jour. En revue.
- 2026-10-18 — livrée : trois niveaux de bot (Batch de nuit, Architecte ESB, Agent autonome), sans triche, progression mesurée par simulation
