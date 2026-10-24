# 0040 — Partie guidée : une graine fixe et des étapes servies par l'API

- **Date** : 2026-10-24
- **Statut** : Acceptée
- **Référence Elis** : ADR-020 (design et sécurité REST v2 : contrat d'abord) — retenu

## Contexte

US-067 guide la première partie d'un débutant, étape par étape (poser, attaquer le SI, la Garde, la riposte,
décommissionner, finir son tour), en moins de 5 minutes. Pour que chaque bulle dise la vérité (« le bot a posé
Répertoire de dépôt, qui a Garde »), la partie doit être connue d'avance. Or chaque partie reçoit une clé de hasard
tirée par le serveur (ADR 0034), et le front ne calcule aucune règle (ADR 0004).

## Décision

- **Une graine fixe, pour la seule partie guidée** : `POST /api/v1/parties` avec `guidee: true` crée la partie à
  partir de decks d'initiation fixes (le joueur, le bot) et de la graine `GRAINE_PARTIE_GUIDEE`, contre Stagiaire.
  Le moteur étant rejouable (ADR 0013), la main, les pioches et les coups du bot sont toujours les mêmes tant que le
  joueur suit les étapes. Toutes les autres parties gardent leur clé tirée (ADR 0034).
- **Le scénario est une donnée versionnée du domaine** (`packages/domain/src/combat/partie-guidee.ts`, comme le
  catalogue, ADR 0011) : decks, graine, et pour chaque étape un titre, un texte et l'action attendue. Un test rejoue
  le scénario et vérifie que chaque action attendue est légale au moment voulu, que la Garde apparaît à son étape, et
  que la partie se gagne ensuite en suivant le conseil (ADR 0039).
- **L'étape du moment est servie par l'API** dans la réponse de la partie (`guide`) : l'étape n attend la n-ième
  action du joueur, c'est-à-dire la version de la partie (ADR 0030). Le front affiche la bulle, met en évidence ce
  qu'elle désigne et refuse poliment un autre geste ; il ne déduit rien des règles.
- La partie guidée se reconnaît à son deck (`initiation`), et **ne rapporte aucun booster**.
- Ce qui revient au joueur reste dans son navigateur (ADR 0032) : avoir fini ou passé le guide, pour ne plus le
  proposer en premier.

## Alternatives envisagées

- **Partie ordinaire, bulles déclenchées par la situation** (« quand une Garde apparaît… ») : pas de graine fixe,
  mais certaines notions n'arrivent jamais, ou dans le désordre, et la partie peut durer 20 tours.
- **Étapes écrites dans le front** : plus simple, mais le scénario se séparerait des decks et de la graine qu'il
  suppose, et ne pourrait pas être vérifié par le test du domaine.
- **Le serveur refuse les actions hors scénario** : plus strict, mais une partie d'apprentissage n'a pas d'enjeu ; le
  refus poli du front suffit, et le joueur qui passe le guide continue librement.

## Conséquences

- Changer une carte d'un deck d'initiation, Stagiaire ou le moteur peut décaler le scénario : son test le signale.
- La graine de la partie guidée est publique (le dépôt l'est, ADR 0022) : sans conséquence, la partie ne rapporte
  rien.
- Un joueur qui s'écarte du scénario (étapes passées) joue une partie ordinaire contre Stagiaire, sans bulle.
