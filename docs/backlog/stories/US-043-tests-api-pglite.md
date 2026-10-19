# US-043 — Tests de l'API robustes sur un poste chargé

- **Epic** : EPIC-00
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : S
- **Branche** : `us-043-tests-api-pglite`

## Récit

En tant que **développeur**, je veux **que `npm run check` passe même quand mon poste est saturé** afin de **ne pas
confondre un délai dépassé avec une régression, ni relancer les tests au hasard**.

## Contexte

Constat du 2026-10-19 (poste à 15 Go, 2 Go libres) : les tests de l'API (`comptes`, `boosters`, `duels`,
`recompenses`) ouvrent une base PGlite en mémoire **dans chaque `beforeEach`**. Mesure : une ouverture coûte
≈ 1,6 s (dont ≈ 1,55 s de chargement du WASM de PGlite, les migrations n'en prennent que 50 ms), soit 43 ouvertures
et près de 70 s de WASM pour ces quatre fichiers. Quand les 20 fichiers tournent en parallèle, le `beforeEach`
dépasse les 10 s du `hookTimeout` par défaut, même avec `--maxWorkers=3`, alors que chaque fichier passe seul. Deux
tests du domaine qui simulent une dizaine de parties complètes (`niveaux.test.ts`, `parties/schemas.test.ts`)
dépassent aussi les 5 s par défaut.

## Critères d'acceptation

- [x] **Étant donné** un fichier de test de l'API, **quand** il s'exécute, **alors** une seule base PGlite est ouverte
      pour tout le fichier (`beforeAll`) et les tables sont vidées avant chaque test, qui repart donc d'une base vide
      comme avant.
- [x] **Étant donné** une nouvelle table ajoutée au schéma Drizzle, **alors** elle est vidée elle aussi sans toucher
      au code des tests (la liste des tables vient du schéma).
- [x] **Étant donné** les deux tests du domaine et de l'API qui simulent des parties complètes, **alors** leur délai
      est relevé explicitement, avec la raison en commentaire, sans réduire le nombre de parties simulées.
- [x] **Étant donné** le projet `api` de `vitest.config.ts`, **alors** le délai des hooks est relevé et justifié en
      commentaire (une ouverture de WASM par fichier, dont la durée dépend de la machine et non du code).
- [x] **Étant donné** la mémoire d'un PGlite (≈ 550 Mo résidents), **alors** les fichiers de tests de l'API
      s'exécutent l'un après l'autre (une seule base en mémoire à la fois), le domaine restant en parallèle.
- [x] `npm run check` passe, et `npx vitest run` passe trois fois de suite.

## Notes

- Pas de changement de comportement de l'API ni du domaine : seule la mise en place des tests change.
- Les délais relevés ne masquent pas de régression fonctionnelle : ils couvrent un chargement de WASM et des
  simulations de parties, dont la durée est par nature liée à la machine.
- Deuxième constat pendant la story : une fois les délais réglés, une passe sur quatre mourait encore par manque
  de mémoire (« Fatal process out of memory », processus de travail Vitest tué sur `comptes.test.ts`) : avec
  12 cœurs, Vitest lançait les 5 fichiers PGlite de front, soit ≈ 3 Go pour 4,4 Go libres. D'où
  `fileParallelism: false` sur le seul projet `api`.
- Distinct de US-042 (e2e fiables), qui traitait la même saturation côté Playwright.

## Journal

- 2026-10-19 — création, après mesure du coût d'ouverture de PGlite.
- 2026-10-19 — livrée : une base PGlite par fichier de test (tables vidées entre les tests), fichiers API en séquence, délais relevés et justifiés ; check et vitest ×4 verts sur poste saturé
