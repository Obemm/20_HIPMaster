# US-075 — Un statut d'epic toujours conforme à ses stories

- **Epic** : EPIC-00
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : XS
- **Branche** : `us-075-statut-epics`

## Récit

En tant que **porteur du projet**, je veux **que le statut et l'avancement de chaque epic soient justes, dans son
fichier comme dans le tableau de suivi** afin de **savoir d'un coup d'œil ce qui est terminé**.

## Contexte

Constat du porteur du projet (2026-10-23) : des epics terminés restaient « En cours ». `scripts/cloturer-story.py`
passait bien l'epic à « Terminé » dans le tableau, mais n'écrivait jamais que « En cours » dans le fichier de l'epic
(EPIC-00, EPIC-02, EPIC-04). Et l'avancement du tableau n'était pas recompté quand une story était ajoutée à un epic
(EPIC-03 affiché 2/2 au lieu de 2/3, EPIC-07 0/0 au lieu de 0/1, EPIC-10 0/5 au lieu de 0/6).

## Critères d'acceptation

- [x] **Étant donné** la clôture d'une story, **alors** le statut de son epic se déduit de ses stories (« Terminé »
      quand toutes sont faites, « En cours » quand une partie l'est) et s'écrit à l'identique dans le fichier de
      l'epic et dans le tableau.
- [x] **Étant donné** `python scripts/cloturer-story.py --recompter`, **alors** le statut et l'avancement de chaque
      epic sont recalculés et réécrits partout, sans rien clôturer : à lancer après l'ajout d'une story.
- [x] Les epics du dépôt sont recomptés : aucun écart entre fichiers et tableau.

## Journal

- 2026-10-23 — création, à la suite du constat du porteur du projet.
- 2026-10-23 — livrée : statut et avancement des epics déduits de leurs stories, à l'identique dans le fichier de l'epic et le tableau ; option --recompter ; tous les epics recomptés
