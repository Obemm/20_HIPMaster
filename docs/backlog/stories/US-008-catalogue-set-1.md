# US-008 — Catalogue du set 1

- **Epic** : EPIC-01
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-008-catalogue-set-1`

## Récit

En tant que **joueur de l'équipe d'intégration**, je veux **parcourir toutes les cartes du set 1 sur mon téléphone**
afin de **découvrir l'univers du jeu et relire le set avant de pouvoir y jouer**.

## Critères d'acceptation

### Domaine (`packages/domain`)

- [x] Le modèle d'une carte est typé : numéro, nom, famille, type (Composant, Sort, Incident, Évolution de…), rareté,
      coût en Débit, attaque et PV (composants et évolutions uniquement), capacités, effet, texte « En vrai », et carte
      d'origine pour une évolution.
- [x] Les capacités du [glossaire des règles](../../produit/regles.md) sont une liste typée (identifiant, nom,
      description) ; une carte ne référence que des capacités connues.
- [x] Les cartes du [brouillon du set 1](../../produit/cartes-set-1.md) sont saisies en données versionnées : les 64
      cartes numérotées et les 7 incidents complémentaires (numéros 65 à 71).
- [x] Des tests vérifient les invariants du set : numéros uniques et continus, 4 légendaires, toute évolution
      référence une carte existante, pas d'attaque ni de PV sur un sort ou un incident, coûts compris entre 0 et 10.

### API (`apps/api`)

- [x] Le contrat OpenAPI de la ressource `cartes` est écrit dans `apps/api/openapi/` avant le code (ADR 0007).
- [x] **Étant donné** l'API démarrée, **quand** j'appelle `GET /api/v1/cartes`, **alors** je reçois les 71 cartes
      triées par numéro, avec leurs capacités détaillées.
- [x] **Quand** j'appelle `GET /api/v1/cartes/{numero}` avec un numéro inconnu, **alors** je reçois une 404 au format
      Problem Details.

### Front (`apps/web`)

- [x] **Étant donné** le front, **quand** j'ouvre `/cartes`, **alors** je vois toutes les cartes avec nom, famille,
      rareté, coût, attaque/PV, capacités et effet, et la rareté se lit autrement que par la couleur.
- [x] Je peux filtrer par famille et par rareté ; le nombre de cartes affichées est annoncé aux lecteurs d'écran.
- [x] **Quand** j'ouvre une carte, **alors** je vois son détail : description des capacités, texte « En vrai » et,
      pour une évolution, un lien vers sa carte d'origine.
- [x] La page s'utilise au clavier et sur une largeur de 375 px sans défilement horizontal ; l'audit axe-core ne
      relève aucune violation.
- [x] Un lien depuis la page d'accueil mène au catalogue.

### Qualité

- [x] Un parcours e2e couvre le catalogue (liste, filtre, détail) ; `npm run check`, `npm run build` et
      `npm run test:e2e` passent.

## Notes

- Aucune illustration (EPIC-05) : la carte est rendue en texte, avec un repère visuel de famille et de rareté.
- Les capacités sont **décrites**, pas encore **appliquées** : leurs effets relèvent du moteur de combat (story à
  venir).
- **Décision** ([ADR 0011](../../decisions/0011-catalogue-cartes-versionne.md)) : le catalogue est une donnée versionnée dans le code de
  `packages/domain`, et non en base. La base ne gardera que ce qui appartient aux joueurs (collection, decks). La table
  provisoire `cartes` d'US-004 sera retirée dans la première story de collection (EPIC-03).
- Statistiques provisoires : elles seront équilibrées plus tard par des simulations « bot contre bot ».

## Journal

- 2026-10-18 — création.
- 2026-10-18 — ADR 0011 ; domaine : modèle de carte, 23 capacités, 71 cartes et tests d'invariants ; API :
  contrat `apps/api/openapi/cartes.yaml`, `GET /api/v1/cartes` et `/cartes/{numero}` ; front : accueil déplacé dans
  sa route, catalogue filtrable `/cartes` et détail `/cartes/:numero`, fond explicite de la page ; 4 parcours e2e
  (mobile et bureau) avec audit axe-core. En revue.
- 2026-10-18 — livrée : catalogue du set 1 : 71 cartes en données du domaine (ADR 0011), API /api/v1/cartes, pages catalogue filtrable et détail, parcours e2e avec audit axe-core
