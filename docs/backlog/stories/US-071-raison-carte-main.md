# US-071 — Dire pourquoi une carte de la main ne se joue pas

- **Epic** : EPIC-04
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-071-raison-carte-main`

## Récit

En tant que **joueur**, je veux **savoir pourquoi une carte de ma main ne se joue pas maintenant** afin de **ne pas
rester bloqué devant une carte sans comprendre ce qu'il me faut pour la jouer**.

## Critères d'acceptation

- [x] **Étant donné** mon tour et une carte d'évolution en main (Apigee AI Gateway) sans sa carte d'origine sur mon
      plateau, **quand** je la sélectionne, **alors** son détail dit « Évolution d’Apigee API Gateway : posez d’abord
      Apigee API Gateway, puis faites-la évoluer. », au lieu du message générique d'aujourd'hui.
- [x] **Étant donné** mon tour, **quand** une carte de ma main n'est pas jouable, **alors** la vue de l'API dit
      pourquoi, par ordre de priorité : carte pas encore prise en charge par le moteur ; évolution sans son origine
      sur le plateau ; plateau plein (5 composants) pour un composant ; Débit insuffisant, avec le coût effectif
      (réductions comprises) et le Débit disponible (« Il vous faut 5 Débit, vous en avez 3. ») ; aucune cible
      possible pour un sort ou un incident. Une carte qui se joue autrement (Migration, Routage multi-modèles) est
      jouable : aucune raison n'est donnée.
- [x] **Étant donné** le tour de l'adversaire, **quand** je consulte une carte de ma main, **alors** la raison est
      « Ce n’est pas votre tour : attendez le vôtre pour jouer cette carte. » ; partie terminée, aucune raison n'est exposée.
- [x] La raison est calculée par le domaine (`vueDe`), sur le modèle de `sansAttaque` (US-041) ; l'écran ne fait que
      l'afficher (ADR 0004). Elle passe dans la vue des parties contre le bot et des duels : contrats OpenAPI
      (`parties.yaml`, `duels.yaml`) mis à jour d'abord, schéma Zod de la vue à jour (le champ n'est pas retiré à la
      sérialisation).
- [x] **Étant donné** mon tour, une carte injouable de la main reste lisible (pas de grisé) et porte une mention
      visible « Pas jouable » sous sa vignette ; la raison complète fait partie de la description accessible du
      bouton de la carte, et s'affiche dans son détail, au-dessus de ses actions (Décommissionner reste proposé).
- [x] Tests : domaine (chaque raison, dont l'évolution sans origine), API (parties et duels), écran ; un parcours
      e2e montre la raison d'une évolution sans origine ; `npm run check` et `npm run test:e2e` passent, audit
      axe-core compris.

## Notes

- Retour du porteur du projet le 2026-10-23 : impossible de jouer « Apigee AI Gateway » (n° 40). C'est une évolution
  d'« Apigee API Gateway » (n° 18) : elle ne se pose pas, elle se joue par « Faire évoluer … » quand l'origine est
  sur le plateau (`posesPossibles`). Le détail de la carte ne proposait que « Décommissionner », et le message
  générique (« Débit, plateau plein, ou carte pas encore jouable ») n'apparaissait même pas.
- Champ `injouable` (texte ou `null`) sur chaque carte de `vue.moi.main`, tant que la partie n'est pas terminée. Il
  se déduit des actions légales déjà calculées par `actionsPossibles` (une carte est jouable dès qu'une action
  `poser`, `evoluer`, `jouer`, `migrer` ou `router` la joue), puis de contrôles simples pour nommer l'obstacle :
  aucun calcul de cibles en plus, la vue reste aussi rapide pour les bots.
- `reconstituer` (vue → état, pour les bots) retire le champ, comme il retire `attaque` des composants.
- La mention « Pas jouable » porte la raison complète dans un texte `sr-only` (position absolue) : chaque carte de
  la main est `relative`, sans quoi ce texte sortait de la main qui défile et élargissait la page sur téléphone
  (débordement horizontal vu par les e2e mobiles, clics interceptés).
- Décommissionner n'est pas « jouer » : une carte qu'on ne peut que décommissionner est injouable, et sa raison
  s'affiche au-dessus du bouton « Décommissionner ».

## Journal

- 2026-10-23 — création, après le retour du porteur du projet sur Apigee AI Gateway ; statut « En cours ».
- 2026-10-23 — livrée : Chaque carte de la main porte, dans la vue de l'API (parties et duels), la raison pour laquelle elle ne se joue pas (injouable, calculée par vueDe) : évolution sans origine, plateau plein, Débit manquant (coût effectif), aucune cible, carte non prise en charge, tour adverse. L'écran affiche une mention « Pas jouable » sous la vignette, la raison dans la description accessible et dans le détail au-dessus des actions ; le message générique disparaît. Tests domaine, API, écran ; e2e d'Apigee AI Gateway sans son origine ; suite e2e 97/97.
