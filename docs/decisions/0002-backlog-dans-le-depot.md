# 0002 — Backlog epics/stories en Markdown dans le dépôt

- **Date** : 2026-10-16
- **Statut** : Acceptée

## Contexte

On veut travailler en mode epic / user story et garder une trace de tout ce qui est fait, comme sur les autres projets.
Le projet n'est pas encore hébergé sur GitHub.

## Décision

Le backlog vit dans `docs/backlog/` : un fichier par epic et par story, un tableau de suivi,
et les IDs de story dans les branches et les commits.

## Alternatives envisagées

- **GitHub Issues + Projects** : tableau visuel et lien automatique avec les PR, mais nécessite d'héberger le dépôt.
- **Jira / Trello** : outils externes, séparés du code, surdimensionnés pour un projet personnel.

## Conséquences

- Fonctionne hors ligne, historique complet dans Git, lisible par tous (et par Claude).
- Pas de vue « glisser-déposer » : le tableau est mis à jour à la main (ou par `scripts/cloturer-story.py`).
- Migration possible vers GitHub Issues le jour où le dépôt est publié.
