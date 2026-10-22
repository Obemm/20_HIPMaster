# 0025 — Protections de l'API avant l'ouverture : limitation de débit, sessions révocables, codes sous HMAC

- **Date** : 2026-10-23
- **Statut** : Acceptée
- **Complète** : [0017](0017-compte-invite.md) (compte invité), qui renvoyait la limitation de débit « avant toute
  ouverture publique » ; précise [0014](0014-parties-en-memoire.md) (propriétaire et éviction des parties en mémoire)
- **Référence Elis** : ADR-020 (règles de conception et de sécurité des API REST) — retenu : contrat écrit avant le
  code, taille des corps bornée (413). Chez Elis, Apigee limite le débit devant les API ; hors du SI, sans Apigee
  (ADR 0005), l'API s'en charge elle-même. Page « Secrets must be stored in a key vault » (non opposable, à l'état
  TODO) — retenue comme inspiration : la clé des codes vit dans Secret Manager. ADR-010 et ADR-034 (Okta) — toujours
  écartés (ADR 0017).

## Contexte

HIPMaster va être joignable sur Internet, pour des collègues sur invitation (ADR 0021). La revue du 2026-10-22 a
relevé, avant l'ouverture (US-047) :

- **aucune limitation de débit** : 1 000 créations de parties anonymes évincent toutes les parties en cours du dépôt
  en mémoire (ADR 0014), et la création de comptes ou de duels est illimitée ;
- **`trustProxy` n'est pas réglé** : derrière Firebase Hosting et Cloud Run, toutes les requêtes semblent venir du
  même relais, si bien qu'une limite par adresse s'appliquerait à tous les joueurs à la fois ;
- **les sessions ne se révoquent pas** : régénérer son code de récupération laisse ouvertes les sessions obtenues avec
  l'ancien, qui a pu fuiter ;
- **une partie contre le bot lancée par un joueur connecté** se lit et se joue par quiconque connaît son identifiant ;
- **l'empreinte des codes de récupération est un SHA-256 sans secret** : 60 bits se parcourent hors ligne si la base
  fuit, et tous les comptes tomberaient d'un coup. Aucun compte n'existe encore en production : c'est le moment de
  changer ;
- les corps de requête sont acceptés jusqu'à 1 Mo, et aucune réponse ne dit au navigateur de ne pas garder un jeton
  ou un code en cache.

Contraintes : une seule instance Cloud Run (ADR 0021) ; budget nul, donc ni Cloud Armor ni Redis ; des joueurs souvent
derrière la même adresse de sortie, celle de leur bureau ; une base Neon qui doit pouvoir dormir.

## Décision

### Limitation de débit, par adresse

- **`@fastify/rate-limit`**, magasin en mémoire de l'instance : une fenêtre fixe par route et par adresse IP (une
  adresse IPv6 compte pour son préfixe /64). Au-delà : **429** au format Problem Details, avec `Retry-After` (en
  secondes) et les en-têtes `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`.
- Valeurs de production, pensées pour quelques dizaines de joueurs dont beaucoup partagent l'adresse d'un bureau, et
  documentées dans les contrats OpenAPI :

  | Routes                                                                     | Limite par adresse | Ce qu'elle protège                                   |
  | -------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------- |
  | `POST /joueurs`                                                            | 30 par heure       | création de comptes en série                         |
  | `POST /sessions`                                                           | 10 par minute      | essais de codes de récupération                      |
  | `POST /parties`                                                            | 20 par minute      | le dépôt en mémoire (1 000 parties, 30 min de vie)   |
  | `POST /parties/{id}/actions`                                               | 300 par minute     | le processeur : chaque fin de tour fait jouer le bot |
  | `POST /duels`, `POST /duels/hasard`                                        | 60 par heure       | la base : chaque défi est une ligne                  |
  | `POST /duels/{id}/actions`, `/rejoindre`, `/abandon`, `DELETE /duels/{id}` | 300 par minute     | le processeur et la base                             |
  | `GET /duels/{id}`, `GET /moi/duels`                                        | 600 par minute     | interrogés toutes les 3 s et 60 s (ADR 0020)         |

  Avec 20 parties par minute, une adresse seule ne remplit jamais le dépôt : ses parties expirent avant la
  millième.

- **Réglables sans changer le code** : `LIMITES_DEBIT` multiplie toutes les limites (`2` les double) ou les désactive
  (`desactivees`). Par défaut : facteur 1 en production, désactivées ailleurs : le développement et les parcours e2e
  créent des dizaines de comptes depuis la même adresse. Les tests de l'API les vérifient avec des valeurs réduites.
- **Le dépôt des parties évince d'abord les parties anonymes** : au plafond, il retire la partie sans compte la moins
  récemment jouée, et seulement à défaut la partie d'un joueur connecté. Un afflux de parties anonymes, d'où qu'il
  vienne, ne fait plus perdre sa partie à un joueur connecté.

### L'adresse du joueur derrière les relais

- **`PROXYS_DE_CONFIANCE`** : le nombre de relais qui précèdent l'API et ajoutent chacun l'adresse de leur
  interlocuteur à `X-Forwarded-For`. L'API retient l'adresse située juste avant eux (option `trustProxy` de Fastify) :
  ce qu'un client ajoute lui-même à l'en-tête reste plus à gauche et n'est jamais lu.
