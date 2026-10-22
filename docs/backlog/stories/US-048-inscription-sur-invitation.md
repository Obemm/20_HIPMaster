# US-048 — Inscription sur invitation

- **Epic** : EPIC-09
- **Statut** : À affiner
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

- [ ] **Étant donné** un code d'invitation valide, **quand** un visiteur crée son compte avec un pseudo et ce code,
      **alors** le compte est créé comme aujourd'hui (jeton, code de récupération, boosters de bienvenue).
- [ ] **Étant donné** un code absent, inconnu, expiré ou épuisé, **quand** un visiteur tente de créer un compte,
      **alors** l'API répond **403** au format Problem Details, avec un message qui ne dit pas lequel des cas
      s'applique.
- [ ] **Étant donné** le porteur du projet, **quand** il lance la commande de création d'invitation (libellé, nombre
      d'utilisations, date d'expiration), **alors** le code s'affiche **une seule fois** ; la base n'en garde que
      l'empreinte, comme pour les codes de récupération (ADR 0017).
- [ ] **Étant donné** un compte créé par invitation, **alors** la base sait de quelle invitation il vient (pour
      suivre une campagne ou révoquer une invitation qui aurait fuité).
- [ ] **Étant donné** la page « Mon compte », **quand** un visiteur arrive par un lien d'invitation
      (`/compte?invitation=…`), **alors** le champ du code est prérempli.
- [ ] **Étant donné** le développement et les tests e2e, **alors** l'inscription reste libre par défaut ; elle
      n'exige une invitation que si la configuration le demande (activée en production).
- [ ] Le contrat `apps/api/openapi/comptes.yaml` est mis à jour avant le code ; tests d'API pour chaque cas.

## Notes

- Décision à consigner dans un ADR qui complète l'ADR 0017 (forme du code, stockage, commande d'administration).
- Piste : une table `invitations` (empreinte, libellé, utilisations maximum et consommées, expiration) et une
  commande `npm run invitation`, exécutée en production par un Cloud Run Job, ce qui évite d'écrire une interface
  d'administration.
- Une connexion par code de récupération (`POST /sessions`) n'est pas concernée : elle retrouve un compte existant.
- Limitation de débit des essais de code : US-047.

## Journal

- 2026-10-22 — création, après le choix d'une ouverture « collègues sur invitation ».
