# US-010 — Moteur de combat : règles de base

- **Epic** : EPIC-04
- **Statut** : Prête
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-010-moteur-combat`

## Récit

En tant que **porteur du projet**, je veux **un moteur qui applique les règles du combat de façon sûre et rejouable**
afin que **le bot, l'API et l'écran de partie reposent tous sur la même vérité**.

## Critères d'acceptation

### Modèle et principes (`packages/domain`)

- [ ] L'état d'une partie est typé : pour chaque joueur, le SLA du SI (20), la pioche, la main, le plateau
      (5 emplacements), la défausse et le Débit ; le numéro du tour, le joueur actif, le gagnant éventuel et un
      journal d'événements.
- [ ] Le moteur est fait de **fonctions pures** : `creerPartie(decks, graine)` et `appliquer(etat, action)`, qui
      renvoie un nouvel état ou une erreur typée pour une action illégale, sans jamais modifier l'état reçu. Le
      hasard vient d'un générateur à graine : **la même graine et les mêmes actions redonnent la même partie**.
- [ ] `actionsPossibles(etat)` liste toutes les actions légales du joueur actif (pour le bot et l'écran).
- [ ] `vueDe(etat, joueur)` renvoie ce qu'un joueur a le droit de voir : la main et la pioche adverses sont masquées
      (seul leur nombre de cartes reste visible).

### Règles de base ([regles.md](../../produit/regles.md))

- [ ] Mise en place : decks mélangés, 4 cartes en main, premier joueur tiré au sort ; il ne pioche pas à son premier
      tour.
- [ ] Début de tour : pioche (main de 8 cartes au plus, la carte en trop part à la défausse ; pioche vide : pas de
      pioche), Débit égal au numéro de tour du joueur (10 au plus).
- [ ] Actions : poser un composant (coût payé, 5 emplacements au plus), poser une évolution à la place de sa carte
      d'origine, décommissionner une carte une fois par tour, attaquer, finir son tour.
- [ ] Attaque : un composant ne peut attaquer qu'une fois par tour et pas le tour où il est posé (sauf une évolution,
      si sa carte d'origine le pouvait) ; contre un composant, riposte et destruction à 0 PV ; contre le SI, perte de
      SLA sans riposte ; tant qu'un composant adverse a **Garde**, il doit être attaqué en premier.
- [ ] Fin de partie : SLA à 0 (victoire), ou après 20 tours, le plus de SLA gagne (égalité : partie nulle).

### Capacités prises en charge

- [ ] Garde, Batch, Hub, Point unique, Quotas, Connecteur (N), Diffusion, Réactif, Non conforme, Sur site, File
      durable et Supervision sont appliquées. La liste des cartes que le moteur sait jouer entièrement (sans effet
      propre ni capacité encore inconnue) est exposée : `CARTES_PRISES_EN_CHARGE`.

### Qualité

- [ ] Chaque règle et chaque capacité a son test ; une partie complète est rejouée à l'identique depuis sa graine et
      sa liste d'actions ; `npm run check` passe.
- [ ] Les précisions de règles tranchées en codant (pioche vide, main pleine…) sont reportées dans
      [regles.md](../../produit/regles.md).

## Notes

- **ADR à écrire au début de la story** : architecture du moteur (état immuable, actions, journal d'événements,
  générateur à graine), dans la ligne de l'ADR 0004.
- Hors périmètre : effets propres des sorts, incidents et cartes à effet (US-014), capacités IA (Autonome,
  Orchestration, Outillage, Délégation, Contexte, Garde-fous, Asynchrone, Cache sémantique, Routage multi-modèles),
  Migration et Vétéran (sans objet tant qu'aucune carte IA ne cible).

## Journal

- 2026-10-18 — création (découpage d'EPIC-04).
