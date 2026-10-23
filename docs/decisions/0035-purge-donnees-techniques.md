# 0035 — Sessions qui expirent et purge nocturne des seules données techniques

- **Date** : 2026-10-24
- **Statut** : Acceptée
- **Complète** : [0017](0017-compte-invite.md) et [0025](0025-protections-api.md) (sessions), applique les durées de
  [0031](0031-suppression-compte.md) ; précise [0019](0019-boosters-recharge-a-la-lecture.md),
  [0020](0020-duels-asynchrones.md) et [0030](0030-parties-bot-en-base.md) (« aucune tâche de fond » dans l'API)
- **Référence Elis** : aucune (le référentiel ne traite ni de la durée des sessions ni de la conservation des
  données) ; ADR-006 (journaux) — déjà adapté par les ADR 0021 et 0033 : le bilan de la purge va dans Cloud Logging,
  comme celui des autres jobs

## Contexte

La revue du 2026-10-22 (US-054) a relevé que rien n'est jamais supprimé : les sessions n'expirent pas (un jeton volé,
gardé par le navigateur, ADR 0017, donne un accès permanent), et les défis jamais acceptés, les parties contre le bot
abandonnées et les sessions oubliées s'accumulent. La page « À propos et confidentialité » (US-053, ADR 0031) annonce
pourtant des durées, marquées « bientôt ».

Le porteur du projet a tranché le 2026-10-23 : **les comptes, leurs collections, leurs récompenses et les résultats
(les futurs scores, US-069) sont gardés sans limite**, sauf si le joueur supprime son compte. Seules des données
techniques expirent : sessions inutilisées 90 jours, défis jamais acceptés 7 jours (US-033), parties contre le bot
abandonnées 24 heures (ADR 0030).

Contraintes : la base Neon gratuite compte ses heures de calcul et dort après 5 minutes sans connexion (ADR 0021, 0023) ; l'API ne fait rien en dehors des requêtes (processeur alloué pendant les requêtes seulement, ADR 0028) ; deux
des trois tâches Cloud Scheduler gratuites servent déjà (sauvegarde et relevé de consommation, ADR 0033).

## Décision

### Sessions

- **Une session expire après 90 jours sans usage** (`SESSIONS_DUREE_JOURS`, réglable) : la table `sessions` gagne
  `utilisee_le`. Une session expirée est refusée comme une session inconnue (**401** « session absente ou expirée ») ;
  le joueur se reconnecte avec son code de récupération, son compte est intact.
- **Chaque usage prolonge la session**, avec **au plus une écriture par jour et par session** : la vérification du
  jeton reste une simple lecture pour presque toutes les requêtes.
- Migration compatible avec la version en ligne : une colonne ajoutée avec une valeur par défaut (`now()`), que les
  sessions existantes reçoivent à l'instant de la migration, et un index pour la purge.

### Purge

- **Une commande**, `node apps/api/src/purger.ts`, supprime en une passe : les parties contre le bot sans coup joué
  depuis 24 heures, les défis (privés ou ouverts) jamais acceptés depuis 7 jours, et les sessions expirées (avec les
  parties qu'elles avaient lancées). Elle journalise ce qu'elle a supprimé, par sorte.
- **Elle ne touche jamais** un compte, une collection, une récompense ni un duel commencé, en cours ou terminé : un
  test le vérifie, sur un compte inactif depuis des années et dix ans plus tard. L'état complet des duels terminés
  (11 à 18 Ko chacun) **n'est pas allégé** : c'est l'historique des scores, et le volume reste faible (1 000 duels font
  moins de 20 Mo, pour 1 Gio chez Neon).
- **En production, un Cloud Run Job** `hipmaster-purge`, avec l'**image de l'API** (le code de la purge suit le
  schéma) et son **propre compte de service**, qui ne lit que l'URL de la base. **Cloud Scheduler** le lance chaque
  nuit à **5 h 25** (Paris), cinq minutes avant la sauvegarde : un seul réveil de la base pour les deux, et une
  sauvegarde déjà allégée. C'est la troisième et dernière tâche planifiée gratuite. Ses échecs rejoignent l'alerte des
  jobs d'exploitation (ADR 0033).
- **Le déploiement continu tient le job à jour mais ne le crée jamais** : sa création (`deployer.sh purge` depuis un
  poste) et sa planification (`infrastructure.sh`) sont des gestes du porteur du projet (guide d'exploitation).
- Les expirations évaluées à la lecture (défi expiré, partie expirée en 404, forfait d'un duel, ADR 0020, 0030)
  restent la règle du jeu ; la purge ne fait que libérer la place. L'API n'a toujours **aucune tâche de fond**.

## Alternatives envisagées

- **Purger dans l'API**, au fil des requêtes (comme les parties à leur création, ADR 0030) : aucune ressource de plus,
  mais une requête de joueur paierait la purge, et rien ne passe les jours sans trafic. Gardé pour les parties
  (plafond), écarté comme mécanisme général.
- **Minuteur dans l'API** (`setInterval`) : Cloud Run n'alloue le processeur que pendant les requêtes et arrête
  l'instance inactive ; le minuteur ne tournerait pas, ou garderait la base éveillée. Écarté.
- **`pg_cron` chez Neon** : pas de journal dans Cloud Logging ni d'alerte, et une extension propre au fournisseur.
  Écarté.
- **Expiration absolue** (90 jours après la connexion, même en jouant chaque jour) : plus simple, mais un joueur fidèle
  devrait ressaisir son code tous les trois mois. Écartée au profit de l'inactivité, plus juste pour un jeton volé
  comme pour un joueur assidu.
- **Écrire `utilisee_le` à chaque requête** : une écriture de plus par requête, et autant de réveils de la base pour
  rien. Une par jour suffit à une durée comptée en jours.
- **Supprimer les comptes inactifs**, ou **vider l'état des duels terminés** : contraire à la décision du porteur du
  projet (scores conservés). Écarté.
- **Créer le job par le déploiement continu** : plus automatique, mais une ressource et une tâche planifiée de plus,
  qui touchent aux données, sans geste explicite du porteur du projet. Écarté.

## Conséquences

- Un jeton volé ne vaut plus que tant qu'il sert ; « Déconnecter mes autres appareils » (ADR 0025) reste le recours
  immédiat.
- Un joueur absent plus de 90 jours se reconnecte avec son code : ses cartes, ses récompenses et ses duels l'attendent.
  Sans code, son compte reste en base, inaccessible, jusqu'à ce qu'il le retrouve : le jeu ne le supprime pas.
- La page de confidentialité ne dit plus « bientôt » : changer une durée, c'est changer la purge **et** la page.
- Toutes les tâches Cloud Scheduler gratuites sont prises : une quatrième coûterait 0,10 $ par mois.
- Tant que le porteur du projet n'a pas créé le job, l'API applique déjà l'expiration des sessions, mais rien n'est
  supprimé.
