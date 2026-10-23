"""Clôture une user story : statut « Faite », critères cochés, journal, tableau de suivi et epic.

Usage : python scripts/cloturer-story.py US-007 "Résumé de ce qui a été livré"
        python scripts/cloturer-story.py --recompter   (statut et avancement de chaque epic, sans rien clôturer)
Le CHANGELOG reste à compléter à la main (texte rédigé).

Le statut d'un epic se déduit de ses stories (US-075) : « Terminé » quand toutes sont faites, « En cours » quand une
partie l'est, et le statut écrit à la main (« À affiner ») est gardé tant qu'aucune ne l'est. Il est écrit à
l'identique dans le fichier de l'epic et dans le tableau de suivi.
"""

import datetime
import pathlib
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
BACKLOG = RACINE / "docs" / "backlog"
STATUT = re.compile(r"^- \*\*Statut\*\* : (.*)$", re.M)


def avancement(epic_texte: str) -> tuple[int, int]:
    faites = len(re.findall(r"^- \[x\] US-", epic_texte, re.M))
    return faites, faites + len(re.findall(r"^- \[ \] US-", epic_texte, re.M))


def statut_epic(epic_texte: str) -> str:
    faites, total = avancement(epic_texte)
    if total and faites == total:
        return "Terminé"
    if faites:
        return "En cours"
    actuel = STATUT.search(epic_texte)
    return actuel.group(1).strip() if actuel else "À affiner"


def mettre_a_jour_epic(epic: pathlib.Path) -> tuple[str, str, int, int]:
    """Réécrit le statut dans le fichier de l'epic ; renvoie (id, statut, faites, total)."""
    texte = epic.read_text(encoding="utf-8")
    statut = statut_epic(texte)
    texte = STATUT.sub(f"- **Statut** : {statut}", texte, count=1)
    epic.write_text(texte, encoding="utf-8", newline="\n")
    faites, total = avancement(texte)
    return re.match(r"EPIC-\d+", epic.name).group(0), statut, faites, total


def mettre_a_jour_tableau(epics: list[tuple[str, str, int, int]], story_id: str | None, jour: str) -> None:
    tableau = BACKLOG / "TABLEAU.md"
    lignes = tableau.read_text(encoding="utf-8").splitlines()
    for i, ligne in enumerate(lignes):
        if story_id and f"[{story_id} " in ligne:
            cellules = ligne.split("|")
            cellules[-2] = " Faite "
            lignes[i] = "|".join(cellules)
            continue
        for epic_id, statut, faites, total in epics:
            if f"[{epic_id} " in ligne:
                cellules = ligne.split("|")
                cellules[-3] = f" {statut} "
                cellules[-2] = f" {faites}/{total} "
                lignes[i] = "|".join(cellules)
        if ligne.startswith("_Dernière mise à jour"):
            lignes[i] = f"_Dernière mise à jour : {jour}_"
    tableau.write_text("\n".join(lignes) + "\n", encoding="utf-8", newline="\n")


def main() -> None:
    aujourdhui = datetime.date.today().isoformat()
    if sys.argv[1:] == ["--recompter"]:
        epics = [mettre_a_jour_epic(e) for e in sorted((BACKLOG / "epics").glob("EPIC-*.md"))]
        mettre_a_jour_tableau(epics, None, aujourdhui)
        for epic_id, statut, faites, total in epics:
            print(f"{epic_id} : {statut} ({faites}/{total})")
        return

    story_id, resume = sys.argv[1], sys.argv[2]
    story = next((BACKLOG / "stories").glob(f"{story_id}-*.md"))
    texte = story.read_text(encoding="utf-8")
    texte = STATUT.sub("- **Statut** : Faite", texte, count=1)
    texte = re.sub(r"^- \[ \] ", "- [x] ", texte, flags=re.M)
    texte = texte.rstrip("\n") + f"\n- {aujourdhui} — livrée : {resume}\n"
    story.write_text(texte, encoding="utf-8", newline="\n")

    epic_id = re.search(r"\*\*Epic\*\* : (EPIC-\d+)", texte).group(1)
    epic = next((BACKLOG / "epics").glob(f"{epic_id}-*.md"))
    epic.write_text(
        epic.read_text(encoding="utf-8").replace(f"- [ ] {story_id}", f"- [x] {story_id}"),
        encoding="utf-8",
        newline="\n",
    )
    resultat = mettre_a_jour_epic(epic)
    mettre_a_jour_tableau([resultat], story_id, aujourdhui)
    print(f"{story_id} clôturée ({epic_id} : {resultat[1]}, {resultat[2]}/{resultat[3]}).")


if __name__ == "__main__":
    main()
