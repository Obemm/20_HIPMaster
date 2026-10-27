# Consigne pour votre assistant de code : écrire la carte

Cette consigne s'adresse à un **assistant de code qui travaille dans votre clone du dépôt** (Claude Code, GitHub
Copilot en mode agent, Cursor…). Il lit les fichiers, les modifie et lance les commandes. Elle part de votre
**proposition remplie** selon le [gabarit du guide](regles-cartes.md#gabarit-de-proposition), et produit tout ce
qu'une carte demande, sauf l'image elle-même (voir la [consigne d'illustration](consigne-illustration.md)).

## Mode d'emploi

1. Remplissez le gabarit et relisez-le avec les [règles de contenu](regles-cartes.md#règles-de-contenu) : rien de
   confidentiel, car tout ce que vous donnez à l'IA finira dans une PR publique.
2. Dans votre clone, sur une branche `carte-<nom-de-la-carte>`, lancez votre assistant à la racine du dépôt.
3. Copiez la consigne ci-dessous, collez votre proposition à l'endroit indiqué, et envoyez.
4. Relisez ce qu'il a écrit (surtout le texte « En vrai », la fiche et sa traduction), puis lancez vous-même
   `npm run check` et `npm run dev` pour voir la carte dans le catalogue (localhost:4200).

## La consigne

```text
Tu travailles dans le dépôt HIPMaster, un jeu de cartes à collectionner sur l'intégration et l'architecture SI.
Lis d'abord CLAUDE.md, docs/contribuer/regles-cartes.md et docs/produit/regles.md : ils font foi.
Tout ce que tu écris (code, commentaires, documentation, commits) est en français, sauf les textes anglais du jeu.
Une carte proposée relève de l'EPIC-08 (ADR 0050) : n'écris ni story ni epic dans docs/backlog.

Ta tâche : ajouter au catalogue la carte décrite dans la proposition ci-dessous, et rien d'autre.

=== PROPOSITION ===
(collez ici votre gabarit rempli)
=== FIN DE LA PROPOSITION ===

Règles impératives : arrête-toi et dis-le-moi, sans rien écrire, si
- la proposition demande une capacité qui n'existe pas (IDS_CAPACITE dans packages/domain/src/capacites.ts) ;
- son effet ne peut pas s'écrire avec ce que le moteur sait déjà faire (dégâts, pioche, bonus d'attaque ou de PV,
  immobilisation, perte de capacités, retour en main, destruction, Débit) et demanderait un nouvel état, un nouveau
  statut ou un nouveau champ dans packages/domain/src/combat/types.ts : cela touche l'API, le contrat OpenAPI et
  l'écran de partie, et fait l'objet d'une story à part ;
- elle contient une donnée confidentielle (serveur, adresse, client, faille, chiffre interne, nom de personne).
Signale-moi aussi, sans corriger toi-même, des statistiques nettement hors des ordres de grandeur du guide, et un
effet qui fait mieux, à coût et rareté égaux, que celui d'une carte existante.
Ne modifie aucune carte existante et ne renumérote jamais une carte.
Code : pas d'enum ni de namespace (erasableSyntaxOnly) ; imports relatifs avec l'extension .ts. Textes du jeu :
apostrophe typographique ’, comme les cartes existantes.

Fichiers à écrire ou modifier (prends pour modèle les cartes 72 à 74, ajoutées par le commit f189195) :
1. packages/domain/src/set-1.ts : la carte, à la fin du tableau, avec le numéro qui suit le dernier (nom, famille,
   type, rareté, coût, attaque et PV pour un composant ou une évolution, capacités, effet éventuel, enVrai de 110
   caractères au plus), sous un commentaire « // Cartes de la communauté (EPIC-08) » à créer s'il n'existe pas.
2. packages/domain/src/langues/en/cartes.ts : son nom (les noms de produits ne se traduisent pas), son « En vrai »
   et son effet éventuel en anglais britannique, selon le glossaire en tête du fichier, sous le même commentaire ;
   mets à jour le nombre de cartes de l'en-tête.
3. packages/domain/src/fiches/<famille>.ts : sa fiche « En savoir plus » (définition, usage, exemple, à retenir,
   en interne seulement si la proposition le donne, 1 à 3 liens https que tu as ouverts), dans les longueurs de
   LIMITES_FICHE (fiches/fiche.ts) ; et sa traduction dans packages/domain/src/langues/en/fiches/<famille>.ts. Quand
   une ressource existe dans les deux langues, la fiche française pointe la version française, l'anglaise l'anglaise.
4. Si la carte a un effet (tous les sorts et incidents, et les composants qui en ont un) :
   - l'effet dans le moteur : packages/domain/src/combat/effets.ts (sorts et incidents, table EFFETS) ou
     packages/domain/src/combat/effets-composants.ts (composants), en réutilisant les fonctions d'un effet proche ;
     si tu réutilises un statut existant, vérifie que son texte dans apps/web/src/app/jeu/journal.ts reste juste
     pour ta carte (certains donnent une valeur fixe) ; sinon, arrête-toi et dis-le-moi ;
   - le numéro dans SORTS_ET_INCIDENTS_PRIS_EN_CHARGE ou COMPOSANTS_A_EFFET
     (packages/domain/src/combat/prise-en-charge.ts) ;
   - pour un sort ou un incident, son score pour le bot dans packages/domain/src/combat/bot-sorts.ts, sur le modèle
     de l'effet proche (le bot joue une carte à partir de 20 ; viser 20 à 40 pour un effet utile, 0 quand il ne
     sert à rien) ;
   - des tests de l'effet dans effets.test.ts ou effets-composants.test.ts.
5. Les nombres de cartes écrits en dur : cherche le nombre actuel de cartes (par exemple 74) et le décompte par
   rareté dans packages/domain/src/set-1.test.ts, packages/domain/src/booster.test.ts,
   packages/domain/src/combat/effets-composants.test.ts, apps/api/src/app.test.ts, e2e/catalogue.spec.ts (et le
   nombre de cartes de la famille filtrée), e2e/collection.spec.ts et e2e/robustesse.spec.ts, et mets-les à
   jour.
6. docs/produit/cartes-set-1.md : une ligne pour la carte dans une section « Cartes de la communauté (EPIC-08) »,
   placée juste avant « Points à trancher pendant l'équilibrage » (à créer si elle n'existe pas), sous forme de
   tableau sur le modèle de l'extension d'US-077 (« En vrai » abrégé), avec une colonne Auteur.
   Ne change pas les titres des familles.
7. CHANGELOG.md : une ligne sous « Non publié », « Ajouté », qui nomme la carte et son auteur.

Si tu as dû ajouter un texte d'interface (ce qui ne devrait pas arriver avec les règles ci-dessus), lance
`npm run i18n:extraire` et traduis-le dans apps/web/src/locale/messages.en.json.

Vérification : lance `npx prettier --write` sur les fichiers modifiés, puis `npm run check` à la racine, et corrige
jusqu'à ce qu'il passe. Ne touche pas aux illustrations, qui font l'objet d'une autre consigne : tant que l'image
n'est pas intégrée, un seul test reste rouge, « chaque carte du set 1 a son illustration »
(packages/illustrations/src/versionnees.test.ts), et c'est normal ; comme il arrête `npm test` avant les tests du
front, lance aussi `npm test -w @hipmaster/web`.

Pour finir, donne-moi : la carte telle qu'elle s'affichera, la liste des fichiers modifiés, et tout point dont tu
doutes (exactitude technique, équilibrage, traduction), et ce que tu as changé par rapport à la proposition
(un lien remplacé, un texte raccourci).
```

## Et ensuite

- **L'illustration** : suivez la [consigne d'illustration](consigne-illustration.md) ; une fois l'image intégrée,
  `npm run check` passe entièrement. Vous pouvez ouvrir la PR avant, en le disant : la CI restera rouge sur le seul
  test des illustrations.
- **La PR** : commitez (par exemple `feat(carte): la carte circuit breaker`, sujet en minuscules), poussez sur votre
  fork et ouvrez la PR vers `main` avec votre proposition dans la description (voir
  [CONTRIBUTING.md](../../CONTRIBUTING.md)).

Cette consigne suit le code du jeu : si elle oublie un fichier (un test qui échoue, une nouvelle langue), dites-le dans
votre PR, elle sera corrigée.
