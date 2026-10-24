# 0040 — Conseil calculé par le serveur, contre le bot seulement

- **Date** : 2026-10-24
- **Statut** : Acceptée
- **Référence Elis** : ADR-020 (design et sécurité REST v2 : contrat d'abord, limites, erreurs) — retenu

## Contexte

US-066 donne au joueur qui découvre le jeu un conseil à la demande : le meilleur coup du moment, et pourquoi, en une
phrase. Les bots savent déjà choisir une action à partir de la seule vue d'un joueur (ADR 0004, 0013). Il faut
décider où se calcule ce conseil, avec quelle logique, et où il est permis. Le porteur du projet a tranché le
2026-10-23 : un duel reste un face-à-face, sans conseil.

## Décision

- Le conseil est calculé par **le domaine** (`conseiller`, `packages/domain/src/combat/conseil.ts`), à partir de la
  seule vue du joueur : il ne voit ni la main ni la pioche adverses, et l'action conseillée est toujours une des
  actions légales de la vue.
- Il suit **les règles de Batch de nuit** (`bot.ts`), dont chaque choix s'explique en une phrase (poser la carte la
  plus forte, détruire en survivant à la riposte, Garde…), plutôt que la recherche d'Architecte ESB ou d'Agent
  autonome, plus forte mais qui ne se raconte pas. Un joueur qui le suit toujours bat Stagiaire 89 % du temps et Batch
  de nuit 47 % (simulation, `npm run simuler`).
- Le serveur l'expose par **`GET /api/v1/parties/{id}/conseil`** (contrat `apps/api/openapi/parties.yaml`) : même
  propriété que la partie (US-047), débit limité (300 par minute et par adresse), 409 quand ce n'est pas au joueur
  de jouer. Rien n'est écrit en base, et la récompense de victoire ne change pas.
- **Aucune route de conseil pour les duels** : `/duels/{id}/conseil` n'existe pas, et l'écran de duel n'affiche pas
  le bouton.
- Le front n'affiche que ce que le serveur renvoie : il met en évidence l'action et lit l'explication, sans jamais la
  jouer à la place du joueur. L'option « Un conseil à chaque coup » est une préférence du navigateur (ADR 0032).

## Alternatives envisagées

- **Calcul dans le front** avec le paquet du domaine : possible (le domaine est pur), mais le front n'a que la vue et
  ne doit tirer ni résoudre aucun coup ; le serveur fait foi (ADR 0004). Le serveur garde aussi la maîtrise de la
  règle « pas de conseil en duel ».
- **Conseil inclus dans chaque réponse de partie** : une requête de moins quand le conseil s'affiche à chaque coup,
  mais un calcul et un contrat alourdis pour tous les joueurs, qui ne le demandent presque jamais.
- **Conseiller fondé sur Agent autonome** : plus fort, mais son choix vient d'une évaluation chiffrée de positions ;
  l'expliquer en une phrase de joueur serait souvent faux ou creux.
- **Conseil aussi en duel** : écarté par le porteur du projet.

## Conséquences

- Le conseiller et Batch de nuit partagent leurs règles : un réglage de Batch de nuit change aussi le conseil, et un
  test vérifie qu'ils choisissent la même action à chaque coup.
- Avec « Un conseil à chaque coup », chaque action du joueur entraîne une lecture de plus, d'où la limite dédiée.
- Les phrases d'explication vivent dans le domaine, en français, comme les raisons de ne pas jouer (US-041, US-071).
