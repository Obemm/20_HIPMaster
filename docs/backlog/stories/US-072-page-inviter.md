# US-072 — Une page « Inviter » réservée au porteur du projet

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-072-page-inviter`

## Récit

En tant que **porteur du projet**, je veux **créer, suivre et révoquer les invitations depuis le site, sur mon
téléphone** afin d'**inviter un collègue en quelques secondes, sans ligne de commande ni secrets de production**.

## Contexte

L'inscription se fait sur invitation (US-048, ADR 0027), mais les invitations ne se créent qu'avec la commande
`npm run invitation`, qui demande les secrets de production (Cloud Run Job ou poste). Décision du porteur du projet
(2026-10-23) : une page d'administration **réservée à son seul compte** ; pas d'invitations par les joueurs. Les
comptes sont des comptes invités, sans e-mail ni mot de passe (ADR 0017), protégés par limitation de débit, sessions
révocables et HMAC (ADR 0025).

## Critères d'acceptation

- [x] **Étant donné** la configuration de l'API, **alors** la liste des administrateurs vient de la variable
      `ADMINISTRATEURS` (identifiants de joueur), jamais du front ; une valeur invalide empêche l'API de démarrer.
- [x] **Étant donné** un joueur qui n'est pas administrateur, un visiteur sans compte ou une session expirée,
      **quand** il appelle une route d'administration, **alors** l'API répond **404**, exactement comme pour une route
      qui n'existe pas (ni 401, ni 403, ni 429).
- [x] **Étant donné** un administrateur, **quand** il crée une invitation (libellé, nombre de comptes, date limite),
      **alors** l'API renvoie le code et le lien **une seule fois** ; la base n'en garde que l'empreinte.
- [x] **Étant donné** un administrateur, **quand** il liste les invitations, **alors** il voit pour chacune son
      libellé, les comptes créés sur le maximum, l'expiration et si elle est révoquée, **jamais le code**.
- [x] **Étant donné** un administrateur, **quand** il révoque une invitation, **alors** son code ne crée plus de
      compte, les comptes déjà créés restent, et la liste la dit « révoquée ».
- [x] Les routes d'administration sont décrites dans un contrat OpenAPI écrit avant le code, et limitées en débit ;
      elles reprennent la logique de la commande `npm run invitation`, sans la dupliquer.
- [x] **Étant donné** « Mon compte », **quand** le joueur est administrateur, **alors** un lien « Inviter » mène à la
      page ; sinon, ni le lien ni la page ne sont accessibles.
- [x] **Étant donné** la page « Inviter », **quand** une invitation est créée, **alors** son lien se copie en un geste,
      et se partage par le menu du téléphone (Web Share) quand il existe.
- [x] **Étant donné** la page « Inviter », **alors** elle liste les invitations avec leur usage et permet de révoquer
      après confirmation ; elle s'utilise au clavier, en 375 px, dans les deux thèmes, sans violation axe-core.
- [x] **Étant donné** le déploiement, **alors** `ADMINISTRATEURS` est transmise à l'API par `scripts/gcp/deployer.sh`
      et le workflow ; le guide d'exploitation explique comment le porteur du projet trouve son identifiant de joueur.
- [x] Tests : logique des invitations et de la configuration, API (dont le 404 pour un non-administrateur), écran,
      parcours e2e.

## Notes

- Décision : [ADR 0029](../../decisions/0029-administrateurs-par-configuration.md), qui complète les ADR 0017 et 0027.
- L'identifiant de joueur s'affiche dans « Mon compte » (« Identifiant du compte »), pour le recopier dans la
  configuration.
- Contrat : `apps/api/openapi/administration.yaml` (`GET` et `POST /admin/invitations`,
  `POST /admin/invitations/{id}/revocation`) ; `GET /moi` porte `administrateur: true` pour un administrateur, et rien
  pour les autres (`comptes.yaml` 1.3.0).
- Le refus passe par un crochet `onRequest` propre au plugin d'administration, avant la lecture du corps et la limite
  de débit, et répond par le gestionnaire 404 de l'application (`callNotFound`) : la même réponse, octet pour octet,
  qu'une route inexistante. Testé sans jeton, avec un jeton inconnu et avec un joueur ordinaire, au-delà de la limite.
- Les routes appellent `apps/api/src/comptes/invitations.ts`, comme la commande ; bornes, date limite (`finDuJour`),
  lien (`lienInvitation`) et statut (`statutInvitation`) y sont désormais partagés.
- Migration `0009_revocation_invitations` : une colonne facultative `revoquee_le`, compatible avec la version en ligne.
- Réglages : `ADMINISTRATEURS` (UUID séparés par des espaces ou des virgules ; `tous` hors production seulement, refusé
  au démarrage en production) et `ADRESSE_SITE` (adresse des liens). Les e2e lancent l'API avec
  `ADMINISTRATEURS=tous`.
- Déploiement : variable GitHub `HIPMASTER_ADMINISTRATEURS`, vérifiée par `deployer.sh` avant toute étape, posée par
  les étapes `migrations` et `revision` ; guide d'exploitation, section « Administrateurs ».
- E2e lancés sur des ports dédiés (3300/4500) : 3000 et 4200 servaient une autre session.

## Journal

- 2026-10-23 — création, après la décision du porteur du projet d'inviter depuis le site, avec son seul compte.
- 2026-10-23 — ADR [0029](../../decisions/0029-administrateurs-par-configuration.md), contrat OpenAPI d'abord.
- 2026-10-23 — livrée : page « Inviter » réservée aux administrateurs désignés par ADMINISTRATEURS (variable GitHub HIPMASTER_ADMINISTRATEURS au déploiement) : créer une invitation avec code et lien montrés une seule fois, copier ou partager le lien, suivre l'usage, révoquer après confirmation ; routes /api/v1/admin/invitations en 404 pour tout autre appelant ; révocation distinguée de l'expiration (migration 0009) ; e2e complets et sous CSP de production verts
