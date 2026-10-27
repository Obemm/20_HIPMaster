"""Close a user story: status "Done", criteria ticked, log entry, tracking board and epic.

Usage: python scripts/close-story.py US-007 "Summary of what was delivered"
       python scripts/close-story.py --recount   (status and progress of every epic, without closing anything)
The CHANGELOG is still written by hand.

An epic's status follows from its stories (US-075): "Done" when all of them are, "In progress" when some are, and the
hand-written status ("To refine") is kept while none is. It is written identically in the epic file and in the
tracking board.

The backlog is moving from French to English (ADR 0051, EPIC-16): every file is read and written in its own language,
recognised by its "Status" (English) or "Statut" (French) line, so French and English files can live side by side.
"""

import datetime
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BACKLOG = ROOT / "docs" / "backlog"
STATUS = re.compile(r"^- \*\*(Status|Statut)\*\* ?: (.*)$", re.M)
EPIC_REF = re.compile(r"\*\*Epic\*\* ?: (EPIC-\d+)")

WORDS = {
    "en": {
        "label": "Status",
        "separator": ": ",
        "story_done": "Done",
        "epic_done": "Done",
        "epic_in_progress": "In progress",
        "epic_to_refine": "To refine",
        "delivered": "delivered: ",
    },
    "fr": {
        "label": "Statut",
        "separator": " : ",
        "story_done": "Faite",
        "epic_done": "Terminé",
        "epic_in_progress": "En cours",
        "epic_to_refine": "À affiner",
        "delivered": "livrée : ",
    },
}


def language(text: str) -> str:
    found = STATUS.search(text)
    return "fr" if found and found.group(1) == "Statut" else "en"


def write(path: pathlib.Path, text: str) -> None:
    # The repository uses LF line endings: write bytes so that Windows does not add CR.
    path.write_bytes(text.encode("utf-8"))


def set_status(text: str, value: str) -> str:
    words = WORDS[language(text)]
    return STATUS.sub(f"- **{words['label']}**{words['separator']}{value}", text, count=1)


def progress(epic_text: str) -> tuple[int, int]:
    done = len(re.findall(r"^- \[x\] US-", epic_text, re.M))
    return done, done + len(re.findall(r"^- \[ \] US-", epic_text, re.M))


def epic_status(epic_text: str) -> str:
    words = WORDS[language(epic_text)]
    done, total = progress(epic_text)
    if total and done == total:
        return words["epic_done"]
    if done:
        return words["epic_in_progress"]
    current = STATUS.search(epic_text)
    return current.group(2).strip() if current else words["epic_to_refine"]


def update_epic(epic: pathlib.Path) -> tuple[str, str, int, int]:
    """Rewrite the status in the epic file; return (id, status, done, total)."""
    text = epic.read_text(encoding="utf-8")
    status = epic_status(text)
    text = set_status(text, status)
    write(epic, text)
    done, total = progress(text)
    return re.match(r"EPIC-\d+", epic.name).group(0), status, done, total


def update_board(epics: list[tuple[str, str, int, int]], story: tuple[str, str] | None, day: str) -> None:
    """`story` is (id, status) of the story just closed, in the language of its own file."""
    board = BACKLOG / "TABLEAU.md"
    lines = board.read_text(encoding="utf-8").splitlines()
    for i, line in enumerate(lines):
        if story and f"[{story[0]} " in line:
            cells = line.split("|")
            cells[-2] = f" {story[1]} "
            lines[i] = "|".join(cells)
            continue
        for epic_id, status, done, total in epics:
            if f"[{epic_id} " in line:
                cells = line.split("|")
                cells[-3] = f" {status} "
                cells[-2] = f" {done}/{total} "
                lines[i] = "|".join(cells)
        if line.startswith("_Last updated"):
            lines[i] = f"_Last updated: {day}_"
        elif line.startswith("_Dernière mise à jour"):
            lines[i] = f"_Dernière mise à jour : {day}_"
    write(board, "\n".join(lines) + "\n")


def main() -> None:
    today = datetime.date.today().isoformat()
    if sys.argv[1:] in (["--recount"], ["--recompter"]):
        epics = [update_epic(e) for e in sorted((BACKLOG / "epics").glob("EPIC-*.md"))]
        update_board(epics, None, today)
        for epic_id, status, done, total in epics:
            print(f"{epic_id}: {status} ({done}/{total})")
        return

    story_id, summary = sys.argv[1], sys.argv[2]
    story = next((BACKLOG / "stories").glob(f"{story_id}-*.md"))
    text = story.read_text(encoding="utf-8")
    words = WORDS[language(text)]
    text = set_status(text, words["story_done"])
    text = re.sub(r"^- \[ \] ", "- [x] ", text, flags=re.M)
    text = text.rstrip("\n") + f"\n- {today} — {words['delivered']}{summary}\n"
    write(story, text)

    epic_id = EPIC_REF.search(text).group(1)
    epic = next((BACKLOG / "epics").glob(f"{epic_id}-*.md"))
    write(epic, epic.read_text(encoding="utf-8").replace(f"- [ ] {story_id}", f"- [x] {story_id}"))
    result = update_epic(epic)
    update_board([result], (story_id, words["story_done"]), today)
    print(f"{story_id} closed ({epic_id}: {result[1]}, {result[2]}/{result[3]}).")


if __name__ == "__main__":
    main()
