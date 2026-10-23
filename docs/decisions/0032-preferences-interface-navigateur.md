# 0032 — Préférences d'interface gardées par le navigateur

- **Date** : 2026-10-23
- **Statut** : Acceptée
- **Référence Elis** : ADR-032 (ConfigCat pour les feature flags) — écarté : il s'agit d'un choix du joueur, pas d'une
  bascule de fonctionnalité pilotée par l'équipe

## Contexte

Le lot 2 de confort sur téléphone ajoute de petites préférences d'interface : l'aide « Comment jouer ? » ne s'ouvre
d'elle-même qu'à la première partie (US-059), et les coups de pouce avant « Finir mon tour » se désactivent (US-065).
Ces choix doivent tenir d'une visite à l'autre, y compris pour un visiteur sans compte, qui peut jouer contre le bot.
Le site n'a ni cookie ni traceur, et la session API se charge en parallèle d'une page de confidentialité (US-053).

## Décision

- Les préférences d'interface sont gardées dans le **`localStorage` du navigateur**, sous des clés préfixées
  `hipmaster.` (comme le jeton de session, ADR 0017). Elles ne sont jamais envoyées à l'API.
- Un seul service Angular (`PreferencesService`) les lit et les écrit, et les expose en signals. Toute lecture ou
  écriture refusée (navigation privée stricte, stockage plein) est ignorée : la préférence vaut alors pour la visite.
- Seules des préférences sans conséquence sur le jeu vont là : rien de ce que le serveur décide (ADR 0004).

## Alternatives envisagées

- **Préférences dans le compte, en base** : suivraient le joueur d'un appareil à l'autre, mais exigent un compte,
  une route d'API et une migration pour des réglages mineurs ; à reconsidérer si les préférences se multiplient.
- **Cookie** : envoyé à chaque requête sans utilité pour le serveur, et soumis au bandeau de consentement qu'on évite.
- **Ne rien retenir** : l'aide se rouvrirait à chaque partie, ce que la revue du 2026-10-22 reproche justement.

## Conséquences

- Préférences propres à chaque navigateur : un joueur sur deux appareils revoit l'aide une fois sur chacun.
- La page de confidentialité (US-053) peut les citer comme stockage local strictement fonctionnel.
- Les tests unitaires et e2e partent d'un stockage vide : l'aide s'ouvre d'elle-même, ce qu'il faut prévoir dans les
  parcours (ou la marquer comme vue avant le premier chargement).
