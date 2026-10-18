# 0013 — Moteur de combat : état sérialisable, actions et hasard à graine

- **Date** : 2026-10-18
- **Statut** : Acceptée
- **Référence Elis** : aucune (logique de jeu, non couverte par le référentiel)

## Contexte

US-010 crée le moteur qui applique les règles du combat ([regles.md](../produit/regles.md), ADR 0010). Le même
moteur servira au bot (US-011), à l'API qui fait foi (US-012), à l'écran de partie (US-013, par l'API) et aux
simulations « bot contre bot ». L'ADR 0004 impose une logique pure, au hasard injecté, sans dépendance.

## Décision

- **État sérialisable** : une partie est un objet JSON simple (`EtatPartie`) : joueurs, cartes par identifiant
  d'instance et numéro de carte, tour, joueur actif, issue, journal, et **l'état du générateur de hasard**. Il se
  stocke, se transmet et se compare tel quel.
- **Réducteur pur** : `appliquer(etat, action)` renvoie `{ ok: true, etat }` ou `{ ok: false, erreur }` avec un code
  d'erreur typé ; il travaille sur une copie (`structuredClone`) et ne modifie jamais l'état reçu.
  `creerPartie(decks, graine)` crée l'état initial.
- **Actions explicites** : `poser`, `evoluer`, `decommissionner`, `attaquer`, `finirTour`. Les étapes automatiques
  (pioche, Débit, entretien, effets de début de tour) sont jouées par le moteur à chaque changement de tour.
- **Hasard à graine** : un générateur pseudo-aléatoire déterministe (mulberry32) dont l'état vit dans `EtatPartie`.
  **La même graine et les mêmes actions redonnent exactement la même partie** : parties rejouables, tests et
  simulations reproductibles, et rejeu côté serveur pour enquêter sur un litige.
- **Journal d'événements** : chaque changement notable (pioche, pose, attaque, dégâts, destruction, fin de partie)
  est ajouté au journal, qui alimente l'affichage pas à pas et l'annonce aux lecteurs d'écran. Un événement peut être
  réservé à un joueur (carte piochée, Supervision).
- **Vue par joueur** : `vueDe(etat, joueur)` ne donne que ce que ce joueur a le droit de voir (main et pioche
  adverses masquées, événements privés filtrés). L'API ne renverra jamais l'état complet.
- **Actions possibles** : `actionsPossibles(etat)` énumère toutes les actions légales du joueur actif. Le bot choisit
  dans cette liste, l'écran ne propose qu'elle.

## Alternatives envisagées

- **Objets mutables avec méthodes** (classes `Partie`, `Joueur`) : plus naturel à écrire, mais difficile à
  sérialiser, à comparer et à rejouer, et facile à modifier par erreur depuis l'extérieur.
- **Bibliothèque d'immutabilité** (Immer) : confortable, mais ajoute une dépendance au domaine pour un gain modeste ;
  `structuredClone` suffit pour des états de quelques kilo-octets.
- **`Math.random` injecté** (comme `tirerRarete`) : suffisant pour un tirage isolé, mais ne permet pas de rejouer une
  partie entière ni de sauvegarder l'état du hasard avec la partie.

## Conséquences

- Une copie complète par action : négligeable pour des parties de 40 cartes et quelques dizaines d'actions, à
  mesurer dans les simulations (US-011).
- Toute nouvelle capacité s'ajoute comme une fonction du moteur, testée seule, sans toucher aux autres couches.
- Le hasard ne doit **jamais** venir d'ailleurs que du générateur de l'état, sinon la rejouabilité est perdue.
