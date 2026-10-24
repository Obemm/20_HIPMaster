# US-067 — Une première partie guidée

- **Epic** : EPIC-11
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-067-premiere-partie-guidee`

## Récit

En tant que **collègue qui découvre HIPMaster**, je veux **une première partie guidée pas à pas** afin de
**comprendre les règles en 5 minutes, sans rien lire avant**.

## Critères d'acceptation

- [x] **Étant donné** un visiteur qui n'a jamais joué, **quand** il arrive sur l'accueil ou l'écran « Jouer »,
      **alors** « Apprendre à jouer (5 min) » lui est proposé. Il reste accessible depuis l'aide « Comment jouer ? ».
- [x] **Étant donné** la partie guidée, **alors** elle oppose des decks d'initiation fixes au Stagiaire, avec une
      graine fixe : la main de départ et les pioches sont connues d'avance (moteur rejouable, ADR 0013).
- [x] **Étant donné** chaque étape (le Débit et la pose ; l'attaque du SI ; la riposte entre composants ; la Garde ;
      la défausse pour gagner du Débit ; la fin du tour ; la victoire), **alors** une bulle explique quoi faire, met en
      évidence la zone concernée, attend le bon geste et refuse poliment un autre geste.
- [x] **Étant donné** la fin de la partie guidée, **alors** l'écran félicite le joueur et propose une partie contre
      Stagiaire avec le conseil activé (US-066). La partie guidée ne rapporte pas de booster.
- [x] Bulles annoncées aux lecteurs d'écran, utilisables au clavier et en 375 px ; parcours e2e qui suit la partie
      guidée jusqu'au bout.

## Notes

- À faire après US-059 (plateau qui tient dans un écran de téléphone), pour ne pas refaire les bulles.
- Le scénario (decks, graine, étapes) est une donnée versionnée du domaine, comme le catalogue (ADR 0011).
- Choix retenus ([ADR 0041](../../decisions/0041-partie-guidee-graine-fixe.md)) :
  - **Scénario** (`packages/domain/src/combat/partie-guidee.ts`) : deck « Initiation » du joueur, deck du bot fait
    de petits composants et de deux Répertoires de dépôt (Garde), graine 1262 (le joueur commence), contre
    Stagiaire. 12 étapes guidées sur trois tours (poser, finir, attaquer le SI, décommissionner LLM pour poser deux
    cartes, finir, Garde, riposte, SI de nouveau accessible, poser, finir), puis une 13e, libre. Un test rejoue le
    scénario : chaque action attendue est légale à son étape, la Garde est là quand la bulle en parle, et la partie
    se gagne ensuite au conseil au tour 11 (25 actions), soit bien moins de 5 minutes.
  - **API** : `POST /api/v1/parties` avec `guidee: true` (deck et niveau ignorés) ; chaque réponse porte `guide`,
    l'étape du moment (l'étape n attend la n-ième action, la version de la partie). Aucune récompense.
  - **Écran** : la bulle « Étape n / 13 » au-dessus de « Finir mon tour », annoncée aux lecteurs d'écran ; ce
    qu'elle désigne porte le pointillé doré du conseil (US-066) ; un autre geste est refusé poliment (« Pas tout de
    suite : suivez l'étape… »), sans requête ; « Passer le guide » à tout moment. L'aide ne s'ouvre pas d'elle-même
    dans la partie guidée, et le conseil n'y est proposé qu'à la dernière étape, libre.
  - **Entrées** : sur l'écran « Jouer », « Première partie ? Apprendre à jouer (5 min) » en tête tant que le guide
    n'est ni fini ni passé, puis « Revoir les règles en jouant » en bas ; un lien depuis l'accueil (même condition)
    et depuis l'aide « Comment jouer ? ». Fini ou passé se garde dans le navigateur
    (`hipmaster.partie-guidee-finie`, ADR 0032).
  - **Fin** : « Bravo, vous savez jouer ! », sans booster, et « Jouer contre Stagiaire avec le conseil », qui active
    « Un conseil à chaque coup » et ouvre l'écran « Jouer » (Stagiaire présélectionné).
  - **Écart** : le serveur ne refuse pas une action hors scénario (le refus est fait par l'écran) : une partie
    d'apprentissage n'a pas d'enjeu, et qui passe le guide continue librement contre Stagiaire.

## Journal

- 2026-10-23 — création, à la demande du porteur du projet (« un mode tuto »).
- 2026-10-24 — affinée et commencée : choix notés ci-dessus (ADR 0041).
- 2026-10-24 — livrée : partie guidée : decks et graine fixes contre Stagiaire, 12 étapes servies par l'API qui attendent le bon geste et refusent poliment les autres, passables, puis jeu libre jusqu'à la victoire, sans booster (ADR 0041)
