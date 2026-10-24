# US-060 — Une navigation pensée pour le téléphone

- **Epic** : EPIC-10
- **Statut** : Faite
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

- [x] **Étant donné** un écran de moins de 768 px, **alors** une barre d'onglets fixée en bas donne accès à : Jouer,
      Duels (avec la pastille « à vous de jouer »), Boosters (avec le stock), Collection, Compte ; l'onglet courant
      est signalé visuellement et par `aria-current`.
- [x] **Étant donné** un écran plus large, **alors** la même navigation est en en-tête.
- [x] **Étant donné** un visiteur sans compte, **alors** les onglets qui exigent un compte mènent à la création de
      compte, avec une phrase qui dit pourquoi.
- [x] Chaque zone tactile mesure au moins 44 × 44 px ; la barre ne masque jamais l'action principale d'un écran
      (marge basse, zone de sécurité des téléphones à encoche).
- [x] **Étant donné** un lecteur d'écran, **quand** le joueur change de page, **alors** le focus passe sur le titre
      de la nouvelle page, qui est ainsi annoncée.
- [x] Parcours e2e adaptés ; l'audit axe vérifie aussi les règles WCAG 2.1 et 2.2 AA (`wcag21aa`, `wcag22aa`).

## Notes

- À concevoir avec US-059 : la barre d'onglets et la main du joueur se partagent le bas de l'écran pendant une
  partie (la barre peut s'effacer en partie).
- Choix retenus :
  - **Une seule navigation** (`<nav aria-label="Navigation principale">`) : barre fixée en bas sous 768 px, liens
    de l'en-tête au-delà. Onglets : Jouer (`/jouer`), Duels (pastille « à vous de jouer »), Boosters (stock),
    Collection, Compte (pseudo au bureau). Chaque onglet mesure au moins 44 px de haut, la barre respecte la zone de
    sécurité des téléphones à encoche (`viewport-fit=cover`, `env(safe-area-inset-*)`) et une cale en fin de page
    l'empêche de masquer le bas d'un écran.
  - **En partie** (`/jouer/:id`, `/duels/:id`), la barre s'efface sur téléphone : le plateau d'US-059 garde tout
    l'écran ; « Quitter » ramène à la navigation.
  - **Visiteur sans compte** : Duels, Boosters et Collection mènent à leur page, qui dit déjà pourquoi il faut un
    compte et propose de le créer ; l'onglet Compte s'appelle « Créer un compte ».
  - **Stock de boosters** : lu à la connexion, puis relu quand le serveur annonce la prochaine recharge
    (`prochainDans`), après une ouverture et après une victoire qui rapporte un booster ; jamais calculé par le front
    (ADR 0004, ADR 0019).
  - **Focus** : à chaque changement de page (pas à l'ouverture d'une fenêtre de détail sur la même page), le focus
    passe sur le titre `h1` de la nouvelle page.
  - **Audit WCAG 2.1 et 2.2** : il a relevé « Libellé dans le nom » (2.5.3) sur les cartes de la main et les jetons du
    plateau, dont le bouton enveloppait tout le texte de la carte. Le bouton est désormais posé sur la vignette ou le
    jeton (purement visuels) et porte seul le nom : ce qu'annonce un lecteur d'écran ne change pas.
  - Les liens « ← Accueil » des pages disparaissent : le logo et les onglets les remplacent (sauf « Mon compte »,
    que la session API modifie en parallèle).

## Journal

- 2026-10-22 — création, issue de la revue du design avant mise en ligne.
- 2026-10-23 — affinée et commencée (lot 2, session front) : choix notés ci-dessus.
- 2026-10-23 — livrée : barre d'onglets en bas sous 768 px (stock de boosters, duels à jouer, aria-current, 44 px, zone de sécurité), effacée en partie, en-tête au bureau, focus sur le titre à chaque page, audit axe WCAG 2.1 et 2.2 AA
