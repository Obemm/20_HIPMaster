# US-066 — Un conseil à la demande, contre le bot

- **Epic** : EPIC-11
- **Statut** : À affiner
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

- [ ] **Étant donné** une partie contre le bot, **quand** je demande « Un conseil ? », **alors** l'écran met en
      évidence l'action recommandée (la carte à poser ; l'attaquant et sa cible ; le sort et ses cibles ; ou « Finir
      votre tour ») et l'explique en une phrase. Exemples : « Attaquez l'Adaptateur SAP : il a Garde, et votre API
      REST le détruit sans être détruite » ; « Posez Pub/Sub : c'est la carte la plus forte que votre Débit permet ».
- [ ] **Étant donné** le conseil, **alors** il est calculé par le serveur à partir de ma seule vue : il ne révèle ni la
      main ni la pioche adverses. Route `GET /api/v1/parties/{id}/conseil`, contrat OpenAPI écrit avant le code,
      limitée en débit (US-047).
- [ ] **Étant donné** l'option « Un conseil à chaque coup » (gardée par le navigateur), **alors** le conseil s'affiche
      sans le demander, pour les tout débutants.
- [ ] **Étant donné** un duel, **alors** aucun conseil n'est proposé et l'API le refuse (décision du porteur du
      projet, 2026-10-23).
- [ ] **Étant donné** un joueur simulé qui suit toujours le conseil, **alors** il bat Stagiaire au moins 85 % du
      temps et Batch de nuit au moins 45 % du temps (`npm run simuler`). Le conseil se calcule en moins de 200 ms.
- [ ] Tests du domaine (explications), de l'API et de l'écran ; parcours e2e ; accessibilité (conseil annoncé aux
      lecteurs d'écran, au clavier).

## Notes

- Préférer un conseiller dont les décisions s'expliquent, quitte à jouer un peu moins fort qu'Agent autonome.
- ADR à écrire : conseil calculé par le serveur et refusé en duel (complète les ADR 0004 et 0020).
- Le conseil ne change pas la récompense de victoire.

## Journal

- 2026-10-23 — création, à la demande du porteur du projet ; conseil contre le bot seulement (sa décision).
