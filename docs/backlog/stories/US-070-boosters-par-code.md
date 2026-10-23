# US-070 — Des boosters offerts par code, pour récompenser le travail réel

- **Epic** : EPIC-03
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-070-boosters-par-code`

## Récit

En tant que **porteur du projet**, je veux **offrir des boosters par un code** afin de **récompenser des réussites
de l'équipe d'intégration** : la première API publiée, la file d'attente avec le moins de retard cumulé, etc.

## Critères d'acceptation

- [ ] **Étant donné** la commande d'administration (sur le modèle de `npm run invitation`, US-048), **quand** le
      porteur du projet crée un code avec un libellé (« 1re API publiée »), un nombre de boosters, un nombre
      d'utilisations et une date d'expiration, **alors** le code s'affiche une seule fois et la base n'en garde que
      l'empreinte HMAC (ADR 0025, 0027).
- [ ] **Étant donné** un joueur connecté, **quand** il saisit un code valide sur l'écran « Mes boosters » (ou suit un
      lien `/boosters?code=…`), **alors** il reçoit les boosters, qui peuvent dépasser le plafond de recharge
      (ADR 0019), et voit le libellé de la récompense.
- [ ] **Étant donné** un code déjà utilisé par ce joueur, expiré, épuisé ou inconnu, **alors** l'API répond par un
      refus neutre, et les essais sont limités en débit (US-047).
- [ ] La base garde qui a utilisé quel code (pour suivre une campagne ou révoquer un code qui a fuité).

## Notes

- Demande du porteur du projet (2026-10-23) : faire du jeu un outil d'animation de l'équipe, en reliant les
  récompenses au travail réel.
- **Attribution manuelle uniquement** (décision du porteur du projet, 2026-10-23) : c'est lui qui juge la réussite
  et crée le code ; aucune récompense calculée automatiquement à partir des outils de l'équipe.

## Journal

- 2026-10-23 — création, notée pour plus tard à la demande du porteur du projet.
- 2026-10-23 — décision : attribution manuelle uniquement, rien d'automatique.
