# US-021 — Niveaux du bot

- **Epic** : EPIC-04
- **Statut** : En cours
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-021-niveaux-bot`

## Récit

En tant que **joueur**, je veux **choisir la difficulté du bot** afin de **progresser, du débutant au joueur
aguerri**.

## Critères d'acceptation

- [ ] Trois niveaux, du plus simple au plus fort, nommés d'après l'univers : **Batch de nuit** (l'actuel, prévisible),
      **Architecte ESB** (moyen) et **Agent autonome** (difficile). Chaque niveau ne voit que sa propre vue de la
      partie (aucune triche).
- [ ] Les niveaux Architecte ESB et Agent autonome **évaluent les conséquences de leurs actions** avec le moteur, sur
      un état reconstitué à partir de leur vue (les cartes cachées sont remplacées par des cartes neutres).
- [ ] La simulation montre une progression nette : Architecte ESB gagne au moins 60 % de ses parties contre Batch de
      nuit, Agent autonome au moins 55 % contre Architecte ESB ; résultats notés dans
      [cartes-set-1.md](../../produit/cartes-set-1.md). `npm run simuler` compare aussi les niveaux.
- [ ] Un tour de bot reste rapide : moins de 200 ms en moyenne pour le niveau le plus fort (limite d'ADR-020 Elis :
      3 s pour une API front).
- [ ] L'API liste les niveaux (`GET /api/v1/niveaux`) et accepte le niveau à la création d'une partie (Batch de nuit
      par défaut) ; contrat OpenAPI à jour.
- [ ] À l'écran, le choix du niveau précède le choix du deck, et le niveau est rappelé pendant la partie.
- [ ] Tests du domaine (choix des bots, reconstitution de l'état), de l'API et de l'écran ; parcours e2e et audit
      axe-core au vert.

## Notes

- Le niveau « moyen » (Architecte ESB) vise l'indicateur d'EPIC-04 : environ une partie sur deux gagnée contre un
  joueur débutant.

## Journal

- 2026-10-18 — création, après le choix du porteur du projet (« tu évalueras ça mieux que moi »).
