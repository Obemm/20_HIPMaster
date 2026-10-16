# Méthode de travail : epics et user stories

## Vocabulaire

- **Epic** (`EPIC-XX`) : un grand objectif, découpé en plusieurs stories. Ex. : « Ouvrir un booster et voir ses cartes ».
- **User story** (`US-XXX`) : un besoin d'utilisateur livrable en quelques heures à 2 jours.
  Formulation : _En tant que [persona], je veux [action] afin de [bénéfice]._
- **Critères d'acceptation** : conditions vérifiables (format Étant donné / Quand / Alors) qui disent quand la story est terminée.

Les numéros sont uniques et jamais réutilisés. Une story appartient à un seul epic.

## Cycle de vie d'une story

`À affiner` → `Prête` → `En cours` → `En revue` → `Faite`

- **Prête** (Definition of Ready) : persona identifié, bénéfice clair, critères d'acceptation écrits, taille estimée.
- **Faite** (Definition of Done) :
  - tous les critères d'acceptation sont vérifiés ;
  - `npm run check` et `npm run build` passent ;
  - utilisable au clavier et sur mobile (largeur 375 px), contrastes suffisants ;
  - tests ajoutés quand il y a de la logique ;
  - [CHANGELOG.md](../../CHANGELOG.md) mis à jour, statut mis à jour dans le fichier de la story et dans [TABLEAU.md](TABLEAU.md).

## Traçabilité dans Git

- **Branche** par story : `us-012-booster-quotidien`.
- **Commits** : Conventional Commits avec l'ID en portée : `feat(US-012): ouverture d’un booster`.
- **Décision importante** (choix technique, renoncement…) : un ADR dans [../decisions/](../decisions/README.md), cité dans la story.

## Taille (estimation)

`XS` < 1 h · `S` ½ journée · `M` 1 jour · `L` 2 jours · au-delà : découper la story.

## Priorité (MoSCoW)

`Must` indispensable · `Should` important · `Could` bonus · `Won't` pas maintenant (gardé pour mémoire).

## Créer un epic ou une story

Copier un modèle de [templates/](templates/), le nommer `EPIC-XX-titre-court.md` ou `US-XXX-titre-court.md`,
puis l'ajouter à [TABLEAU.md](TABLEAU.md).
