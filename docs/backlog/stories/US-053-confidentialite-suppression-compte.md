# US-053 — Page de confidentialité et suppression de son compte

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-053-confidentialite-suppression-compte`

## Récit

En tant que **joueur invité**, je veux **savoir quelles données le jeu garde sur moi et pouvoir supprimer mon
compte** afin de **jouer en confiance**.

## Critères d'acceptation

- [x] **Étant donné** n'importe quelle page, **alors** un lien de pied de page mène à une page « À propos et
      confidentialité » qui dit : qui édite le jeu et comment le joindre, qui l'héberge (Firebase pour le
      site, Google Cloud à Francfort pour l'API, Neon à Francfort pour la base), quelles données sont gardées (pseudo,
      collection, duels, sessions ; adresses IP dans les journaux techniques), pourquoi, combien de temps, et comment
      exercer ses droits.
- [x] **Étant donné** le stockage du jeton dans le navigateur, **alors** la page précise qu'il est strictement
      nécessaire au service : aucun bandeau de consentement n'est requis, et le jeu n'utilise aucun traceur ni
      outil de mesure d'audience.
- [x] **Étant donné** un joueur connecté, **quand** il demande la suppression de son compte depuis « Mon compte » et
      la confirme, **alors** son compte, ses sessions, sa collection et ses récompenses sont supprimés, et il est
      déconnecté.
- [x] **Étant donné** un duel en cours avec un joueur qui supprime son compte, **alors** l'adversaire voit le duel
      terminé (forfait) au lieu d'une erreur.
- [x] Contrat OpenAPI mis à jour, tests d'API et parcours e2e.

## Conception

- **`DELETE /api/v1/moi`** (contrat `comptes.yaml`) : 204, puis le jeton ne vaut plus rien ; 401 sans session. Une
  seule transaction (ADR [0031](../../decisions/0031-suppression-compte.md)) : les duels en cours du joueur se
  terminent par forfait (il perd), ses défis en attente sont supprimés, puis le compte, et avec lui ses sessions, sa
  collection, ses récompenses et ses parties contre le bot. Ses duels terminés restent à son adversaire, sans lui
  (« Compte supprimé » à la place du pseudo) ; un duel dont les deux joueurs sont partis est supprimé.
- Migration compatible : les clés étrangères des duels passent de `CASCADE` à `SET NULL`, `createur_id` accepte
  `NULL`.
- Front : un lien « À propos et confidentialité » en pied de toutes les pages (coquille `app.ts`, le strict
  nécessaire), une page `/confidentialite`, et dans « Mon compte » un bouton « Supprimer mon compte » qui demande
  confirmation, puis déconnecte et le dit.
- Conservation (décision du porteur du projet, 2026-10-23) : comptes, collections, récompenses et résultats gardés sans
  limite, sauf suppression par le joueur ; seules des données techniques expirent (sessions inutilisées 90 jours,
  journaux et sauvegardes 30 jours, parties contre le bot abandonnées, défis jamais acceptés). Ce qu'appliquera la
  purge d'US-054 est marqué « bientôt » : la page dit honnêtement ce qui est déjà en place.

## Notes

- Aujourd'hui, la suppression d'un joueur supprime en cascade les duels où il figure, y compris pour son adversaire
  (`onDelete: 'cascade'` dans `apps/api/src/db/schema.ts`) : à revoir dans cette story.
- ADR-015 Elis (AT Internet) reste écarté : aucune mesure d'audience (ADR 0005).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne.
- 2026-10-23 — affinée : conception, ADR [0031](../../decisions/0031-suppression-compte.md), contrat OpenAPI d'abord ;
  durées de conservation proposées, à valider par le porteur du projet dans la PR.
- 2026-10-23 — livrée : page « À propos et confidentialité » en pied de chaque page (éditeur, hébergeurs, données gardées et pourquoi, durées proposées dont celles d'US-054 marquées « bientôt », droits, aucun traceur ni bandeau) ; suppression du compte depuis « Mon compte » après confirmation (DELETE /api/v1/moi, une transaction) ; duels en cours terminés par forfait, duels terminés gardés par l'adversaire face à « Compte supprimé » (migration 0011, clés étrangères en SET NULL) ; concurrence avec un coup simultané éprouvée sur PostgreSQL 18 ; e2e complets verts ; ADR 0031
- 2026-10-23 — décision du porteur du projet : comptes, collections et scores conservés ; la page ne prévoit plus de
  supprimer les comptes inactifs après 12 mois, seules des données techniques expirent. US-054 mise à jour.
