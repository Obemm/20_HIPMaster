# 0019 — Boosters : tirage serveur, recharge calculée à la lecture

- **Date** : 2026-10-18
- **Statut** : Acceptée
- **Référence Elis** : ADR-032 (ConfigCat pour les feature flags) — écarté : les règles de distribution sont des
  règles du jeu, versionnées dans le domaine comme le catalogue (ADR 0011)

## Contexte

US-023 donne des boosters aux joueurs connectés : 5 à la création du compte, puis un booster gratuit toutes les
10 minutes, dans la limite d'un stock de 10. Chaque booster contient 5 cartes qui rejoignent la collection. Le
serveur fait foi (aucun tirage dans le front, ADR 0004), et un joueur ne doit pas pouvoir ouvrir deux fois le même
booster en envoyant deux requêtes simultanées. L'API n'a ni tâche planifiée ni file de messages.

## Décision

- **Le tirage est une fonction pure du domaine** (`ouvrirBooster`, `packages/domain/src/booster.ts`) : une rareté
  selon `CHANCES_BOOSTER`, puis une carte au hasard dans cette rareté. Le hasard est injecté ; l'API fournit un hasard
  cryptographique (`node:crypto`), pour qu'on ne puisse pas prédire les tirages.
- **La recharge n'est pas une tâche de fond** : la base garde un stock et l'instant d'où court la prochaine recharge
  (`joueurs.boosters`, `joueurs.recharge_depuis`). Le stock réel se recalcule à chaque lecture (`stockA`, fonction
  pure) ; stock plein, l'horloge de recharge est remise à l'instant présent, de sorte qu'ouvrir un booster depuis un
  stock plein relance un délai de 10 minutes entier.
- **L'ouverture est une transaction** qui verrouille la ligne du joueur (`SELECT … FOR UPDATE`), décompte le stock,
  tire les cartes et les ajoute à la collection (`collection` : joueur, numéro de carte, exemplaires).
- Les règles (`REGLES_BOOSTERS` : bienvenue, intervalle, plafond) sont des constantes du domaine ; l'API accepte des
  règles, une horloge et un hasard injectés, pour les tests.
- La collection référence les cartes par leur numéro ; la table provisoire `cartes` est retirée (ADR 0011).

## Alternatives envisagées

- **Tâche planifiée qui crédite les stocks** : une écriture par joueur toutes les 10 minutes, même pour les joueurs
  absents, et un ordonnanceur à héberger ; le calcul à la lecture donne le même résultat sans rien faire tourner.
- **Tirage dans le front** : contraire à ADR 0004, et triche triviale.
- **Contrôle optimiste** (mise à jour conditionnée à l'ancien stock, avec reprise) : correct aussi, mais plus de
  code que le verrou d'une ligne, sans gain à cette échelle.
- **Réglages dans un outil de feature flags** (ADR-032 Elis) : utile pour une campagne temporaire, superflu tant que
  les valeurs changent au rythme des versions.

## Conséquences

- Aucune infrastructure en plus ; le stock affiché est toujours exact, au déploiement près.
- Changer les valeurs de recharge demande une PR, comme toute règle du jeu.
- La recharge dépend de l'horloge du serveur et de celle de la base (instant de création du compte) : elles doivent
  rester synchronisées, ce qui va de soi sur un hébergement géré.
