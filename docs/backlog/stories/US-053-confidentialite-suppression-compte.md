# US-053 — Page de confidentialité et suppression de son compte

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-053-confidentialite-suppression-compte`

## Récit

En tant que **joueur invité**, je veux **savoir quelles données le jeu garde sur moi et pouvoir supprimer mon
compte** afin de **jouer en confiance**.

## Critères d'acceptation

- [ ] **Étant donné** n'importe quelle page, **alors** un lien de pied de page mène à une page « À propos et
      confidentialité » qui dit : qui édite le jeu et comment le joindre, qui l'héberge (Firebase pour le
      site, Google Cloud à Francfort pour l'API, Neon à Francfort pour la base), quelles données sont gardées (pseudo,
      collection, duels, sessions ; adresses IP dans les journaux techniques), pourquoi, combien de temps, et comment
      exercer ses droits.
- [ ] **Étant donné** le stockage du jeton dans le navigateur, **alors** la page précise qu'il est strictement
      nécessaire au service : aucun bandeau de consentement n'est requis, et le jeu n'utilise aucun traceur ni
      outil de mesure d'audience.
- [ ] **Étant donné** un joueur connecté, **quand** il demande la suppression de son compte depuis « Mon compte » et
      la confirme, **alors** son compte, ses sessions, sa collection et ses récompenses sont supprimés, et il est
      déconnecté.
- [ ] **Étant donné** un duel en cours avec un joueur qui supprime son compte, **alors** l'adversaire voit le duel
      terminé (forfait) au lieu d'une erreur.
- [ ] Contrat OpenAPI mis à jour, tests d'API et parcours e2e.

## Notes

- Aujourd'hui, la suppression d'un joueur supprime en cascade les duels où il figure, y compris pour son adversaire
  (`onDelete: 'cascade'` dans `apps/api/src/db/schema.ts`) : à revoir dans cette story.
- ADR-015 Elis (AT Internet) reste écarté : aucune mesure d'audience (ADR 0005).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne.
