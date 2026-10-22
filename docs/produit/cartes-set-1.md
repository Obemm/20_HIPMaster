# Set 1 — « De FTP aux agents » (brouillon)

Brouillon de travail : statistiques **provisoires**, à équilibrer par simulations « bot contre bot ». La version
jouable est décrite en données versionnées dans `packages/domain/src/set-1.ts` (US-008, ADR 0011), qui fait foi.
Règles et capacités : [regles.md](regles.md).

**Repère d'équilibrage** : un composant commun sans capacité vaut environ `attaque + PV = 2 × coût + 1` ; chaque
capacité retire 1 à 2 points.

**Composition** : 71 cartes — 4 légendaires, 6 épiques, 25 rares, 36 communes (64 dans les tableaux, plus 7 incidents
complémentaires).

## Fichiers & Batch (8)

| N°  | Carte                     | Type      | Rareté     | Coût | Att/PV | Capacités / effet                                                                                      | En vrai                                  |
| --- | ------------------------- | --------- | ---------- | ---- | ------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1   | FTP                       | Composant | Légendaire | 3    | 5/4    | Batch, Vétéran, Non conforme                                                                           | Officiellement interdit. Officieusement… |
| 2   | SFTP                      | Composant | Rare       | 3    | 3/4    | Migration                                                                                              | FTP chiffré, progressivement remplacé    |
| 3   | EDI                       | Composant | Rare       | 4    | 5/5    | Batch                                                                                                  | Échanges normés entre partenaires        |
| 4   | Fichier CSV               | Composant | Commune    | 1    | 2/1    | —                                                                                                      | Le format universel, séparateur variable |
| 5   | Fichier à positions fixes | Composant | Commune    | 2    | 2/3    | —                                                                                                      | « Le montant est en colonnes 47 à 52. »  |
| 6   | Cron                      | Composant | Commune    | 2    | 1/3    | Au début de votre tour, un de vos composants Batch peut attaquer même s'il a attaqué au tour précédent | Planificateur des traitements de nuit    |
| 7   | Répertoire de dépôt       | Composant | Commune    | 2    | 1/4    | Garde                                                                                                  | Là où les fichiers attendent             |
| 8   | Fichier `.ok` témoin      | Composant | Commune    | 1    | 1/2    | Vos cartes sont immunisées contre Fichier vide à 3 h du matin                                          | Prouve que le fichier est complet        |

## Messagerie & ESB (9)

| N°  | Carte                               | Type      | Rareté  | Coût | Att/PV | Capacités / effet                             | En vrai                                            |
| --- | ----------------------------------- | --------- | ------- | ---- | ------ | --------------------------------------------- | -------------------------------------------------- |
| 9   | webMethods Integration Server 10.15 | Composant | Épique  | 5    | 4/7    | Hub, Point unique, Sur site                   | L'ESB historique d'Elis, sur site                  |
| 10  | Universal Messaging                 | Composant | Rare    | 3    | 2/4    | File durable                                  | La messagerie de webMethods                        |
| 11  | MWS – My webMethods Server          | Composant | Rare    | 3    | 1/4    | Supervision                                   | Administration et supervision. « La page charge… » |
| 12  | MQSeries                            | Composant | Rare    | 3    | 3/4    | File durable                                  | L'ancêtre des files de messages                    |
| 13  | Adaptateur SAP                      | Composant | Rare    | 4    | 3/5    | Garde                                         | Le passage obligé vers l'ERP                       |
| 14  | webMethods Designer                 | Composant | Commune | 2    | 1/2    | Quand il est posé, piochez une carte Patterns | L'atelier de développement des flows               |
| 15  | Flow service                        | Composant | Commune | 1    | 1/2    | —                                             | L'unité de traitement de webMethods                |
| 16  | Adaptateur JDBC                     | Composant | Commune | 2    | 2/3    | —                                             | Lire et écrire en base                             |
| 17  | SOAP / WSDL                         | Composant | Commune | 3    | 3/4    | —                                             | Le service web d'avant REST                        |

