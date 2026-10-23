# 0026 — Le second joueur reçoit +1 Débit à son premier tour

- **Date** : 2026-10-22
- **Statut** : Acceptée
- **Référence Elis** : aucune (règle de jeu, non couverte par le référentiel)

## Contexte

L'[ADR 0010](0010-combat-plateau.md) fixe la ressource du combat : le **Débit**, +1 par tour, 10 au plus. Le joueur
qui commence est tiré au sort ; sa seule contrepartie est de ne pas piocher à son premier tour. Elle ne suffit pas :
il pose et attaque un tour plus tôt, et garde cette avance toute la partie.

Mesure par simulation (US-064, 360 parties par ligne, decks prêtés croisés, chaque joueur contre lui-même) :

| Joueurs         | Victoires du premier | Victoires du second |
| --------------- | -------------------- | ------------------- |
| Profil débutant | 71 %                 | 29 %                |
| Batch de nuit   | 63 %                 | 36 %                |
| Architecte ESB  | 66 %                 | 34 %                |
| Agent autonome  | 58 %                 | 41 %                |

Un débutant qui joue en second contre Batch de nuit ne gagne que 8 % de ses parties. La règle vaut aussi pour les
duels entre joueurs ([ADR 0020](0020-duels-asynchrones.md)) : un joueur ne doit pas perdre d'avance parce que le
tirage l'a fait jouer en second.

## Décision

Le joueur qui joue en second reçoit **+1 Débit à son premier tour** : 2 au lieu de 1. Ensuite, la règle de
l'ADR 0010 s'applique sans changement (+1 par tour, 10 au plus, le Débit non dépensé est perdu) : il reçoit donc 2,
puis 2, 3, 4… comme le premier joueur.

- Le moteur l'applique dans `debuterTour` (`packages/domain/src/combat/tour.ts`) : la règle vaut pour toutes les
  parties, contre le bot comme en duel, sans rien changer à l'API ni aux bots, qui lisent leur Débit dans leur vue.
- Le malus de Facture de tokens (2 Débit de moins au prochain tour) se retire du total, bonus compris.
- Cet ADR **complète** l'ADR 0010 sans le remplacer.

## Alternatives envisagées

- **Une carte de plus pour le second joueur** : essayée sur une copie du moteur, elle égalise presque les bots mais
  pas les débutants (70 % pour le premier, 32 % pour le second), qui ne savent pas encore tirer parti d'une carte de
  plus quand le Débit leur manque.
- **Une carte « pièce » qui rapporte 1 Débit une fois, quand on veut** (sur le modèle de Hearthstone) : plus souple,
  mais c'est une carte et une décision de plus à expliquer aux débutants, et une action de plus à apprendre aux bots,
  pour un effet voisin.
- **+1 Débit à chaque tour du second joueur** : trop fort, l'avantage changerait de camp.
- **Ne rien changer** : écarté, l'écart mesuré (jusqu'à 71 % contre 29 %) décide trop de parties avant le premier
  coup.

## Conséquences

- Les parties redeviennent équitables entre le premier et le second joueur ; la part de victoires de chacun est
  mesurée pour chaque niveau par `npm run simuler` (tableaux dans [cartes-set-1.md](../produit/cartes-set-1.md)),
  à surveiller à chaque rééquilibrage.
- Les règles ([regles.md](../produit/regles.md)) et l'aide « Comment jouer ? » de l'écran l'expliquent.
- Une partie commencée avant la règle se poursuit normalement : seul un second joueur qui n'a pas encore joué son
  premier tour reçoit le bonus. Rejouée avec le nouveau moteur à partir de sa graine et de ses actions
  ([ADR 0013](0013-moteur-combat.md)), une partie d'avant la règle ne redonnerait pas le même résultat ; aucune
  partie n'est rejouée de cette façon aujourd'hui.