- **Valeur attendue en production : 2**, Firebase Hosting puis le frontal de Cloud Run. Elle est **obligatoire en
  production** : oubliée, tous les joueurs auraient l'adresse du frontal de Google, donc une seule limite pour tous.
  Ailleurs, elle vaut 0 (l'adresse de la connexion).
- Elle sera vérifiée par un essai réel après le premier déploiement (US-050), selon la procédure de la story US-047 :
  l'adresse journalisée doit être celle du joueur, même avec un `X-Forwarded-For` inventé.

### Sessions et parties

- **Régénérer son code de récupération ferme toutes les autres sessions** du compte, dans la même transaction : une
  session ouverte avec un code qui a fuité ne survit pas à son remplacement.
- **« Déconnecter mes autres appareils »** (`DELETE /sessions/autres`) ferme toutes les sessions du compte sauf celle
  de l'appareil qui le demande ; celle-ci se ferme avec « Se déconnecter ». Tout fermer d'un seul geste ferait perdre
  son compte à un joueur qui n'a plus son code (ADR 0017).
- **Une partie contre le bot lancée par un joueur connecté appartient à la session qui l'a créée** : le dépôt garde en
  mémoire l'empreinte de son jeton, et répond 404 à une autre session comme à une requête sans jeton, sans dire que la
  partie existe. Aucune lecture de base de plus par action. Une partie anonyme reste à qui connaît son identifiant
  (ADR 0014).

### Empreintes des codes

- **Codes de récupération : HMAC-SHA-256** avec une clé secrète de 256 bits, préfixée de l'usage du code
  (`recuperation:`) : la même clé pourra servir à d'autres codes sans confusion possible. Sans la clé, une copie de la
  base ne permet plus d'essayer des codes hors ligne.
- **La clé vient de `CLE_CODES_RECUPERATION`**, alimentée en production par le secret `cle-codes-recuperation` de
  Secret Manager. Le script d'infrastructure la tire au hasard et la range sans jamais l'afficher, et seul le compte de
  l'API peut la lire (ADR 0024). En production, l'API **refuse de démarrer** sans elle (32 caractères au moins) ; en
  développement et en tests, une clé fixe et publique sert par défaut.
- **Jetons de session : SHA-256, inchangé.** 256 bits aléatoires ne se devinent pas, même hors ligne : un HMAC
  n'ajouterait rien, alors que cette empreinte se calcule à chaque requête.

### Réponses

- **`Cache-Control: no-store`** sur toutes les réponses de l'API, sauf celles d'une route qui déclare sa propre
  politique de cache (le catalogue, public, pourra être mis en cache : US-057). Jetons, codes et données des joueurs
  ne restent ainsi dans aucun cache. **`X-Content-Type-Options: nosniff`** sur toutes les réponses.
- **Corps de requête : 16 Ko au plus** (413 au-delà). Le plus gros corps légitime, une action de partie, pèse moins de
  1 Ko.

## Alternatives envisagées

- **Cloud Armor** (pare-feu et limites devant l'API) : demande un équilibreur de charge, ≈ 18 $ par mois (ADR 0021).
  Écarté.
- **Magasin de compteurs partagé** (Redis, table en base) : inutile avec une seule instance ; une table réveillerait
  la base Neon à chaque requête et l'empêcherait de dormir. Écarté.
- **Limite par compte plutôt que par adresse** : l'inscription, la connexion et les parties anonymes n'ont pas de
  compte, et chaque jeton inventé aurait son propre compteur. Écartée.
- **Une seule limite pour toute l'API** : un seul abuseur bloquerait tout le monde. Écartée.
- **Hachage lent des codes** (scrypt, Argon2) : coûteux à chaque connexion, et une porte ouverte à l'épuisement du
  processeur ; avec 60 bits d'entropie, le HMAC suffit à rendre les essais hors ligne impossibles sans la clé.
  Écarté.
- **Clé tirée de `DATABASE_URL` ou du mot de passe de la base** : une fuite de la base et une fuite de son adresse vont
  souvent de pair. Écartée.
- **« Déconnecter tous mes appareils », celui-ci compris** : un joueur sans code perdrait son compte. Écarté au profit
  de « mes autres appareils », suivi au besoin de « Se déconnecter ».
- **Vérifier en base la session à chaque coup d'une partie contre le bot** : une requête de plus par action, pour un
  gain nul : un navigateur déconnecté oublie son jeton. Écarté.
- **Lire l'adresse dans `X-Forwarded-For` en entier** (le premier maillon) ou dans un en-tête propre à un CDN : le
  client les écrit lui-même. Écarté.

## Conséquences

- Un joueur trop pressé reçoit un 429 et le délai d'attente, que le front explique (US-055). Si des collègues d'un
  même bureau se gênent, `LIMITES_DEBIT` se relève sans changer le code.
- Les compteurs repartent de zéro à chaque démarrage de l'instance (déploiement, arrêt à zéro) : sans importance pour
  des fenêtres d'une minute ou d'une heure.
- Un abuseur doté de nombreuses adresses (un bloc IPv6 entier, par exemple) passe entre les mailles : les invitations
  (US-048), puis les parties gardées en base (US-052), restent les vraies protections.
- `PROXYS_DE_CONFIANCE` dépend de l'hébergement : à revérifier si la chaîne de relais change. Tant que l'adresse
  `run.app` du service reste joignable directement, un `X-Forwarded-For` inventé par ce chemin fausse l'adresse
  retenue : la procédure de vérification essaie de désactiver cette adresse.
- Changer la clé des codes invalide tous les codes de récupération, mais aucune session : à ne faire qu'en cas de
  fuite, en invitant les joueurs à régénérer leur code depuis un appareil connecté. Les bases de développement
  existantes sont dans ce cas : leurs codes d'avant ce changement ne fonctionnent plus.
- Le déploiement (US-050) fournit `CLE_CODES_RECUPERATION` (secret `cle-codes-recuperation`) et
  `PROXYS_DE_CONFIANCE=2` ; sans eux, la nouvelle révision ne démarre pas et l'ancienne continue de servir.
