# US-045 — `npm run dev` ne redémarre l'API que sur un changement des sources

- **Epic** : EPIC-00
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : XS
- **Branche** : `us-045-api-dev-watch-sources`

## Récit

En tant que **développeur**, je veux **que l'API lancée par `npm run dev` ne redémarre que lorsque je modifie son
code** afin de **pouvoir développer sans qu'elle redémarre en boucle sur un poste chargé**.

## Contexte

Constat du 2026-10-20 : `npm run dev` faisait redémarrer l'API en boucle. Le script `dev` de l'API lance
`node --watch src/server.ts`, qui surveille **tout le graphe des modules chargés**, `node_modules` compris. Sur un
poste saturé (antivirus, mémoire basse), des fichiers de `node_modules` sont vus « modifiés » pendant le chargement,
d'où un redémarrage, qui recharge les modules, et ainsi de suite. Contournement provisoire : une configuration
`hipmaster-sans-watch` dans `.claude/launch.json`, non commitée, qui lance l'API sans surveillance.

## Critères d'acceptation

- [x] **Étant donné** `npm run dev`, **quand** l'API démarre, **alors** seuls ses sources (`apps/api/src`), ses
      migrations (`apps/api/drizzle`) et la logique de jeu (`packages/domain/src`) sont surveillés, pas
      `node_modules`.
- [x] **Étant donné** l'API démarrée par `npm run dev`, **quand** un fichier de `apps/api/src` ou de
      `packages/domain/src` est modifié, **alors** l'API redémarre une fois.
- [x] **Étant donné** l'API démarrée par `npm run dev` et aucune modification, **alors** elle ne redémarre pas.
- [x] Le contournement `hipmaster-sans-watch` est retiré de `.claude/launch.json`.

## Notes

- `--watch-path` remplace la surveillance du graphe des modules par celle des seuls dossiers indiqués (Node ≥ 22,
  pris en charge sous Windows et macOS, et sous Linux depuis la surveillance récursive de `fs.watch`).
- Mesures du 2026-10-22 (API seule, 45 s sans modification) : 3 redémarrages avec `--watch`, aucun avec
  `--watch-path`. Avec `--watch-path`, modifier `apps/api/src/config.ts` puis `packages/domain/src/index.ts`
  donne exactement un redémarrage chacun. `npm run dev` complet : aucun redémarrage en 60 s.

## Journal

- 2026-10-22 — création, pour remplacer le contournement `hipmaster-sans-watch` du 2026-10-20.
- 2026-10-22 — livrée : l'API ne surveille plus que src, drizzle et packages/domain/src ; plus aucun redémarrage sans modification, un seul par modification ; contournement hipmaster-sans-watch retiré