## API (8)

| N°  | Carte               | Type      | Rareté  | Coût | Att/PV | Capacités / effet                                             | En vrai                             |
| --- | ------------------- | --------- | ------- | ---- | ------ | ------------------------------------------------------------- | ----------------------------------- |
| 18  | Apigee API Gateway  | Composant | Épique  | 4    | 2/7    | Garde, Quotas                                                 | La passerelle API d'Elis            |
| 19  | Apigee API Hub      | Composant | Rare    | 2    | 1/3    | Quand il est posé, piochez une carte API ou IA agentique      | Le catalogue des API                |
| 20  | OAuth2              | Composant | Rare    | 2    | 1/3    | Vos composants API sont immunisés contre Certificat expiré    | Délégation d'autorisation par jeton |
| 21  | Rate limiting       | Sort      | Rare    | 1    | —      | Un composant adverse ne peut pas attaquer à son prochain tour | Limiter le nombre d'appels          |
| 22  | API REST            | Composant | Commune | 2    | 3/2    | —                                                             | Ressources, verbes HTTP, JSON       |
| 23  | OpenAPI             | Composant | Commune | 1    | 1/2    | Quand il est posé, un de vos composants API gagne +1 attaque  | Le contrat d'une API REST           |
| 24  | Portail développeur | Composant | Commune | 3    | 2/3    | Connecteur (1)                                                | Là où les consommateurs s'abonnent  |
| 25  | Webhook             | Composant | Commune | 2    | 2/3    | —                                                             | L'API qui rappelle                  |

## iPaaS (5)

| N°  | Carte              | Type                                             | Rareté     | Coût | Att/PV | Capacités / effet                | En vrai                                               |
| --- | ------------------ | ------------------------------------------------ | ---------- | ---- | ------ | -------------------------------- | ----------------------------------------------------- |
| 26  | webMethods.io      | Évolution de webMethods Integration Server 10.15 | Légendaire | 5    | 5/7    | Hub, Connecteur (2)              | L'intégration en mode iPaaS, sans serveur à maintenir |
| 27  | Connecteur ERP     | Composant                                        | Rare       | 3    | 2/4    | Connecteur (1)                   | Connecteur prêt à l'emploi                            |
| 28  | Connecteur SaaS    | Composant                                        | Commune    | 2    | 2/2    | Connecteur (1)                   | Brancher une application cloud en minutes             |
| 29  | Workflow low-code  | Composant                                        | Commune    | 2    | 2/3    | —                                | Un flux dessiné plutôt que codé                       |
| 30  | Mapping de données | Sort                                             | Commune    | 1    | —      | Un de vos composants gagne +1 PV | Transformer un format en un autre                     |

## Événementiel (EDA) (8)

| N°  | Carte               | Type      | Rareté  | Coût | Att/PV | Capacités / effet                                                            | En vrai                                              |
| --- | ------------------- | --------- | ------- | ---- | ------ | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| 31  | Solace Event Mesh   | Composant | Épique  | 5    | 3/6    | Diffusion                                                                    | Le maillage d'événements d'Elis                      |
| 32  | Solace Event Portal | Composant | Rare    | 2    | 1/3    | Quand il est posé, piochez une carte EDA                                     | Le catalogue des événements                          |
| 33  | Event broker        | Composant | Rare    | 4    | 3/5    | Réactif                                                                      | Reçoit, stocke et distribue les événements           |
| 34  | CDC                 | Composant | Rare    | 3    | 2/3    | Quand il est posé, piochez une carte par composant Fichiers en jeu chez vous | Capturer les changements d'une base                  |
| 35  | Pub/Sub             | Composant | Commune | 3    | 2/3    | Diffusion                                                                    | Un éditeur, plusieurs abonnés                        |
| 36  | Topic               | Composant | Commune | 1    | 1/2    | Réactif                                                                      | L'adresse hiérarchique d'un événement                |
| 37  | File d'attente      | Composant | Commune | 2    | 1/4    | File durable                                                                 | Garde les messages tant qu'ils ne sont pas consommés |
| 38  | AsyncAPI            | Composant | Commune | 1    | 0/2    | Quand il est posé, un de vos composants EDA gagne +1 attaque                 | Le contrat d'une API événementielle                  |

