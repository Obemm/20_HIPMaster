# 0034 — Hasard des parties : ChaCha20 à clé tirée par le serveur ; appariement sous verrou

- **Date** : 2026-10-24
- **Statut** : Acceptée
- **Révise** : [0013](0013-moteur-combat.md) (hasard à graine : le générateur change, la rejouabilité reste) et précise
  [0020](0020-duels-asynchrones.md) (adversaire au hasard)
- **Référence Elis** : aucune (le référentiel ne traite ni du hasard d'un jeu ni de l'appariement) ; ADR-020 (règles de
  conception et de sécurité des API REST) — retenu : le contrat OpenAPI décrit le comportement avant le code

## Contexte

La revue du 2026-10-22 (US-058) a relevé deux failles dans les duels, que la vision produit promet justes :

- **Hasard prévisible.** Le moteur (ADR 0013) utilise mulberry32, dont l'état tient sur 32 bits, et l'API tirait la
  graine d'un duel sur 31 bits. Le dépôt est public (ADR 0022) et les decks prêtés aussi : un joueur qui voit sa main
  de départ et ses premières pioches peut essayer les 2³¹ graines en quelques minutes, retrouver la bonne, puis voir
  la main adverse et toutes les pioches à venir. Un duel asynchrone lui laisse des jours. Les parties contre le bot
  (ADR 0030), qui rapportent des boosters, ont la même faiblesse.
- **Appariement « adversaire au hasard » (US-037).** Quand la file est vide, deux joueurs qui cherchent à quelques
  millisecondes d'écart ne voient pas le duel que l'autre est en train d'ouvrir : chacun ouvre le sien et attend
  l'autre. Un double clic ouvre de même deux duels pour un seul joueur. `SKIP LOCKED` empêche seulement deux joueurs
  de rejoindre le même duel. Vérifié sur PostgreSQL 18 : 10 recherches simultanées dans une file vide laissent
  plusieurs joueurs en attente, et 10 recherches simultanées d'un même joueur ouvrent plusieurs duels.

Contraintes : le domaine reste pur, sans dépendance à Node (ADR 0004) ; l'état d'une partie reste un JSON qui suffit à
la rejouer (ADR 0013) ; les duels en cours, créés avec mulberry32, doivent se terminer normalement ; les simulations
« bot contre bot » jouent des milliers de parties.

## Décision

### Hasard

- **ChaCha20** (RFC 8439) devient le générateur des parties jouées en ligne, duels et parties contre le bot. Son état,
  gardé dans `EtatPartie.alea`, est une **clé de 256 bits et un compteur de blocs** ; chaque tirage consomme un bloc
  (un mot de 32 bits, comme mulberry32 : `tirer`, `tirerIndex` et `melanger` ne changent pas d'usage). Retrouver la clé
  à partir des sorties revient à casser ChaCha20 : un joueur ne peut ni la deviner ni prévoir la suite.
- **La clé est tirée par `node:crypto`** (`randomBytes(32)`) au lancement du duel ou de la partie, côté serveur. Elle
  vit en base, dans l'état, et **n'est jamais envoyée** : la vue d'un joueur (`vueDe`) ne contient pas le générateur.
- **Implémentation dans le domaine**, en TypeScript pur (une soixantaine de lignes), vérifiée par le vecteur de test de
  la RFC 8439 et par le flux de clé d'OpenSSL.
- **Rejouable comme avant** : la même clé et les mêmes actions redonnent la même partie (ADR 0013 inchangé sur ce
  point). `creerPartie` accepte une graine entière (mulberry32) ou une clé de 8 mots (ChaCha20).
- **mulberry32 reste** pour les graines entières : simulations et tests (rapides et lisibles), et duels ou parties
  créés avant ce changement, qui se terminent avec leur générateur. Aucune donnée n'est migrée.

### Appariement

- **Les recherches d'adversaire passent une à une** : la transaction de `POST /duels/hasard` prend d'abord un **verrou
  consultatif de transaction** (`pg_advisory_xact_lock`, clé `hipmaster:appariement`), libéré à sa fin, même en cas
  d'échec. La recherche suivante voit alors le duel ouvert par la précédente : deux joueurs simultanés se retrouvent
  dans le même duel, un double clic renvoie le même duel ouvert. L'auto-appariement reste exclu (un joueur ne rejoint
  jamais son propre duel).
