# US-047 — Les protections indispensables avant l'ouverture

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-047-protections-avant-ouverture`

## Récit

En tant que **porteur du projet**, je veux **que l'API résiste aux abus simples et protège les comptes** afin
qu'**un script ou une fuite de code ne gâche pas le jeu de tout le monde**.

## Contexte

Revue du 2026-10-22 ([revue](../../revues/2026-10-22-revue-mise-en-ligne.md)) :

- aucune limitation de débit, alors que l'ADR 0017 la demandait « avant toute ouverture publique ». Exemple : 1 000
  créations de parties anonymes (1,5 ms de calcul chacune) évincent toutes les parties en cours du dépôt en mémoire
  (plafond de l'ADR 0014), et les joueurs reçoivent un 404 en pleine partie ;
- `trustProxy` n'est pas réglé : derrière le frontal Google, toutes les requêtes semblent venir de la même adresse ;
- régénérer son code de récupération ne ferme pas les autres sessions : une session ouverte avec un code qui a fuité
  reste valide à vie ;
- une partie contre le bot lancée par un joueur connecté se lit et se joue par quiconque connaît son identifiant ;
- l'empreinte des codes de récupération est un SHA-256 sans secret : si la base fuyait, tous les comptes
  s'attaqueraient d'un coup. Aucun compte n'existant encore en production, c'est le moment de changer ;
- corps de requête limités à 1 Mo, quand 16 Ko suffisent.

## Critères d'acceptation

- [ ] **Étant donné** la création de compte, la connexion par code, la création de partie et les routes de duels,
      **quand** une même adresse dépasse sa limite, **alors** l'API répond **429** au format Problem Details avec
      l'en-tête `Retry-After` ; les limites sont réglables et documentées dans les contrats OpenAPI.
- [ ] **Étant donné** l'API derrière Firebase Hosting et Cloud Run, **alors** `trustProxy` compte le bon nombre de
      relais, vérifié par un essai réel (l'adresse journalisée est celle du joueur et ne se falsifie pas par un
      `X-Forwarded-For` ajouté).
- [ ] **Étant donné** un joueur qui régénère son code de récupération, **alors** toutes ses autres sessions sont
      fermées ; la page « Mon compte » le dit, et propose aussi « Déconnecter tous mes appareils ».
- [ ] **Étant donné** une partie contre le bot lancée par un joueur connecté, **quand** une autre session (ou aucune)
      la lit ou y joue, **alors** l'API répond 404.
- [ ] **Étant donné** les codes de récupération, **alors** leur empreinte est un HMAC-SHA-256 avec un secret fourni
      par Secret Manager en production (ADR 0017 complété par un ADR). Les jetons de session, aléatoires sur 256 bits,
      gardent leur SHA-256.
- [ ] **Étant donné** une réponse qui contient un jeton, un code ou des données personnelles, **alors** elle porte
      `Cache-Control: no-store` ; toutes les réponses portent `X-Content-Type-Options: nosniff`.
- [ ] La taille des corps de requête est limitée à 16 Ko. Tests d'API pour chaque point.

## Notes

- Le magasin de `@fastify/rate-limit` est propre à chaque instance : suffisant tant que Cloud Run tourne avec peu
  d'instances. Une limite globale demanderait Redis ou Cloud Armor (hors budget, ADR 0021).
- Le front doit comprendre le 429 (US-055).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne.
