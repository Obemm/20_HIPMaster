# US-028 — Kit pour l'IA du contributeur : consignes de carte et d'illustration

- **Epic** : EPIC-08
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-028-kit-ia-contributeur`

## Récit

En tant qu'**architecte qui propose une carte**, je veux **donner à mon assistant IA une consigne prête à l'emploi**
afin qu'**il écrive la carte et son illustration conformes au jeu, sans que j'aie à connaître tous les fichiers à
toucher**.

## Critères d'acceptation

- [ ] Une **consigne de carte** (`docs/contribuer/consigne-carte.md`), à copier dans un assistant de code, part de la
      proposition remplie selon le gabarit d'US-027 et liste tout ce qu'il faut écrire : la carte dans le catalogue
      du domaine (numéro suivant), sa traduction anglaise, sa fiche « En savoir plus » en français et en anglais, les
      tests et parcours e2e qui comptent les cartes, la documentation (`cartes-set-1.md`), le CHANGELOG.
- [ ] Elle interdit d'ajouter une capacité de combat ou de toucher au moteur, et exige `npm run check` au vert avant
      d'ouvrir la PR.
- [ ] Une **consigne d'illustration** (`docs/contribuer/consigne-illustration.md`), tirée de l'ADR 0047 et de
      [prompts-illustrations-gemini.md](../../produit/prompts-illustrations-gemini.md), donne l'image de référence
      du rendu, les règles (une créature distincte, ni texte, ni logo, ni personne réelle ; palette de la famille,
      intensité selon la rareté) et le format attendu de l'original (4:3).
- [ ] Elle explique comment produire et commiter les déclinaisons (`npm run illustrations`) et joindre l'original à
      la PR.
- [ ] **Étant donné** une proposition remplie, **quand** le porteur du projet ou un collègue suit le kit avec un
      assistant IA, **alors** la PR obtenue passe la CI sans retouche manuelle (essai consigné dans le journal).

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md). Remplace le formulaire de proposition dans
  le jeu du plan initial (ADR, formulaire, aperçu, « Mes propositions »).
- La consigne ne contient que des informations publiques du dépôt ([ref] the company).
- À mettre à jour quand l'ajout d'une carte change (nouveau fichier, nouvelle langue).

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard), sous le titre « Proposer une carte depuis le jeu ».
- 2026-10-27 — affinage (ADR 0050) : le formulaire dans le jeu devient un kit de consignes pour l'IA du contributeur.
