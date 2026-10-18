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

| N°  | Carte                 | Type     | Rareté  | Coût | Effet                                                                                        |
| --- | --------------------- | -------- | ------- | ---- | -------------------------------------------------------------------------------------------- |
| 59  | Prompt injection      | Incident | Épique  | 4    | **IA** — Prenez le contrôle d'un agent adverse jusqu'à la fin de votre tour                  |
| 60  | Mot de passe en clair | Incident | Rare    | 2    | Détruisez le FTP adverse ; sinon infligez 2 dégâts à un composant Fichiers                   |
| 61  | Certificat expiré     | Incident | Rare    | 2    | Un composant API adverse perd ses capacités et ne peut pas attaquer à son prochain tour      |
| 62  | Couplage fort         | Incident | Rare    | 3    | Liez deux composants adverses : quand l'un subit des dégâts, l'autre aussi                   |
| 63  | Hallucination         | Incident | Rare    | 2    | **IA** — Un composant IA adverse attaque une cible tirée au hasard, dans n'importe quel camp |
| 64  | Message poison        | Incident | Commune | 2    | Détruisez un composant adverse de coût 2 ou moins                                            |

Incidents communs complémentaires, numérotés de 65 à 71 dans les données (US-008) :
**Timeout** (1 — un composant adverse ne peut pas attaquer à son prochain tour), **Doublon** (1 — le prochain dégât
subi par un composant adverse est doublé), **Fichier vide à 3 h du matin** (1 — la prochaine attaque d'un composant
Batch adverse n'inflige rien), **Encodage cassé** (1 — 2 dégâts à un composant Fichiers ou ESB), et les incidents IA
**Contexte saturé** (1 — un composant IA adverse perd ses capacités jusqu'à la fin de son prochain tour),
**Boucle d'agents** (2 — deux agents adverses ne peuvent pas attaquer à leur prochain tour) et **Facture de tokens**
(1 — l'adversaire a 2 Débit de moins à son prochain tour).

## Points à trancher pendant l'équilibrage

- **FTP** est peut-être trop forte pour une légendaire à 3 de Débit malgré Non conforme : simulations à faire.
- Les cartes **Autonomes** sans Orchestration sont imprévisibles : vérifier qu'elles restent intéressantes à jouer.
