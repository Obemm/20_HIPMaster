# US-028 — Kit pour l'IA du contributeur : consignes de carte et d'illustration

- **Epic** : EPIC-08
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-028-kit-ia-contributeur`

## Récit

En tant qu'**architecte qui propose une carte**, je veux **donner à mon assistant IA une consigne prête à l'emploi**
afin qu'**il écrive la carte et son illustration conformes au jeu, sans que j'aie à connaître tous les fichiers à
toucher**.

## Critères d'acceptation

- [x] Une **consigne de carte** (`docs/contribuer/consigne-carte.md`), à copier dans un assistant de code, part de la
      proposition remplie selon le gabarit d'US-027 et liste tout ce qu'il faut écrire : la carte dans le catalogue
      du domaine (numéro suivant), sa traduction anglaise, sa fiche « En savoir plus » en français et en anglais, les
      tests et parcours e2e qui comptent les cartes, la documentation (`cartes-set-1.md`), le CHANGELOG.
- [x] Elle interdit d'ajouter une capacité ou une mécanique nouvelle du moteur, et exige `npm run check` au vert avant
      d'ouvrir la PR.
- [x] Une **consigne d'illustration** (`docs/contribuer/consigne-illustration.md`), tirée de l'ADR 0047 et de
      [prompts-illustrations-gemini.md](../../produit/prompts-illustrations-gemini.md), donne l'image de référence
      du rendu, les règles (une créature distincte, ni texte, ni logo, ni personne réelle ; palette de la famille,
      intensité selon la rareté) et le format attendu de l'original (4:3).
- [x] Elle explique comment produire et commiter les déclinaisons (`npm run illustrations`) et joindre l'original à
      la PR.
- [x] **Étant donné** une proposition remplie, **quand** un assistant IA suit la consigne de carte, **alors** la carte
      obtenue passe `npm run check` sans retouche manuelle, hors test des illustrations tant que l'image manque (essai
      consigné dans le journal).

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md). Remplace le formulaire de proposition dans
  le jeu du plan initial (ADR, formulaire, aperçu, « Mes propositions »).
- La consigne ne contient que des informations publiques du dépôt ([ref] the company).
- À mettre à jour quand l'ajout d'une carte change (nouveau fichier, nouvelle langue).

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard), sous le titre « Proposer une carte depuis le jeu ».
- 2026-10-27 — affinage (ADR 0050) : le formulaire dans le jeu devient un kit de consignes pour l'IA du contributeur.
- 2026-10-27 — deux essais de la consigne de carte par un agent IA, dans un worktree isolé, avec une carte d'essai
  « Bulkhead » (sort Patterns commun, jamais commitée). Premier essai (effet « ne subit aucun dégât ») : il a fallu un
  nouveau statut du moteur, touchant API, contrat et écran ; le test « numéro inconnu » codait le prochain numéro ; le
  test des illustrations restait rouge. Corrections : arrêt de l'IA sur toute mécanique nouvelle (décision du porteur
  du projet, ADR 0050), pas de story par carte, test indépendant du nombre de cartes, liste de fichiers à jour.
  Second essai (effet « +2 PV ») : `npm run check` vert du premier coup hors test des illustrations, tests du front
  verts ; dernières précisions (texte du journal d'un statut réutilisé, échelle du score du bot, carte qui en
  surpasse une autre, tests du front à lancer à part).
- 2026-10-27 — livrée : Consignes pour l'IA du contributeur : docs/contribuer/consigne-carte.md (éprouvée par deux essais) et consigne-illustration.md ; CONTRIBUTING.md les relie.
