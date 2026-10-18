# US-030 — Intégrer une carte acceptée au catalogue

- **Epic** : EPIC-08
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-030-integrer-carte-acceptee`

## Récit

En tant que **mainteneur du jeu**, je veux **transformer une proposition acceptée en carte du catalogue en une
commande** afin de **publier les cartes de la communauté sans ressaisie ni erreur**.

## Critères d'acceptation

- [ ] Un ADR précise le chemin d'une proposition vers le catalogue (ADR 0011 : le catalogue est du code) et le set
      d'accueil (set 1 complété ou set 2 « communautaire »).
- [ ] Une commande (ex. `npm run carte:integrer -- <id>`) écrit la carte en TypeScript dans `packages/domain` avec
      un numéro jamais utilisé, son auteur et sa date ; les tests d'invariants du catalogue passent.
- [ ] Une **simulation d'équilibrage** (decks prêtés et niveaux du bot) est lancée sur le catalogue enrichi ; le
      résultat est joint à la PR, qui reste relue par un humain.
- [ ] Une capacité nouvelle n'est jamais créée par la commande : elle fait l'objet de sa propre story.
- [ ] La proposition passe au statut « publiée » une fois la PR fusionnée et déployée.

## Notes

- Les cartes publiées utilisent l'illustration provisoire (US-018) en attendant EPIC-05.

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard).
