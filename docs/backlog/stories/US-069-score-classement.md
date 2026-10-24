# US-069 — Un score et un classement

- **Epic** : EPIC-07
- **Statut** : Faite
- **Priorité** : Could
- **Taille** : L
- **Branche** : `us-069-score-classement`

## Récit

En tant que **joueur**, je veux **un score qui reflète mes progrès et un classement entre collègues** afin d'**avoir
envie de revenir et de me comparer**.

## Critères d'acceptation

- [x] **Étant donné** la règle de score retenue (à définir avec le porteur du projet : victoires pondérées par le
      niveau du bot, cote de duel de type Elo, progression de la collection…), **alors** elle est écrite dans
      `docs/produit/regles.md` et calculée par le serveur, jamais par le front (ADR 0004).
- [x] **Étant donné** un joueur connecté, **alors** il voit son score et son rang ; un classement liste les joueurs
      par pseudo.
- [x] **Étant donné** un joueur qui ne veut pas apparaître, **alors** il peut se retirer du classement.
- [x] **Étant donné** les parties jouées avant le score, **alors** elles comptent, autant que l'historique le permet.
- [x] **Étant donné** la page de confidentialité, **alors** elle dit ce que les autres joueurs voient du score.

## Notes

- Demande du porteur du projet (2026-10-23). Questions ouvertes : quelles parties comptent (bot, duels), remise à
  zéro périodique ou non, prise en compte des parties guidées (non).
- Décision du porteur du projet (2026-10-24), parmi trois règles proposées (points seuls, cote unique, points + cote)
  : **points + cote de duel**, tout le monde classé avec retrait possible, rattrapage de l'historique
  ([ADR 0044](../../decisions/0044-score-et-cote-de-duel.md), [règles](../../produit/regles.md)).
- Choix retenus :
  - **Règle** (`packages/domain/src/score.ts`) : victoire contre le bot 1 / 2 / 3 / 5 points selon le niveau, duel
    gagné 5, duel nul 2 chacun, au plus 10 victoires comptées par jour UTC ; cote Elo départ 1000, K = 32, entre deux
    comptes encore présents. Sans remise à zéro.
  - **Base** (migration `0014_score_classement`) : registre `points` (une ligne par partie et par joueur, ce qui
    garantit une seule prise en compte), `joueurs.points`, `cote`, `duelsCotes`, `classe`, et `duels.scoreCompte`.
    Index du classement (joueurs classés par points) et des duels à compter.
  - **Quand** : la victoire contre le bot avec sa récompense ; le duel à sa première lecture une fois terminé.
    `rattraperScores` compte le reste dans l'ordre chronologique (victoires d'avant le score à 1 point, duels
    terminés en entier) : commande de migration avant chaque déploiement, purge de la nuit, démarrage de l'API de
    développement.
  - **API** (`openapi/classement.yaml`) : `GET /classement` (mon score, mon rang, les 100 premiers classés avec au
    moins un point, rangs partagés à égalité), `PUT /moi/classement` (se retirer, revenir).
  - **Écran** : page « Classement » (mon score, rang, cote ; case « Apparaître dans le classement » ; tableau des
    joueurs ; la règle en bref), tuile « Classement » sur l'accueil (« 12 points · 3e »). Pas d'onglet de plus dans
    la barre du téléphone (cinq onglets déjà).
  - **Confidentialité** : nouvelle section « Ce que les autres joueurs voient », score ajouté aux données gardées sans
    limite.
  - **Traduction** : le socle multilingue (EPIC-14) n'était pas sur `main` ; les nouvelles chaînes restent en
    français, à marquer avec le reste du site.

## Journal

- 2026-10-23 — création, notée pour plus tard à la demande du porteur du projet.
- 2026-10-24 — règle décidée avec le porteur du projet (ADR 0044), commencée.
- 2026-10-24 — livrée : score et classement : points selon le niveau du bot, duel 5, nul 2, 10 victoires comptées par jour, cote de duel Elo, sans remise à zéro, retrait possible, historique rattrapé (ADR 0044)
