# US-060 — Une navigation pensée pour le téléphone

- **Epic** : EPIC-10
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-060-navigation-mobile`

## Récit

En tant que **joueur sur téléphone**, je veux **passer d'une rubrique à l'autre d'un geste du pouce** afin de
**retrouver mes duels, mes boosters et ma collection sans chercher les liens**.

## Contexte

Constat de la revue du 2026-10-22, en 375 px : connecté, l'en-tête aligne « HIPMaster », « Duels », « Boosters »,
« Collection » et le pseudo, en petits liens soulignés ; le pseudo passe sur deux lignes. « Jouer contre le bot » et
le catalogue ne sont accessibles que depuis l'accueil, et chaque page répète un lien « ← Accueil ».

## Critères d'acceptation

- [ ] **Étant donné** un écran de moins de 768 px, **alors** une barre d'onglets fixée en bas donne accès à : Jouer,
      Duels (avec la pastille « à vous de jouer »), Boosters (avec le stock), Collection, Compte ; l'onglet courant
      est signalé visuellement et par `aria-current`.
- [ ] **Étant donné** un écran plus large, **alors** la même navigation est en en-tête.
- [ ] **Étant donné** un visiteur sans compte, **alors** les onglets qui exigent un compte mènent à la création de
      compte, avec une phrase qui dit pourquoi.
- [ ] Chaque zone tactile mesure au moins 44 × 44 px ; la barre ne masque jamais l'action principale d'un écran
      (marge basse, zone de sécurité des téléphones à encoche).
- [ ] **Étant donné** un lecteur d'écran, **quand** le joueur change de page, **alors** le focus passe sur le titre
      de la nouvelle page, qui est ainsi annoncée.
- [ ] Parcours e2e adaptés ; l'audit axe vérifie aussi les règles WCAG 2.1 et 2.2 AA (`wcag21aa`, `wcag22aa`).

## Notes

- À concevoir avec US-059 : la barre d'onglets et la main du joueur se partagent le bas de l'écran pendant une
  partie (la barre peut s'effacer en partie).

## Journal

- 2026-10-22 — création, issue de la revue du design avant mise en ligne.