## IA agentique (14)

| N°  | Carte                      | Type                           | Rareté     | Coût | Att/PV | Capacités / effet                                                                 | En vrai                                         |
| --- | -------------------------- | ------------------------------ | ---------- | ---- | ------ | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| 39  | Solace Agent Mesh          | Évolution de Solace Event Mesh | Légendaire | 6    | 4/7    | Diffusion, Orchestration, Asynchrone ; vos agents gagnent Délégation et Outillage | Les agents branchés sur l'event mesh (A2A, MCP) |
| 40  | Apigee AI Gateway          | Évolution d'Apigee API Gateway | Légendaire | 5    | 3/8    | Garde, Quotas, Garde-fous, Cache sémantique, Routage multi-modèles                | La future passerelle IA d'Elis                  |
| 41  | LLM                        | Composant                      | Épique     | 5    | 6/4    | —                                                                                 | Le modèle de langage                            |
| 42  | Agent                      | Composant                      | Rare       | 4    | 4/3    | Autonome                                                                          | Un LLM qui agit avec des outils                 |
| 43  | Orchestrateur multi-agents | Composant                      | Rare       | 5    | 3/5    | Orchestration                                                                     | Répartit le travail entre agents                |
| 44  | Serveur MCP                | Composant                      | Rare       | 3    | 2/3    | Outillage                                                                         | Expose des outils et des données aux IA         |
| 45  | Agent Card (A2A)           | Composant                      | Rare       | 3    | 2/3    | Délégation                                                                        | Un agent se présente à un autre                 |
| 46  | RAG                        | Composant                      | Rare       | 3    | 2/3    | Contexte                                                                          | Chercher avant de répondre                      |
| 47  | Chain of thought           | Sort                           | Rare       | 2    | —      | Piochez 2 cartes                                                                  | Raisonner étape par étape                       |
| 48  | Human-in-the-loop          | Sort                           | Rare       | 2    | —      | Le prochain incident joué contre vous n'a aucun effet                             | Un humain valide avant d'agir                   |
| 49  | Base vectorielle           | Composant                      | Commune    | 2    | 1/4    | Vos agents ont +1 PV                                                              | Retrouver des textes par le sens                |
| 50  | Fenêtre de contexte        | Composant                      | Commune    | 2    | 0/5    | Garde                                                                             | Ce que le modèle peut lire d'un coup            |
| 51  | Prompt système             | Sort                           | Commune    | 2    | —      | Un de vos agents gagne +2 attaque                                                 | Les consignes permanentes du modèle             |
| 52  | Few-shot                   | Sort                           | Commune    | 1    | —      | Un de vos composants IA gagne +1 attaque et +1 PV                                 | Apprendre par l'exemple                         |

## Patterns (6)

| N°  | Carte                | Type | Rareté  | Coût | Capacités / effet                                                         | En vrai                                    |
| --- | -------------------- | ---- | ------- | ---- | ------------------------------------------------------------------------- | ------------------------------------------ |
| 53  | Dead Letter Queue    | Sort | Épique  | 3    | Remettez en jeu un composant de votre défausse avec 1 PV                  | Là où vont les messages en échec           |
| 54  | Circuit Breaker      | Sort | Rare    | 2    | Votre SI ne perd aucun SLA jusqu'à votre prochain tour                    | Couper les appels vers un service en panne |
| 55  | Content-Based Router | Sort | Commune | 1    | Infligez 2 dégâts au composant adverse de votre choix                     | Router selon le contenu du message         |
| 56  | Splitter             | Sort | Commune | 2    | Infligez 1 dégât à chaque composant adverse                               | Découper un message en plusieurs           |
| 57  | Idempotent Consumer  | Sort | Commune | 1    | Annulez Doublon ; sinon piochez une carte                                 | Traiter deux fois sans effet de bord       |
| 58  | Retry                | Sort | Commune | 1    | Un de vos composants qui a attaqué peut attaquer de nouveau, et perd 1 PV | Réessayer, avec modération                 |

