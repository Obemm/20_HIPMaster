# US-059 — Un plateau de partie qui tient dans un écran de téléphone

- **Epic** : EPIC-10
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-059-plateau-mobile-un-ecran`

## Récit

En tant que **joueur sur téléphone**, je veux **voir le camp adverse, mon camp et ma main sans faire défiler la
page** afin de **jouer une partie comme dans un vrai jeu de cartes, d'une seule main, entre deux réunions**.

## Contexte

Constat de la revue du 2026-10-22, en 375 × 812 : à l'ouverture d'une partie, l'encadré « Comment jouer ? » est
déplié et occupe le premier écran et demi ; le camp du bot commence vers 1 100 px, la main du joueur vers 1 500 px
(page de 2 000 px). Pour jouer, il faut faire défiler entre le camp adverse, son camp, sa main et le bouton « Finir
mon tour ». Même disposition dans l'écran de duel.

## Critères d'acceptation

- [x] **Étant donné** une partie ouverte sur un écran de 375 × 667 px (petit téléphone), **alors** le SLA et le camp
      adverses, mon camp, ma main et l'action principale (« Finir mon tour ») sont visibles **sans défilement de la
      page** ; seuls la main et les camps défilent horizontalement si besoin.
- [x] **Étant donné** une première partie, **alors** l'aide « Comment jouer ? » s'ouvre une fois (ou depuis un bouton
      « ? » toujours visible), puis reste repliée : on retient qu'elle a été vue.
- [x] **Étant donné** le journal de la partie, **alors** il est accessible à la demande (panneau ou onglet) au lieu
      de pousser le plateau vers le bas.
- [x] **Étant donné** un écran de bureau, **alors** la disposition profite de la largeur (plateau au centre, journal
      et aide sur le côté).
- [x] **Étant donné** un joueur qui a agrandi la taille du texte de son téléphone, **alors** le texte des cartes et
      des jetons suit ce réglage (tailles en `rem`, plus de plancher figé à 10 px dans `vignette-carte.html` et
      `jeton-composant.ts`) sans casser la mise en page.
- [x] Mêmes règles pour l'écran de duel. Navigation au clavier, lecteur d'écran et parcours e2e inchangés ou
      adaptés ; audit axe sans nouvelle violation.

## Notes

- La boucle « jouer » est le cœur du jeu : c'est le gain d'ergonomie le plus rentable avant d'inviter des joueurs.
- Pistes : zone adverse en haut, zone du joueur en bas, main ancrée au bas de l'écran (comme Hearthstone ou
  WikiMasters), détails de carte en feuille modale.
- Choix retenus :
  - **Aide** : une fenêtre modale « Comment jouer ? » (objectif, règle courte, capacités en jeu), ouverte d'elle-même
    à la première partie jouée dans ce navigateur, puis depuis le bouton « ? » de l'en-tête. Le fait qu'elle a été
    vue est gardé par le navigateur ([ADR 0032](../../decisions/0032-preferences-interface-navigateur.md)).
  - **Journal** : un bandeau de deux lignes entre les deux camps (les derniers coups restent lisibles et annoncés
    aux lecteurs d'écran), qui se déplie à la demande par-dessus le plateau.
  - **Détail d'une carte ou d'un composant** (US-040, US-041) : une feuille fixée au bas de l'écran, non modale, qui
    recouvre la main sans pousser le plateau ; le focus y passe à l'ouverture et revient à la carte à la fermeture.
  - **Camps et main** : une rangée qui défile horizontalement ; la barre d'action reste collée au bas de l'écran.
  - **Bureau** (≥ 1 024 px) : le plateau au centre, et sur le côté l'objectif, les capacités en jeu et le journal
    complet.

## Journal

- 2026-10-22 — création, issue de la revue du design avant mise en ligne.
- 2026-10-23 — affinée et commencée (lot 2, session front) : choix de disposition notés ci-dessus.
- 2026-10-23 — livrée : plateau en un écran de téléphone (375 × 667 sans défilement), aide en fenêtre ouverte une fois puis par « ? », journal en bandeau dépliable, détail en feuille au bas de l'écran, colonne latérale au bureau, textes des cartes en rem (ADR 0032)
