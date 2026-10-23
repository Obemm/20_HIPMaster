# US-048 — Inscription sur invitation

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-048-inscription-sur-invitation`

## Récit

En tant que **porteur du projet**, je veux **que seules les personnes munies d'un code d'invitation puissent créer
un compte** afin d'**ouvrir le jeu à mes collègues sans l'ouvrir à tout Internet**.

## Contexte

Choix du porteur du projet (2026-10-22) : le site est joignable sur Internet, mais la création de compte est réservée
aux invités. Le catalogue et les parties contre le bot restent jouables sans compte (ADR 0017). Aujourd'hui,
`POST /api/v1/joueurs` crée un compte pour qui le demande.

## Critères d'acceptation

- [x] **Étant donné** un code d'invitation valide, **quand** un visiteur crée son compte avec un pseudo et ce code,
      **alors** le compte est créé comme aujourd'hui (jeton, code de récupération, boosters de bienvenue).
- [x] **Étant donné** un code absent, inconnu, expiré ou épuisé, **quand** un visiteur tente de créer un compte,
      **alors** l'API répond **403** au format Problem Details, avec un message qui ne dit pas lequel des cas
      s'applique.
- [x] **Étant donné** le porteur du projet, **quand** il lance la commande de création d'invitation (libellé, nombre
      d'utilisations, date d'expiration), **alors** le code s'affiche **une seule fois** ; la base n'en garde que
      l'empreinte, comme pour les codes de récupération (ADR 0017).
- [x] **Étant donné** un compte créé par invitation, **alors** la base sait de quelle invitation il vient (pour
      suivre une campagne ou révoquer une invitation qui aurait fuité).
- [x] **Étant donné** la page « Mon compte », **quand** un visiteur arrive par un lien d'invitation
      (`/compte?invitation=…`), **alors** le champ du code est prérempli.
- [x] **Étant donné** le développement et les tests e2e, **alors** l'inscription reste libre par défaut ; elle
      n'exige une invitation que si la configuration le demande (activée en production).
- [x] Le contrat `apps/api/openapi/comptes.yaml` est mis à jour avant le code ; tests d'API pour chaque cas.

## Notes

- Décision à consigner dans un ADR qui complète l'ADR 0017 (forme du code, stockage, commande d'administration).
- Piste : une table `invitations` (empreinte, libellé, utilisations maximum et consommées, expiration) et une
  commande `npm run invitation`, exécutée en production par un Cloud Run Job, ce qui évite d'écrire une interface
  d'administration.
- Une connexion par code de récupération (`POST /sessions`) n'est pas concernée : elle retrouve un compte existant.
- Limitation de débit des essais de code : US-047.
- Décisions : [ADR 0027](../../decisions/0027-inscription-sur-invitation.md). Code de 16 caractères (80 bits, quatre
  groupes, pour ne pas le confondre avec un code de récupération), empreinte HMAC avec la clé des codes (usage
  `invitation:`). `INSCRIPTION_SUR_INVITATION` vaut `oui` par défaut en production seulement ; un code fourni est
  toujours vérifié, ce qui permet d'essayer le parcours en développement.
- Commande : `npm run invitation -- --libelle … --utilisations … [--expire AAAA-MM-JJ | --jours N]`, `--lister`,
  `--revoquer <id>` ; en production, Cloud Run Job `hipmaster-invitation` (guide d'exploitation, section « Inviter
  des joueurs »), avec l'image du service `hipmaster-api` déployé par US-050.
- Migration `0008_invitations` : une table et une colonne facultative, compatibles avec la version encore en ligne
  (ADR 0023).
- Essai réel du 2026-10-23 sur PostgreSQL 18 (conteneur local) et l'API en mode production : sans code ou avec un code
  inconnu, 403 ; une invitation de 2 utilisations crée 2 comptes puis refuse le troisième ; la liste et la révocation
  fonctionnent.

## Journal

- 2026-10-22 — création, après le choix d'une ouverture « collègues sur invitation ».
- 2026-10-23 — affinée et commencée, à partir de la branche d'US-047 (non fusionnée) : ADR [0027](../../decisions/0027-inscription-sur-invitation.md), contrat OpenAPI d'abord.
- 2026-10-23 — livrée : table invitations (empreinte HMAC, libellé, utilisations, expiration) et référence de l'invitation sur chaque compte, POST /joueurs exige une invitation quand INSCRIPTION_SUR_INVITATION est active (par défaut en production) avec un 403 neutre, commande npm run invitation (création avec code affiché une seule fois, liste, révocation) et Cloud Run Job documenté, préremplissage depuis /compte?invitation=… ; essayé sur PostgreSQL 18 en mode production
