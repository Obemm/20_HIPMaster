# US-077 — Trois nouvelles cartes : API First, EDA et API GraphQL

- **Epic** : EPIC-13
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `claude/us-077-api-first-eda-graphql-ca8e3f`

## Récit

En tant que **joueur**, je veux **trouver dans le jeu les cartes « API First », « EDA » et « API GraphQL »** afin de
**découvrir ces approches qui manquent au catalogue**.

## Critères d'acceptation

- [x] **Étant donné** le catalogue, **alors** les trois cartes y figurent (famille, rareté, coût, attaque et PV ou
      effet, capacités, texte « En vrai ») : « API First » et « API GraphQL » dans la famille API, « EDA » dans la
      famille Événementiel ; un type (composant, sort) est choisi pour chacune et justifié.
- [x] **Étant donné** l'équilibre du jeu, **alors** une simulation contre les bots montre qu'aucune des trois ne
      déséquilibre les decks (ADR 0010).
- [x] **Étant donné** chaque carte, **alors** elle a sa fiche « En savoir plus » (EPIC-12) avec au moins un lien
      vérifié, son prompt d'illustration et son illustration.
- [x] Elles entrent dans le tirage des boosters ; les collections existantes ne changent pas.

## Conception (validée par le porteur du projet le 2026-10-25)

- **Extension du set 1, numéros 72 à 74**, plutôt qu'ouverture du set 2 : les trois sujets relèvent des familles API
  et Événementiel du set 1 ; le set 2 (US-076) portera sur le DDD, les microservices et le DevOps. Tout le code
  suppose un set unique (`SET_1`, `/illustrations/set-1/`, collection et decks par numéro) : un set 2 pour trois cartes
  aurait demandé un ADR et de la plomberie sans gain. Les numéros suivent la règle de l'ADR 0011 (jamais de
  renumérotation) : pas de nouvel ADR.
- **Types** : API First et EDA sont des façons de concevoir, donc des **sorts** qu'on applique à un moment, comme les
  Patterns ; GraphQL est une technologie, donc un **composant**.
- **Cartes** (détail et simulations : [cartes-set-1.md](../../produit/cartes-set-1.md#extension--api-first-eda-et-api-graphql-us-077-2026-10-25)) :
  - 72 **API First** — sort rare, coût 3 : piochez les deux premières cartes API de votre pioche, puis un de vos
    composants API gagne +1 attaque (le contrat d'abord, puis fournisseur et consommateurs en parallèle).
  - 73 **EDA** — sort épique, coût 3 : chacun de vos composants EDA inflige 1 dégât à un composant adverse tiré au
    hasard (un fait publié, chaque abonné réagit de son côté).
  - 74 **API GraphQL** — composant rare, coût 3, 2/3 : à la pose, piochez une carte par autre composant en jeu chez
    vous, 2 au plus (une requête, plusieurs sources).
- **Aucune capacité nouvelle** : les effets reprennent la pioche ciblée (API Hub), le renfort (OpenAPI), la pioche par
  composant en jeu (CDC) et les dégâts d'effet (Splitter).
- **Créatures** : un tisserin architecte qui tend le plan du nid avant que deux équipes en tissent chacune une moitié
  (72) ; un loup dont le hurlement en ondes violettes fait réagir chacun à sa façon les loups des crêtes voisines (73) ;
  un tamanoir gourmet qui pique d'une seule langue trois baies dans trois buissons et les réunit sur une assiette (74).
- **Boosters** : le tirage lit le catalogue ; 27 rares au lieu de 25 et 7 épiques au lieu de 6. Les collections
  référencent les cartes par numéro : rien ne change pour les cartes déjà obtenues.
- **Decks prêtés** inchangés : leur équilibre mesuré (US-064) reste valable.

## Notes

- Cartes demandées par le porteur du projet le 2026-10-24.
- Illustrations générées avec Gemini (ADR 0047), planche validée par le porteur du projet le 2026-10-26 ; originaux
  dans `originaux/72-api-first.jpeg`, `73-eda.jpeg`, `74-api-graphql.jpeg`. `npm run illustrations` relancé dans un
  worktree réécrivait les 284 fichiers existants avec d'autres octets (originaux ou `sharp` locaux différents de ceux
  de la dernière génération) : seuls les 12 fichiers des cartes 72 à 74 ont été gardés, et le manifeste régénéré
  à partir des fichiers présents (le test d'US-078 le vérifie).

## Journal

- 2026-10-24 — création, à la demande du porteur du projet.
- 2026-10-25 — affinage : conception proposée et validée par le porteur du projet (extension du set 1, 72 à 74),
  équilibre vérifié par simulation sur deux graines ; catalogue, effets, coups du bot, fiches fr et en, traductions,
  prompts d'illustration et tests.
- 2026-10-26 — livrée : cartes 72 à 74 (API First, EDA, API GraphQL) ajoutées au set 1 : effets, coups du bot,
  fiches et textes fr/en, illustrations Gemini, équilibre vérifié sur deux graines.
