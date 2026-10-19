# US-042 — Des parcours e2e de duel fiables sous charge

- **Epic** : EPIC-06
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-042-e2e-duels-fiables`

## Récit

En tant que **développeur du jeu**, je veux **que les parcours Playwright des duels passent à coup sûr quand toute
la suite tourne en parallèle** afin de **faire confiance au quality gate avant chaque fusion, sans relancer ni
ignorer des échecs « de délai »**.

## Critères d'acceptation

- [x] **Étant donné** la suite e2e complète (`npm run test:e2e`, projets « bureau » et « mobile »), **quand** elle
      tourne trois fois de suite sur un poste de développement, **alors** elle passe trois fois à 75/75, sans relance.
- [x] **Étant donné** un parcours de duel à deux navigateurs, **quand** il prépare le duel (deux comptes, un défi
      lancé puis relevé), **alors** cette préparation passe par l'API et non par l'interface, sauf dans le parcours
      qui teste justement le défi par lien (`duels.spec.ts`) ; le parcours vérifié reste celui de l'interface.
- [x] **Étant donné** le journal animé de la partie (250 ms par ligne) et les animations CSS, **quand** les e2e
      tournent, **alors** les navigateurs demandent une animation réduite (`reducedMotion: 'reduce'` dans la
      configuration Playwright) : le journal s'affiche d'un coup, comme pour un joueur qui a réduit les animations.
- [x] **Étant donné** l'interrogation du duel toutes les 3 s pendant le tour adverse (ADR 0020), **quand** un parcours
      attend le tour de l'autre joueur, **alors** il attend au plus ce qu'il faut (délais explicites et justifiés) ; le
      délai du parcours n'est relevé (`test.slow()`) que pour les parcours qui enchaînent plusieurs tours.
- [x] **Étant donné** le poste de développement (15 Go, dont 2 à 4 Go libres), **quand** la suite tourne, **alors**
      Playwright n'ouvre que trois travailleurs en local (valeur par défaut en CI) : au-delà, le serveur Angular ou le
      lanceur meurent faute de mémoire.
- [x] **Étant donné** le parcours « adversaire au hasard », **quand** la page du duel s'ouvre, **alors** le parcours
      attend le nom de l'adversaire dans le titre (« Duel contre … » le temps du chargement) avant de le lire.
- [x] Aucun vrai bogue n'est masqué : les délais d'attente restent bornés (10 s par tour adverse), aucune nouvelle
      relance (`retries`) en local, et un duel qui ne se propage pas d'un navigateur à l'autre échoue toujours.
- [ ] `npm run check` passe (lint, format et typecheck passent ; voir le journal pour les tests unitaires).

## Notes

- **Mesures du 2026-10-19, avant correction** (les trois fichiers de duel seuls, 22 tests, 6 travailleurs, poste de
  développement à 15 Go dont 4 Go libres) : sur trois exécutions, aucune à 22/22. Deux fois, le serveur Angular lancé
  par Playwright est mort (code 0xC0000409, abandon de Node) après la première salve, d'où des « connexion refusée »
  en cascade ; la troisième fois, servi par `npm run dev`, c'est le lanceur Playwright lui-même qui est mort
  (« Zone Allocation failed - process out of memory », code 134). Quand ils passent, les parcours restent lents :
  « un duel se joue à deux navigateurs » 29,8 s (limite 30 s), audits axe du plateau 24 s sur mobile, « défier un
  collègue par lien » 21 s. L'API répond en moins de 35 ms : le temps part dans la préparation par l'interface (deux
  comptes, un défi lancé puis relevé : six navigations), l'attente de l'interrogation (3 s par tour) et la mémoire.
- **Mesures après correction** (suite complète, 75 tests) : à quatre travailleurs, le serveur Angular meurt encore
  (0xC0000409) ; à trois, 72/75 en 2,6 min avec un seul échec, une lecture trop tôt du titre « Duel contre … » dans
  `duel-hasard.spec.ts` (corrigée), et la mémoire physique libre descend à 443 Mo (Chrome : 3 Go). Les parcours de
  duel à deux navigateurs passent de 18 à 30 s à 8 à 17 s ; le défi par lien de 21 s à 12 s.
- **Cause racine** : la mémoire, pas un bogue du jeu. Six travailleurs qui ouvrent chacun jusqu'à trois navigateurs,
  plus le serveur Angular et l'API, dépassent ce que le poste peut offrir ; tout ralentit, puis un processus Node
  meurt. D'où les trois leviers : moins de navigateurs par parcours (préparation par l'API), moins de travailleurs en
  local (quatre), et des attentes plus courtes (animations réduites).
- Pas d'ADR : rien ne change dans l'architecture (ADR 0020 inchangé, interrogation à 3 s conservée) ; seuls les tests
  et la configuration Playwright bougent.

## Journal

- 2026-10-19 — création, à la demande du porteur du projet (session parente) : la suite e2e est devenue fragile (75/75, puis 69/75, puis
  74/75 le même jour) à cause des duels à deux navigateurs qui dépassent 30 s sous charge.
- 2026-10-19 — livrée : Duel préparé par l'API dans les parcours du plateau et de « Mes duels » (e2e/duel-api.ts), comptes par l'API sauf celui qui teste la création ; animations réduites et trois travailleurs en local dans playwright.config.ts ; parcours à plusieurs tours déclaré lent ; « adversaire au hasard » attend le nom dans le titre. Trois exécutions complètes de suite à 75/75 (2,3 à 2,8 min).
- 2026-10-19 — `npm run check` : lint, format et typecheck passent ; les tests unitaires échouent sur ce poste par
  dépassement des 10 s du `beforeEach` qui ouvre une base PGlite en mémoire (API) et des 5 s de deux tests du
  domaine, même à trois travailleurs Vitest, alors que chaque fichier passe seul. Rien de l'API ni du domaine n'est
  touché par la story : c'est le poste, saturé en mémoire (2 Go libres), pas le code. À relancer sur un poste moins
  chargé ou en CI.
