"""Clôture une user story : statut « Faite », critères cochés, journal, tableau de suivi et epic.

Usage : python scripts/cloturer-story.py US-007 "Résumé de ce qui a été livré"
Le CHANGELOG reste à compléter à la main (texte rédigé).
"""

import datetime
import pathlib
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
BACKLOG = RACINE / "docs" / "backlog"


def main() -> None:
    story_id, resume = sys.argv[1], sys.argv[2]
    aujourdhui = datetime.date.today().isoformat()

    story = next((BACKLOG / "stories").glob(f"{story_id}-*.md"))
    texte = story.read_text(encoding="utf-8")
    texte = re.sub(r"^- \*\*Statut\*\* : .*$", "- **Statut** : Faite", texte, count=1, flags=re.M)
    texte = re.sub(r"^- \[ \] ", "- [x] ", texte, flags=re.M)
    texte = texte.rstrip("\n") + f"\n- {aujourdhui} — livrée : {resume}\n"
    story.write_text(texte, encoding="utf-8", newline="\n")

    epic_id = re.search(r"\*\*Epic\*\* : (EPIC-\d+)", texte).group(1)
    epic = next((BACKLOG / "epics").glob(f"{epic_id}-*.md"))
    epic_texte = epic.read_text(encoding="utf-8")
    epic_texte = epic_texte.replace(f"- [ ] {story_id}", f"- [x] {story_id}")
    epic_texte = re.sub(r"^- \*\*Statut\*\* : À affiner$", "- **Statut** : En cours", epic_texte, flags=re.M)
    epic.write_text(epic_texte, encoding="utf-8", newline="\n")
    faites = epic_texte.count("- [x] US-")
    total = faites + epic_texte.count("- [ ] US-")

    tableau = BACKLOG / "TABLEAU.md"
    lignes = tableau.read_text(encoding="utf-8").splitlines()
    for i, ligne in enumerate(lignes):
        if f"[{story_id} " in ligne:
            cellules = ligne.split("|")
            cellules[-2] = " Faite "
            lignes[i] = "|".join(cellules)
        elif f"[{epic_id} " in ligne:
            cellules = ligne.split("|")
            cellules[-3] = " Terminé " if faites == total else " En cours "
            cellules[-2] = f" {faites}/{total} "
            lignes[i] = "|".join(cellules)
        elif ligne.startswith("_Dernière mise à jour"):
            lignes[i] = f"_Dernière mise à jour : {aujourdhui}_"
    tableau.write_text("\n".join(lignes) + "\n", encoding="utf-8", newline="\n")
    print(f"{story_id} clôturée ({epic_id} : {faites}/{total}).")


if __name__ == "__main__":
    main()
