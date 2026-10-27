# US-086 — Le kit du contributeur en anglais

- **Epic** : EPIC-08
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-086-kit-contributeur-anglais`

## Récit

En tant qu'**architecte anglophone invité à proposer une carte**, je veux **un kit du contributeur en anglais** afin
de **comprendre les règles et de proposer ma carte sans passer par un traducteur**.

## Critères d'acceptation

- [x] `CONTRIBUTING.md`, le guide `docs/contribuer/regles-cartes.md`, la consigne de carte, la consigne
      d'illustration et le modèle de PR « carte » sont en anglais (britannique, comme la version `/en/` du jeu).
- [x] Une proposition peut être écrite en anglais : la consigne de carte demande à l'IA d'écrire les textes du jeu
      en français (la langue de référence, ADR 0043) et en anglais, et de garder en français ce que le projet tient
      en français (commentaires de code, `cartes-set-1.md`, CHANGELOG).
- [x] L'exception à la règle « tout en français » est consignée dans l'ADR 0050 et dans `CLAUDE.md`.
- [x] Le `README.md` présente la contribution en anglais aussi.

## Notes

- Décision du porteur du projet (2026-10-27) : le dépôt sera partagé avec des collègues anglophones ; le reste du
  projet (backlog, ADR, code, documentation produit) reste en français.
- Les chemins des fichiers ne changent pas (`docs/contribuer/…`) : ils sont cités par l'ADR 0050, les stories et le
  README.
- Le texte français d'une carte proposée en anglais est écrit par l'IA du contributeur ; le porteur du projet le relit.

## Journal

- 2026-10-27 — création (EPIC-08).
- 2026-10-27 — livrée : Kit du contributeur en anglais (CONTRIBUTING.md, guide, consignes de carte et d'illustration, modèle de PR) ; exception consignée dans l'ADR 0050 et CLAUDE.md ; README bilingue.
