# US-064 — Un bot battable par un débutant, une partie équitable pour les deux joueurs

- **Epic** : EPIC-04
- **Statut** : En cours
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-064-bot-equilibre`

## Récit

En tant que **joueur débutant**, je veux **un niveau de bot que je peux battre, et ne pas être désavantagé quand je
joue en second**, afin d'**apprendre le jeu en gagnant des parties et d'avoir envie de revenir**.

## Contexte

Le porteur du projet trouve qu'il est « presque impossible de gagner contre le bot ». Une étude par simulation du
2026-10-22 (360 parties par mesure, decks prêtés croisés) a trouvé deux causes :

- **aucun niveau n'est vraiment facile** : « Batch de nuit », présenté comme facile et présélectionné, est l'ancien
  bot de référence d'US-011. Un profil « débutant » (il pose sa carte la plus chère, attaque le SI dès qu'il peut,
  sinon la première cible, sans sorts ni décommissionnement) ne le bat que 16 % du temps, 7 % en jouant en second ; il
  ne fait que 11 % contre Architecte ESB et 3 % contre Agent autonome ;
- **commencer donne un gros avantage** : Batch de nuit contre lui-même gagne 60 % de ses parties en commençant,
  33 % en second, sans aucune compensation. Sur une copie du moteur, **+1 Débit au premier tour du second joueur**
  égalise (bot contre bot 47 / 47 %, débutant contre débutant 51 / 54 %), alors qu'une carte de plus ne suffit pas
  aux débutants (70 / 32 %).

## Critères d'acceptation

Les mesures se font par simulation (`npm run simuler`), sur les decks prêtés croisés.

- [ ] **Étant donné** une partie, contre le bot ou en duel, **quand** le joueur qui joue en second commence son
      premier tour, **alors** il reçoit 2 Débit au lieu de 1 ; ses tours suivants restent à +1 par tour, 10 au plus
      (ADR 0026, qui complète l'ADR 0010). Tests du domaine.
- [ ] **Étant donné** un niveau de bot, quel qu'il soit, **quand** il joue contre lui-même, **alors** le joueur qui
      commence et le second gagnent chacun entre 45 et 55 % des parties.
- [ ] Un nouveau niveau **facile, « Stagiaire »**, présélectionné : il joue comme un débutant (il pose sa carte la plus
      chère, attaque le SI dès qu'il peut, ne fait pas d'échanges réfléchis). Un profil débutant gagne **au moins
      50 %** de ses parties contre lui, un joueur du niveau de Batch de nuit **au moins 80 %**.
- [ ] Les niveaux existants deviennent **Moyen** (Batch de nuit), **Difficile** (Architecte ESB) et **Expert** (Agent
      autonome), avec des descriptions à jour ; l'API (`GET /api/v1/niveaux`, niveau par défaut à la création d'une
      partie, contrat OpenAPI) et l'écran de choix suivent.
- [ ] `npm run simuler` mesure aussi le profil débutant, la part de victoires du joueur qui commence et du second, et
      chaque niveau contre le profil débutant ; tableaux reportés dans
      [cartes-set-1.md](../../produit/cartes-set-1.md) et ci-dessous.
- [ ] Les règles ([regles.md](../../produit/regles.md)) et l'aide « Comment jouer ? » de l'écran de choix et de
      l'écran de partie expliquent le Débit du second joueur.
- [ ] Récompense : la règle actuelle reste (un booster par victoire contre le bot, quel que soit le niveau, 3 par jour
      au plus) ; la question d'une victoire contre Stagiaire est posée au porteur du projet.
- [ ] Tests du domaine, de l'API et de l'écran ; `npm run check` passe ; parcours e2e et audit axe-core au vert.

## Résultats

`npm run simuler -- 200 1` : 1 800 parties par ligne, decks prêtés croisés ; graine 1001 entre crochets quand elle
diffère de plus de 2 points. « Avant » : le moteur sans la règle, avec les niveaux d'US-021. Détail et lecture dans
[cartes-set-1.md](../../produit/cartes-set-1.md).

| Chaque joueur contre lui-même | Avant : premier / second | Après : premier / second |
| ----------------------------- | ------------------------ | ------------------------ |
| Profil débutant               | 73 / 27 %                | 54 / 46 %                |
| Stagiaire                     | —                        | 53 / 48 %                |
| Batch de nuit                 | 63 / 36 %                | 52 / 46 %                |
| Architecte ESB                | 66 / 33 %                | 54 / 46 %                |
| Agent autonome                | 62 / 38 %                | 49 / 51 %                |

| Après : niveau du bot      | Débutant (en commençant / en second) | Joueur « Batch de nuit » (en commençant / en second) |
| -------------------------- | ------------------------------------ | ---------------------------------------------------- |
| Stagiaire (facile)         | **56 %** (59 / 53 %)                 | **90 %** (91 / 89 %)                                 |
| Batch de nuit (moyen)      | 14 % (16 / 12 %)                     | 50 % (53 / 46 %)                                     |
| Architecte ESB (difficile) | 8 % (9 / 7 %)                        | 44 % [40 %] (49 / 40 %)                              |
| Agent autonome (expert)    | 4 % (5 / 2 %)                        | 39 % [36 %] (42 / 36 %)                              |

Avant, contre Batch de nuit alors présenté comme facile, un débutant gagnait 14 % de ses parties (21 % en
commençant, 7 % en second). Les trois cibles sont atteintes aux deux graines : débutant contre Stagiaire 56 et 54 %,
joueur « Batch de nuit » contre Stagiaire 90 %, miroirs entre 46 et 54 % à chaque niveau.

## Notes

- Décision : [ADR 0026](../../decisions/0026-debit-du-second-joueur.md).
- La règle vit dans le moteur (`debuterTour`) : elle vaut pour les parties contre le bot comme pour les duels, sans
  rien changer à l'API. Le journal de partie l'annonce au second joueur (« Vous jouez en second : 1 Débit de plus à
  ce premier tour »).
- **Le profil débutant** (`choisirActionDebutant`, dans `packages/domain/src/combat/bot-stagiaire.ts`) sert de mesure :
  il pose sa carte la plus chère tant qu'il peut, attaque le SI dès qu'il peut, sinon la première cible permise (une
  Garde), sans sort, incident ni décommissionnement.
- **Pourquoi le Stagiaire n'est pas exactement le profil débutant** : contre lui-même, le profil débutant gagne en
  moyenne une partie sur deux ; le critère « au moins 50 % » se jouerait donc à pile ou face. Variantes essayées
  (1 800 parties par mesure, decks croisés, graine 1, avec la règle de l'ADR 0026) :

  | Stagiaire                                             | Débutant | Joueur « Batch de nuit » | Miroir (1er / 2e) |
  | ----------------------------------------------------- | -------- | ------------------------ | ----------------- |
  | Le profil débutant tel quel                           | 52 %     | 87 %                     | 54 / 46 %         |
  | Sans évolution                                        | 51 %     | 86 %                     | 54 / 46 %         |
  | **Une seule pose par tour** (retenue)                 | 56 %     | 90 %                     | 53 / 48 %         |
  | Attaque avant de poser                                | 57 %     | 88 %                     | 54 / 46 %         |
  | Sans évolution, attaque avant de poser                | 56 %     | 87 %                     | 55 / 45 %         |
  | Le SI, sinon une Garde qu'il détruit d'un coup        | 61 %     | 87 %                     | 51 / 48 %         |
  | Le SI, sinon la Garde avec un seul composant par tour | 53 %     | 87 %                     | 54 / 46 %         |
  | Le SI seulement : rien quand une Garde le protège     | 68 %     | 90 %                     | 48 / 49 %         |

  « Une seule pose par tour » laisse une marge au débutant, garde un miroir équilibré et un bot actif, qui attaque
  aussi les Gardes ; « le SI seulement » est plus facile encore, mais le bot reste inerte derrière une Garde.

- **Architecte ESB étudie désormais 4 actions candidates au lieu de 3.** Avec la seule règle du Débit, son miroir
  restait à 56 / 44 % aux graines 1 et 1001 (54,7 % pour le premier en moyenne sur six graines, 10 800 parties),
  hors de la cible, alors que Batch de nuit et Agent autonome y entraient. Le nombre de candidates règle cet avantage
  (graine 1, 1 800 parties par mesure, decks croisés ; victoires d'ESB contre les deux autres) :

  | Candidates     | Miroir (1er / 2e) | Contre Batch de nuit | Contre Agent autonome |
  | -------------- | ----------------- | -------------------- | --------------------- |
  | 2              | 58 / 42 %         | 45 %                 | 31 %                  |
  | 3 (avant)      | 56 / 44 %         | 56 %                 | 41 %                  |
  | **4** (retenu) | 54 / 46 %         | 59 %                 | 45 %                  |
  | 5              | 53 / 47 %         | 61 %                 | 47 %                  |
  | 6              | 51 / 49 %         | 61 %                 | 48 %                  |

  Avec 4 candidates, ESB entre dans la cible et reste entre Batch de nuit et Agent autonome ; au-delà, il rattrape
  presque Agent autonome. Un bot qui étudie trop peu d'actions profite davantage de l'avance du premier tour.

## Journal

- 2026-10-22 — création, à la suite de l'étude par simulation du même jour.
- 2026-10-22 — règle du second joueur dans le moteur (journal de partie, règles, aide « Comment jouer ? ») ; profil
  débutant et `simulerCroise` ; Stagiaire « une seule pose par tour », retenu parmi huit variantes ; Architecte ESB à
  4 candidates pour entrer dans la cible d'équité ; API, écran et e2e suivent ; mesures avant et après aux graines 1 et 1001. `npm run check` et `npm run test:e2e` (75 parcours) passent.