- Le `FOR UPDATE SKIP LOCKED` sur les candidats est gardé : un défi ouvert rejoint au même instant par son lien
  (`POST /duels/{id}/rejoindre`, qui ne prend pas ce verrou) est laissé de côté.

### Récompense contre un adversaire déjà affronté

- La règle d'US-038 (pas de booster pour une victoire par abandon ou forfait contre un adversaire déjà affronté le même
  jour) est évaluée **au jour de la fin du duel** : comptent les autres duels entre les deux joueurs créés ce jour-là
  (UTC), avant cette fin. Lire son résultat le lendemain ne la contourne plus, et le résultat ne dépend plus de la date
  de lecture.

## Alternatives envisagées

- **Un générateur rapide à 128 bits** (xoshiro128\*\*, sfc32) : l'essai exhaustif devient impossible, mais ces
  générateurs ne sont pas conçus contre un adversaire ; leur état se reconstruit par algèbre à partir de sorties
  suffisantes, et un duel en montre beaucoup. Écarté au profit d'un générateur dont c'est la propriété garantie.
- **Tirer le hasard à la demande dans `node:crypto`**, sans état : imprévisible, mais la partie ne serait plus
  rejouable, et le domaine dépendrait de Node (ADR 0004, 0013). Écarté.
- **HMAC-SHA-256 ou AES-CTR comme générateur** : aussi sûrs, mais il faudrait réécrire SHA-256 ou AES dans le domaine
  (le domaine n'a pas `node:crypto`), en plus long et plus lent ; ChaCha20 est fait d'additions, de rotations et de
  ou exclusifs sur 32 bits, simples en JavaScript.
- **Garder un bloc de 16 mots en réserve** dans l'état : 16 fois moins de calcul, mais un état plus gros et un cas de
  plus. Un bloc coûte quelques microsecondes et une partie en tire une quarantaine : écarté tant que la mesure ne le
  justifie pas.
- **Migrer les duels en cours vers ChaCha20** : il faudrait inventer une clé et la partie changerait en cours de
  route. Ils finissent avec mulberry32 ; les duels expirent en 72 heures sans coup (ADR 0020).
- **Index unique « un seul duel ouvert par joueur »** : il empêche le double clic, pas les deux joueurs qui s'attendent
  mutuellement ; et les duels ouverts expirés (lus comme expirés, jamais supprimés avant US-054) le bloqueraient.
  Écarté au profit du verrou, qui règle les deux cas.
- **`SERIALIZABLE` sur la transaction d'appariement** : correct aussi, mais les conflits se traduisent en erreurs à
  rejouer, que PGlite (une seule connexion) ne reproduit pas en test. Le verrou fait attendre au lieu d'échouer.

## Conséquences

- Un joueur ne peut plus calculer la main adverse ni les pioches à venir, même avec le code source ; un litige reste
  rejouable côté serveur à partir de l'état en base.
- L'état d'une partie grossit d'une centaine d'octets (la clé) ; chaque tirage calcule un bloc ChaCha20. Mesuré le
  2026-10-24 sur 200 parties « bot contre bot » : une quarantaine de tirages par partie, et aucun écart de durée
  mesurable avec mulberry32 (environ 15 ms par partie entière dans les deux cas).
- Les recherches d'adversaire sont sérialisées pour toute l'API : elles ne durent que quelques requêtes et restent
  rares (60 par heure et par adresse, ADR 0025). Le verrou vaut aussi à plusieurs instances, puisqu'il est pris dans
  la base ; il suppose une connexion directe, déjà imposée par l'ADR 0023 (pas de PgBouncer en mode transaction).
- Les simulations et les tests qui passent une graine entière gardent mulberry32 et leurs résultats.
- La règle de l'adversaire déjà affronté ne dépend plus de l'horloge de lecture.
