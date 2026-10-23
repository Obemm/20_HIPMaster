# 0031 — Suppression de son compte : forfait des duels en cours, historique sans le joueur

- **Date** : 2026-10-23
- **Statut** : Acceptée (durées de conservation proposées, à valider par le porteur du projet)
- **Référence Elis** : ADR-020 (API REST, design first) — retenu ; ADR-015 (AT Internet, mesure d'audience) — écarté,
  comme le dit déjà l'ADR 0005 : le jeu ne mesure pas son audience

## Contexte

US-053 permet à un joueur de supprimer son compte et publie une page « À propos et confidentialité ». Les comptes sont
des comptes invités, sans e-mail (ADR 0017). Les tables qui désignent un joueur suppriment leurs lignes en cascade
avec lui : sessions, collection, récompenses, parties contre le bot (ADR 0030), et **duels** — y compris ceux de son
adversaire. Un duel en cours disparaîtrait donc sous les yeux de l'autre joueur (404 au coup suivant), et un duel
terminé de son historique. Aucune purge automatique n'existe encore (US-054).

## Décision

- **`DELETE /api/v1/moi`**, réservé au joueur connecté, supprime son compte dans **une seule transaction** :
  1. chaque **duel en cours** où il joue se termine par **forfait** : il perd, l'adversaire gagne (même issue qu'une
     échéance dépassée, ADR 0020) ; la version du duel change, l'écran de l'adversaire le voit à sa prochaine lecture ;
  2. ses **défis en attente** sont supprimés : personne d'autre n'y est engagé ;
  3. le compte est supprimé, et avec lui ses sessions (il est déconnecté partout), sa collection, ses récompenses et
     ses parties contre le bot ;
  4. les duels terminés restent pour son adversaire, **sans lui** : la clé étrangère passe à `NULL`, l'API annonce
     « Compte supprimé » à la place de son pseudo. Un duel dont les deux joueurs ont supprimé leur compte est supprimé.
- Les duels se verrouillent comme pour une action (`FOR UPDATE`) : un coup de l'adversaire joué au même instant passe
  avant ou après le forfait, jamais au milieu.
- La victoire par suppression du compte adverse est une victoire par forfait comme une autre, récompensée selon les
  règles des duels (US-038).
- Migration compatible avec la version en ligne : les clés étrangères des duels passent de `CASCADE` à `SET NULL` et
  `createur_id` accepte `NULL` (un relâchement de contrainte) ; aucune donnée n'est modifiée.
- **Durées de conservation proposées** (page « À propos et confidentialité », à valider par le porteur du projet ;
  appliquées par la purge d'US-054, pas encore en place) : sessions inutilisées 90 jours, comptes inactifs 12 mois,
  journaux techniques et sauvegardes 30 jours au plus. Déjà en place : parties contre le bot 24 heures sans coup joué
  (ADR 0030), compteurs de limitation de débit en mémoire une minute à une heure (ADR 0025).
- **Aucun bandeau de consentement** : le seul stockage du navigateur est le jeton de session (`localStorage`), strictement
  nécessaire au service demandé ; aucun traceur ni outil de mesure d'audience.

## Alternatives envisagées

- **Garder la cascade** : le duel disparaît pour l'adversaire, qui reçoit une erreur au lieu d'un résultat. Écartée.
- **Désactiver le compte au lieu de le supprimer** (pseudo effacé, ligne gardée) : l'historique garderait ses liens,
  mais ce n'est plus une suppression, et il faudrait exclure ces comptes de toutes les requêtes. Écartée.
- **Supprimer aussi les duels terminés** : plus simple, mais l'adversaire perdrait une partie de son historique. Écartée.
- **Confirmer par le code de récupération** : plus sûr contre un appareil prêté, mais un joueur qui a perdu son code ne
  pourrait plus supprimer son compte. La confirmation explicite à l'écran suffit (le geste exige une session ouverte).

## Conséquences

- Un joueur peut partir sans rien demander à personne ; son adversaire voit le duel gagné par forfait au lieu d'une
  erreur, et garde son historique.
- Les duels peuvent désormais n'avoir plus qu'un joueur connu : le code et le front traitent « Compte supprimé ».
- L'écran de duel annonce tout forfait par « … n'a pas joué à temps » : pour un compte supprimé, la phrase est
  approximative (« Compte supprimé n'a pas joué à temps : forfait. »). Une raison de fin dédiée demanderait de toucher
  au moteur et aux écrans de partie : laissé à une story du front si le besoin se confirme.
- Les durées affichées engagent le projet : US-054 doit les appliquer, et la page doit changer si elles changent.
