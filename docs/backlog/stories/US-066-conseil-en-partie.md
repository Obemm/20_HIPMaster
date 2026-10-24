# US-066 — Un conseil à la demande, contre le bot

- **Epic** : EPIC-11
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-066-conseil-en-partie`

## Récit

En tant que **joueur qui découvre le jeu**, je veux **demander quel est le meilleur coup, et pourquoi** afin
d'**apprendre en jouant contre le bot plutôt qu'en lisant les règles**.

## Contexte

Les bots savent déjà choisir une action à partir de la seule vue d'un joueur, sans tricher (ADR 0004, 0013) : règles
simples de Batch de nuit (`packages/domain/src/combat/bot.ts`) et recherche d'Architecte ESB (`chercher`, `evaluer`
dans `bots-forts.ts`). Le même calcul peut conseiller le joueur humain. Le travail neuf consiste à **expliquer** le
coup en une phrase.

## Critères d'acceptation

- [x] **Étant donné** une partie contre le bot, **quand** je demande « Un conseil ? », **alors** l'écran met en
      évidence l'action recommandée (la carte à poser ; l'attaquant et sa cible ; le sort et ses cibles ; ou « Finir
      votre tour ») et l'explique en une phrase. Exemples : « Attaquez l'Adaptateur SAP : il a Garde, et votre API
      REST le détruit sans être détruite » ; « Posez Pub/Sub : c'est la carte la plus forte que votre Débit permet ».
- [x] **Étant donné** le conseil, **alors** il est calculé par le serveur à partir de ma seule vue : il ne révèle ni la
      main ni la pioche adverses. Route `GET /api/v1/parties/{id}/conseil`, contrat OpenAPI écrit avant le code,
      limitée en débit (US-047).
- [x] **Étant donné** l'option « Un conseil à chaque coup » (gardée par le navigateur), **alors** le conseil s'affiche
      sans le demander, pour les tout débutants.
- [x] **Étant donné** un duel, **alors** aucun conseil n'est proposé et l'API le refuse (décision du porteur du
      projet, 2026-10-23).
- [x] **Étant donné** un joueur simulé qui suit toujours le conseil, **alors** il bat Stagiaire au moins 85 % du
      temps et Batch de nuit au moins 45 % du temps (`npm run simuler`). Le conseil se calcule en moins de 200 ms.
- [x] Tests du domaine (explications), de l'API et de l'écran ; parcours e2e ; accessibilité (conseil annoncé aux
      lecteurs d'écran, au clavier).

## Notes

- Préférer un conseiller dont les décisions s'expliquent, quitte à jouer un peu moins fort qu'Agent autonome.
- Le conseil ne change pas la récompense de victoire.
- Choix retenus ([ADR 0040](../../decisions/0040-conseil-serveur-contre-bot.md)) :
  - **Conseiller** : `conseiller(vue)` dans le domaine (`combat/conseil.ts`) suit les règles de Batch de nuit
    (`bot.ts`, dont les règles sont désormais exportées) et explique la règle qui a choisi le coup : pose la plus
    forte ou seule possible, évolution, Migration, Outillage, sort (par son effet), attaque (victoire, SI sans
    protection, destruction en survivant à la riposte, échange favorable, Garde), décommissionnement (la carte qu'il
    permet de poser), fin de tour (attaques perdantes, rien d'utile). Un test vérifie qu'il choisit la même action que
    Batch de nuit à chaque coup.
  - **Mesure** (`npm run simuler`, 450 parties par mesure, graine 1) : un joueur qui suit toujours le conseil bat
    Stagiaire 89 % du temps et Batch de nuit 47 %. Le calcul prend moins d'une milliseconde.
  - **API** : `GET /api/v1/parties/{id}/conseil` renvoie `{ version, action, explication }`, 409 quand ce n'est pas
    au joueur de jouer, même propriété que la partie, limite `conseilPartie` de 300 par minute. Pas de route pour les
    duels : « l'API le refuse » prend la forme d'une route absente (404).
  - **Écran** : une ampoule « Un conseil ? » dans l'en-tête, contre le bot et pendant son tour seulement ; le conseil
    s'affiche au-dessus de « Finir mon tour », dans une zone `aria-live`, avec « Masquer le conseil » ; ce qu'il
    désigne (carte, attaquant et cible, SI, bouton de fin de tour) porte un pointillé doré et « conseillé » dans son
    nom accessible. Un conseil ne vaut que pour la version de la partie qui l'a produit.
  - **Option** « Un conseil à chaque coup » dans l'aide « ? » (contre le bot), gardée par le navigateur
    (`hipmaster.conseil-chaque-coup`, ADR 0032), désactivée par défaut.

## Journal

- 2026-10-23 — création, à la demande du porteur du projet ; conseil contre le bot seulement (sa décision).
- 2026-10-24 — affinée et commencée : choix notés ci-dessus (ADR 0040).
- 2026-10-24 — livrée : conseil à la demande contre le bot (ampoule, mise en évidence et explication), GET /parties/{id}/conseil calculé par le domaine sur les règles de Batch de nuit, option « Un conseil à chaque coup », jamais en duel (ADR 0040)
