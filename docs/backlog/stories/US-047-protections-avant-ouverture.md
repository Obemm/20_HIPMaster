# US-047 — Les protections indispensables avant l'ouverture

- **Epic** : EPIC-09
- **Statut** : Faite, sauf l'essai réel de `trustProxy`, à faire après le premier déploiement (US-050)
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

- [x] **Étant donné** la création de compte, la connexion par code, la création de partie et les routes de duels,
      **quand** une même adresse dépasse sa limite, **alors** l'API répond **429** au format Problem Details avec
      l'en-tête `Retry-After` ; les limites sont réglables et documentées dans les contrats OpenAPI.
- [ ] **Étant donné** l'API derrière Firebase Hosting et Cloud Run, **alors** `trustProxy` compte le bon nombre de
      relais, vérifié par un essai réel (l'adresse journalisée est celle du joueur et ne se falsifie pas par un
      `X-Forwarded-For` ajouté).
      _Fait : nombre de relais réglable (`PROXYS_DE_CONFIANCE`, obligatoire en production, 2 attendu), testé avec des
      en-têtes simulés. Reste l'essai réel, après le premier déploiement d'US-050 : procédure ci-dessous._
- [x] **Étant donné** un joueur qui régénère son code de récupération, **alors** toutes ses autres sessions sont
      fermées ; la page « Mon compte » le dit, et propose aussi « Déconnecter tous mes appareils » (devenu
      « Déconnecter mes autres appareils », voir les notes).
- [x] **Étant donné** une partie contre le bot lancée par un joueur connecté, **quand** une autre session (ou aucune)
      la lit ou y joue, **alors** l'API répond 404.
- [x] **Étant donné** les codes de récupération, **alors** leur empreinte est un HMAC-SHA-256 avec un secret fourni
      par Secret Manager en production (ADR 0017 complété par un ADR). Les jetons de session, aléatoires sur 256 bits,
      gardent leur SHA-256.
- [x] **Étant donné** une réponse qui contient un jeton, un code ou des données personnelles, **alors** elle porte
      `Cache-Control: no-store` ; toutes les réponses portent `X-Content-Type-Options: nosniff`.
- [x] La taille des corps de requête est limitée à 16 Ko. Tests d'API pour chaque point.

## Notes

- Le magasin de `@fastify/rate-limit` est propre à chaque instance : suffisant tant que Cloud Run tourne avec peu
  d'instances. Une limite globale demanderait Redis ou Cloud Armor (hors budget, ADR 0021).
- Le front doit comprendre le 429 (US-055).
- Décisions : [ADR 0025](../../decisions/0025-protections-api.md). Valeurs des limites dans les contrats OpenAPI et
  `apps/api/src/limites.ts` ; `LIMITES_DEBIT` les multiplie (ou `desactivees`), sans changer le code.
- « Déconnecter tous mes appareils » est devenu **« Déconnecter mes autres appareils »** : l'appareil qui le demande
  reste connecté (« Se déconnecter » est juste à côté). Tout fermer d'un geste ferait perdre son compte à un joueur qui
  n'a plus son code (ADR 0017).
- En plus de la limite de création, le dépôt en mémoire évince d'abord les parties anonymes : un afflux de parties
  sans compte ne fait plus perdre la sienne à un joueur connecté (ADR 0025).
- Le déploiement (US-050) fournit `CLE_CODES_RECUPERATION` (secret `cle-codes-recuperation`, créé par
  `scripts/gcp/infrastructure.sh`) et `PROXYS_DE_CONFIANCE=2` : sans eux, l'API refuse de démarrer.

## Vérifier l'adresse du joueur en production

À faire une fois US-047 et US-050 en ligne (le nom du service Cloud Run est fixé par US-050). Les commandes visent
toujours la configuration `gcloud` dédiée.

1. Noter son adresse publique : `curl -s https://api.ipify.org`.
2. Deux requêtes par Firebase Hosting, la seconde avec un maillon inventé :

   ```bash
   curl -sS https://hipmaster.web.app/api/v1/sante
   curl -sS -H 'X-Forwarded-For: 203.0.113.99' https://hipmaster.web.app/api/v1/sante
   ```

3. Lire l'adresse retenue par l'API pour ces deux requêtes :

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.message="incoming request" AND jsonPayload.req.url="/api/v1/sante"' --freshness=10m --limit=4 --format='value(timestamp, jsonPayload.req.remoteAddress)' --configuration=hipmaster
   ```

   Les deux lignes doivent montrer l'adresse de l'étape 1. Une adresse de Google (`35.…`, `130.211.…`,
   `2600:1900:…`) : il y a un relais de plus, passer `PROXYS_DE_CONFIANCE` à 3. L'adresse `203.0.113.99` : un relais
   de moins, la passer à 1. Redéployer, puis recommencer.

4. L'adresse `run.app` du service, appelée directement, laisse inventer l'adresse (ADR 0025) : le vérifier avec la
   même requête et un `X-Forwarded-For` inventé, puis essayer de la fermer :
   `gcloud run services update <service> --no-default-url --region=europe-west3 --configuration=hipmaster`.
   `https://hipmaster.web.app/api/v1/sante` doit toujours répondre ; sinon, revenir en arrière avec `--default-url`
   et noter ici que la limite demeure.
5. Cocher le critère et noter le résultat dans le journal ci-dessous.

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne.
- 2026-10-23 — affinée et commencée : ADR [0025](../../decisions/0025-protections-api.md), contrats OpenAPI d'abord.
- 2026-10-23 — livrée : limitation de débit par adresse (429 avec Retry-After, réglable par LIMITES_DEBIT), adresse du joueur derrière les relais (PROXYS_DE_CONFIANCE), codes de récupération sous HMAC (clé cle-codes-recuperation dans Secret Manager, créée par le script d'infrastructure), un nouveau code et « Déconnecter mes autres appareils » ferment les autres sessions, parties contre le bot liées à leur session, no-store et nosniff, corps de 16 Ko ; reste l'essai réel de trustProxy après le premier déploiement (US-050)