## Bestiaire (6, plus 7 incidents à numéroter)

| N°  | Carte                 | Type     | Rareté  | Coût | Effet                                                                                                      |
| --- | --------------------- | -------- | ------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| 59  | Prompt injection      | Incident | Épique  | 4    | **IA** — Un agent adverse attaque aussitôt une cible de votre choix dans son propre camp (composant ou SI) |
| 60  | Mot de passe en clair | Incident | Rare    | 2    | Visez un composant Fichiers adverse : détruit si c'est FTP, sinon il subit 2 dégâts                        |
| 61  | Certificat expiré     | Incident | Rare    | 2    | Un composant API adverse perd ses capacités et ne peut pas attaquer à son prochain tour                    |
| 62  | Couplage fort         | Incident | Rare    | 3    | Liez deux composants adverses : quand l'un subit des dégâts, l'autre aussi                                 |
| 63  | Hallucination         | Incident | Rare    | 2    | **IA** — Un composant IA adverse attaque une cible tirée au hasard, dans n'importe quel camp               |
| 64  | Message poison        | Incident | Commune | 2    | Détruisez un composant adverse de coût 2 ou moins                                                          |

Incidents communs complémentaires, numérotés de 65 à 71 dans les données (US-008) :
**Timeout** (1 — un composant adverse ne peut pas attaquer à son prochain tour), **Doublon** (1 — le prochain dégât
subi par un composant adverse est doublé), **Fichier vide à 3 h du matin** (1 — la prochaine attaque d'un composant
Batch adverse n'inflige rien), **Encodage cassé** (1 — 2 dégâts à un composant Fichiers ou ESB), et les incidents IA
**Contexte saturé** (1 — un composant IA adverse perd ses capacités jusqu'à la fin de son prochain tour),
**Boucle d'agents** (2 — un ou deux agents adverses ne peuvent pas attaquer à leur prochain tour) et **Facture de tokens**
(1 — l'adversaire a 2 Débit de moins à son prochain tour).

## Points à trancher pendant l'équilibrage

- **FTP** est peut-être trop forte pour une légendaire à 3 de Débit malgré Non conforme : simulations à faire.
- Les cartes **Autonomes** sans Orchestration sont imprévisibles : vérifier qu'elles restent intéressantes à jouer.

## Équilibrage des decks prêtés (US-011, 2026-10-18)

`npm run simuler -- 400 1` : 400 parties par duel, bot « Batch de nuit » des deux côtés, en alternant les places.
Résultats confirmés avec la graine 1000 (écarts de 1 à 5 points).

| Deck A   | Deck B   | Victoires A | Victoires B | Nulles | Finies par SLA | Tours moyens |
| -------- | -------- | ----------- | ----------- | ------ | -------------- | ------------ |
| Héritage | Héritage | 52 %        | 47 %        | 2 %    | 69 %           | 17.2         |
| Héritage | Moderne  | 46 %        | 53 %        | 2 %    | 64 %           | 17.7         |
| Héritage | Hybride  | 47 %        | 52 %        | 1 %    | 68 %           | 17.2         |
| Moderne  | Moderne  | 48 %        | 51 %        | 1 %    | 59 %           | 17.9         |
| Moderne  | Hybride  | 44 %        | 53 %        | 3 %    | 62 %           | 17.6         |
| Hybride  | Hybride  | 48 %        | 51 %        | 2 %    | 69 %           | 17.2         |

**Avant rééquilibrage** (première version des decks, 200 parties par duel) : Moderne gagnait 64 % contre Héritage et
82 % contre Hybride.

**Diagnostic**, par le taux de victoire du camp qui pose chaque carte (600 parties) : les cartes bon marché qui font
piocher (Portail développeur 78 %, Connecteur ERP 77 %, Webhook 76 %) et l'Event broker (75 %) donnaient l'avantage à
Moderne ; les cartes mortes d'Hybride le plombaient (Fenêtre de contexte 28 %, sans attaque ; Fichier CSV 33 % ;
LLM 33 %, cher et fragile face à la riposte).

**Rééquilibrage** (composition des decks seulement, aucune statistique de carte modifiée) :

- Moderne : Apigee API Gateway 2 → 1, Event broker 2 → 1, Workflow low-code 1 → 2, File d'attente 1 → 2.
- Hybride : LLM 2 → 1, Fenêtre de contexte 2 → 0, et ajout d'un Adaptateur SAP, d'un MQSeries et d'un Webhook.

**Lecture** : tous les duels restent entre 42 et 57 % ; les miroirs sont proches de 50/50, donc l'avantage du
premier joueur est faible. 60 à 74 % des parties se terminent par un SLA à 0, vers le 17e tour sur 20. Héritage est
désormais le deck le plus faible, de peu (42 à 47 %) : à surveiller.

### Mise à jour du 2026-10-18 : sorts et incidents (US-014)

Les sorts et les incidents sont jouables. Chaque deck prêté en intègre quelques-uns de son univers :

- **Héritage** : Dead Letter Queue, Retry, Message poison (à la place d'un Fichier CSV, d'un Fichier à positions
  fixes et du Flow service ; un MQSeries de plus) ;
- **Moderne** : Content-Based Router, Message poison (à la place d'un Workflow low-code et d'une File d'attente) ;
- **Hybride** : Chain of thought, Couplage fort, Doublon, Facture de tokens (à la place d'un Fichier CSV, d'un Topic,
  de l'Adaptateur JDBC et de la File d'attente).

`npm run simuler -- 400 1` (graine 1000 entre parenthèses quand elle diffère de plus de 2 points) :

| Deck A   | Deck B   | Victoires A | Victoires B | Nulles | Finies par SLA | Tours moyens |
| -------- | -------- | ----------- | ----------- | ------ | -------------- | ------------ |
| Héritage | Héritage | 50 %        | 48 %        | 2 %    | 75 %           | 16.6         |
| Héritage | Moderne  | 53 %        | 46 %        | 2 %    | 69 % (65 %)    | 17.4         |
| Héritage | Hybride  | 55 %        | 43 % (45 %) | 2 %    | 70 % (74 %)    | 17.1         |
| Moderne  | Moderne  | 52 %        | 47 %        | 1 %    | 58 % (51 %)    | 18.1         |
| Moderne  | Hybride  | 51 % (47 %) | 48 % (51 %) | 2 %    | 58 %           | 17.7         |
| Hybride  | Hybride  | 52 %        | 47 %        | 2 %    | 64 %           | 17.1         |

Une première composition (sorts d'immobilisation et Circuit Breaker pour Moderne, Splitter pour Héritage) faisait
retomber Moderne à 31–38 % : les sorts de destruction pèsent plus que ceux qui immobilisent. Tous les duels restent
entre 43 et 55 %.

### Mise à jour du 2026-10-18 : les 71 cartes jouables (US-020)

Avec les capacités IA et Migration, toutes les cartes sont jouables, et les decks prêtés en profitent :

- **Moderne** : Apigee AI Gateway et Solace Agent Mesh (les évolutions de ses deux cartes phares), à la place du
  Content-Based Router et du Message poison ;
- **Hybride** : SFTP, Agent, RAG et Serveur MCP, à la place de l'Adaptateur JDBC, du SOAP / WSDL, du Couplage fort
  et du Doublon (un Fichier CSV et un Topic de moins, une API REST de plus) ;
- **Héritage** : inchangé.

Une première version (SFTP dans Héritage, évolutions IA à la place de composants de Moderne) donnait 58 à 66 % à
Héritage contre Moderne : les évolutions restent mortes tant que leur carte d'origine n'est pas en jeu.

`npm run simuler -- 400 1` (graine 1000 entre parenthèses quand elle diffère de plus de 2 points) :

| Deck A   | Deck B   | Victoires A | Victoires B | Nulles | Finies par SLA | Tours moyens |
| -------- | -------- | ----------- | ----------- | ------ | -------------- | ------------ |
| Héritage | Héritage | 50 %        | 48 %        | 2 %    | 75 %           | 16.6         |
| Héritage | Moderne  | 51 %        | 49 %        | 1 %    | 70 %           | 17.3         |
| Héritage | Hybride  | 50 % (56 %) | 48 % (44 %) | 3 %    | 76 %           | 16.7         |
| Moderne  | Moderne  | 48 %        | 50 %        | 2 %    | 61 %           | 17.9         |
| Moderne  | Hybride  | 46 % (45 %) | 52 % (54 %) | 2 %    | 67 %           | 17.4         |
| Hybride  | Hybride  | 49 % (55 %) | 50 % (43 %) | 2 %    | 66 %           | 17.2         |

Tous les duels entre decks différents restent entre 44 et 56 %.

## Niveaux du bot (US-021, 2026-10-18)

`npm run simuler -- 100 101` : 100 parties par deck prêté et par duel (300 au total), même deck des deux côtés pour ne
mesurer que le jeu.

| Niveau A       | Niveau B       | Victoires A | Victoires B | Nulles |
| -------------- | -------------- | ----------- | ----------- | ------ |
| Batch de nuit  | Architecte ESB | 45 %        | 55 %        | 0 %    |
| Batch de nuit  | Agent autonome | 36 %        | 63 %        | 1 %    |
| Architecte ESB | Agent autonome | 42 %        | 58 %        | 0 %    |

Les écarts restent modestes : le tirage des cartes pèse lourd dans une partie de 20 tours. Une recherche plus
profonde, ou qui simule le tour adverse, s'est révélée moins forte (voir la story US-021).

## Un bot battable et une partie équitable (US-064, 2026-10-22)

Deux constats : aucun niveau n'était vraiment facile, et commencer donnait un gros avantage. Trois changements :
le second joueur reçoit **1 Débit de plus à son premier tour** ([ADR 0026](../decisions/0026-debit-du-second-joueur.md)),
un niveau facile, **Stagiaire**, passe devant les trois autres (Batch de nuit devient moyen, Architecte ESB difficile,
Agent autonome expert), et Architecte ESB étudie **4 actions candidates au lieu de 3** (voir la story US-064).

`npm run simuler -- 200 1` (graine 1001 entre parenthèses quand elle diffère de plus de 2 points). Les deux
dernières mesures croisent les decks prêtés : 200 parties pour chacune des 9 paires de decks, soit 1 800 parties par
ligne. Le **profil débutant** joue comme quelqu'un qui découvre le jeu : il pose sa carte la plus chère tant qu'il
peut, attaque le SI dès qu'il peut (sinon la première cible permise), sans sort, incident ni décommissionnement.
« Avant » : les mêmes mesures sur le moteur sans la règle, avec les niveaux d'US-021 (graine 1).

**Premier et second joueur**, chaque joueur contre lui-même (les nulles font le complément) :

| Joueurs         | Avant : premier | Avant : second | Après : premier | Après : second |
| --------------- | --------------- | -------------- | --------------- | -------------- |
| Profil débutant | 73 %            | 27 %           | 54 %            | 46 %           |
| Stagiaire       | —               | —              | 53 %            | 48 %           |
| Batch de nuit   | 63 %            | 36 %           | 52 %            | 46 %           |
| Architecte ESB  | 66 %            | 33 %           | 54 %            | 46 %           |
| Agent autonome  | 62 %            | 38 %           | 49 %            | 51 %           |

**Victoires d'un joueur contre chaque niveau**, en tout, quand il commence et quand il joue en second. Avant :

| Niveau du bot (d'alors)    | Débutant | en commençant | en second | Joueur « Batch de nuit » | en commençant | en second |
| -------------------------- | -------- | ------------- | --------- | ------------------------ | ------------- | --------- |
| Batch de nuit (facile)     | 14 %     | 21 %          | 7 %       | 50 %                     | 63 %          | 36 %      |
| Architecte ESB (moyen)     | 13 %     | 19 %          | 7 %       | 46 %                     | 61 %          | 31 %      |
| Agent autonome (difficile) | 4 %      | 6 %           | 1 %       | 39 %                     | 51 %          | 25 %      |

Après :

| Niveau du bot              | Débutant | en commençant | en second | Joueur « Batch de nuit » | en commençant | en second |
| -------------------------- | -------- | ------------- | --------- | ------------------------ | ------------- | --------- |
| Stagiaire (facile)         | 56 %     | 59 %          | 53 %      | 90 %                     | 91 %          | 89 %      |
| Batch de nuit (moyen)      | 14 %     | 16 %          | 12 %      | 50 %                     | 53 % (50 %)   | 46 %      |
| Architecte ESB (difficile) | 8 %      | 9 %           | 7 %       | 44 % (40 %)              | 49 % (42 %)   | 40 %      |
| Agent autonome (expert)    | 4 %      | 5 %           | 2 %       | 39 % (36 %)              | 42 % (37 %)   | 36 %      |

**Niveaux deux à deux**, même deck des deux côtés (600 parties par ligne) :

| Niveau A       | Niveau B       | Victoires A | Victoires B | Nulles |
| -------------- | -------------- | ----------- | ----------- | ------ |
| Stagiaire      | Batch de nuit  | 9 %         | 91 %        | 0 %    |
| Stagiaire      | Architecte ESB | 8 %         | 92 %        | 0 %    |
| Stagiaire      | Agent autonome | 3 %         | 97 %        | 0 %    |
| Batch de nuit  | Architecte ESB | 40 %        | 59 %        | 1 %    |
| Batch de nuit  | Agent autonome | 37 %        | 63 %        | 1 %    |
| Architecte ESB | Agent autonome | 43 % (47 %) | 57 % (53 %) | 0 %    |

**Decks prêtés** avec la règle (Batch de nuit des deux côtés, 200 parties par duel) :

| Deck A   | Deck B   | Victoires A | Victoires B | Nulles | Finies par SLA | Tours moyens |
| -------- | -------- | ----------- | ----------- | ------ | -------------- | ------------ |
| Héritage | Héritage | 50 %        | 48 %        | 2 %    | 72 % (76 %)    | 17.2         |
| Héritage | Moderne  | 52 %        | 46 %        | 3 %    | 69 %           | 17.5         |
| Héritage | Hybride  | 50 %        | 49 %        | 2 %    | 74 %           | 17.2         |
| Moderne  | Moderne  | 51 % (54 %) | 48 %        | 2 %    | 54 %           | 18.3         |
| Moderne  | Hybride  | 54 % (46 %) | 45 % (52 %) | 2 %    | 64 %           | 17.7         |
| Hybride  | Hybride  | 54 % (48 %) | 45 % (52 %) | 2 %    | 70 %           | 17.4         |

**Lecture** :

- Le Débit du second joueur ramène l'avantage du premier de 62–73 % à 49–54 % des parties, à chaque niveau. Contre
  Batch de nuit, un débutant qui joue en second passe de 7 à 12 % de victoires, un joueur du même niveau de 36 à 46 %.
- Le Stagiaire laisse 54 à 56 % de victoires à un débutant (plus de la moitié en commençant comme en second) et 90 %
  à un joueur du niveau de Batch de nuit. Il perd au moins 90 % de ses parties contre chacun des autres niveaux.
- L'échelle des niveaux tient : chaque niveau bat le précédent, de 53 à 91 % du temps. Agent autonome ne bat plus
  Architecte ESB que 53 à 57 % du temps, contre 57 à 60 % quand ESB n'étudiait que 3 actions candidates.
- Les decks restent équilibrés : tous les duels entre 45 et 55 %, aux deux graines.
