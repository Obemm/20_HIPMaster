# US-070 — Des boosters offerts par code, pour récompenser le travail réel

- **Epic** : EPIC-03
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-070-boosters-par-code`
- **ADR** : [0045](../../decisions/0045-boosters-offerts-par-code.md)

## Récit

En tant que **porteur du projet**, je veux **offrir des boosters par un code** afin de **récompenser des réussites
de l'équipe d'intégration** : la première API publiée, la file d'attente avec le moins de retard cumulé, etc.

## Critères d'acceptation

- [x] **Étant donné** la commande d'administration `npm run code-boosters` (sur le modèle de `npm run invitation`,
      US-048), **quand** le porteur du projet crée un code avec un libellé (« 1re API publiée »), un nombre de boosters,
      un nombre d'utilisations et une date d'expiration, **alors** le code et son lien s'affichent une seule fois et la
      base n'en garde que l'empreinte HMAC (ADR 0025, 0027, 0045).
- [x] **Étant donné** un administrateur (ADR 0029), **quand** il ouvre la page « Offrir des boosters » (`/offrir`,
      depuis « Mon compte »), **alors** il crée un code avec les mêmes réglages, copie ou partage son lien, voit l'usage
      de chaque code et qui l'a utilisé ; tout autre appelant reçoit 404 sur ces routes.
- [x] **Étant donné** un joueur connecté, **quand** il saisit un code valide sur l'écran « Mes boosters » (ou suit un
      lien `/boosters?code=…`, qui remplit le champ), **alors** il reçoit les boosters, qui peuvent dépasser le plafond
      de recharge (ADR 0019), et voit le libellé de la récompense.
- [x] **Étant donné** un code déjà utilisé par ce joueur, expiré, révoqué, épuisé ou inconnu, **alors** l'API répond
      par un refus neutre (403, un seul message), et les essais sont limités en débit (60 par heure et par adresse,
      US-047).
- [x] La base garde qui a utilisé quel code (pour suivre une campagne ou révoquer un code qui a fuité) ; un code qui a
      fuité se révoque depuis la page ou la commande, sans reprendre les boosters déjà reçus.

## Conception

- **Données** (migration `0015`) : `codes_boosters` (empreinte, libellé, boosters 1–20, utilisations 1–1000,
  expiration, création, révocation) et `boosters_offerts` (code, joueur, boosters, instant ; clé primaire code + joueur :
  une utilisation par joueur), supprimée avec le compte.
- **Domaine des codes** : `apps/api/src/comptes/codes-boosters.ts`, partagé par la commande et les routes : création
  (code de 16 caractères, empreinte `boosters:`), utilisation en une transaction (compteur conditionnel, trace, stock
  verrouillé), liste, bénéficiaires, révocation.
- **API** : `POST /moi/boosters/codes` (contrat `boosters.yaml`, limite `codeBoosters`) ; `GET`/`POST
/admin/codes-boosters`, `GET /admin/codes-boosters/{id}/beneficiaires`, `POST /admin/codes-boosters/{id}/revocation`
  (contrat `administration.yaml`).
- **Commande** : `npm run code-boosters -- --libelle … --boosters N --utilisations N [--expire | --jours]`,
  `--lister`, `--beneficiaires <id>`, `--revoquer <id>` ; Cloud Run Job en production (guide d'exploitation).
- **Front** : bloc « Un code cadeau ? » sur « Mes boosters », prérempli par `?code=` (retiré de l'adresse) ; page
  « Offrir des boosters » (`/offrir`), sœur de « Inviter ».

## Notes

- Demande du porteur du projet (2026-10-23) : faire du jeu un outil d'animation de l'équipe, en reliant les
  récompenses au travail réel.
- **Attribution manuelle uniquement** (décision du porteur du projet, 2026-10-23) : c'est lui qui juge la réussite
  et crée le code ; aucune récompense calculée automatiquement à partir des outils de l'équipe.
- Le libellé est vu des joueurs qui utilisent le code (contrairement à celui d'une invitation).
- Traduction (EPIC-14) : le socle n'était pas encore sur `main` ; les nouvelles chaînes sont à marquer avec les autres.

## Journal

- 2026-10-23 — création, notée pour plus tard à la demande du porteur du projet.
- 2026-10-23 — décision : attribution manuelle uniquement, rien d'automatique.
- 2026-10-24 — affinée : conception, ADR 0045 ; statut « En cours ».
- 2026-10-24 — livrée : boosters offerts par code : page « Offrir des boosters » et npm run code-boosters, saisie ou lien /boosters?code=…, refus neutre limité en débit, trace et révocation (ADR 0045)
