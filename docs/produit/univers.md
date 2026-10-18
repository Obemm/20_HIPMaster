# Univers : la plateforme d'intégration

HIPMaster raconte l'histoire de la **plateforme d'intégration hybride** (HIP, _Hybrid Integration Platform_) d'Elis,
du fichier déposé par FTP jusqu'aux agents d'IA. Chaque carte est une technologie, un pattern ou un incident que
connaît une équipe d'intégration. Le jeu est d'abord **interne** : il sert à former et à animer l'équipe.

## Le récit : chaque brique évolue vers sa forme moderne

| Époque             | Point de départ                     | Cible                   |
| ------------------ | ----------------------------------- | ----------------------- |
| Fichiers & Batch   | FTP (**interdit** chez Elis) → SFTP | → API ou événement      |
| Messagerie & ESB   | webMethods Integration Server 10.15 | → webMethods.io (iPaaS) |
| API                | Apigee API Gateway                  | → Apigee AI Gateway     |
| Événementiel (EDA) | Solace Event Mesh                   | → Solace Agent Mesh     |
| IA agentique       | (atteinte par évolution)            | agents, MCP, A2A, LLM   |

Le message du jeu : **le deck gagnant combine les époques**, comme une vraie plateforme hybride. Un deck « tout IA »
est puissant mais exposé aux incidents ; un deck « tout fichier » est solide mais lent et non conforme.

## Les familles

Six familles d'époque, deux familles transverses.

| Famille                | Époque | Exemples                                                                                 | Capacité phare                   |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------- | -------------------------------- |
| **Fichiers & Batch**   | 1990+  | FTP, SFTP, CSV, positions fixes, cron, EDI                                               | **Batch** (lent mais fort)       |
| **Messagerie & ESB**   | 2000+  | webMethods IS 10.15, Universal Messaging, MWS, JMS                                       | **Hub** (bonus, point unique)    |
| **API**                | 2010+  | Apigee, API Hub, REST, OpenAPI, OAuth2                                                   | **Garde** (protège le SI)        |
| **iPaaS**              | 2015+  | webMethods.io, connecteurs SaaS et ERP, low-code                                         | **Connecteur** (pioche)          |
| **Événementiel (EDA)** | 2018+  | Solace Event Mesh, Event Portal, topic, file, CDC                                        | **Diffusion** (plusieurs cibles) |
| **IA agentique**       | 2023+  | Solace Agent Mesh, Apigee AI Gateway, LLM, MCP, A2A                                      | **Autonome** (agit seul)         |
| **Patterns**           | —      | _Enterprise Integration Patterns_ : Router, Splitter, Circuit Breaker, Dead Letter Queue | sorts                            |
| **Bestiaire**          | —      | Message poison, Timeout, Hallucination, Prompt injection, Facture de tokens              | incidents                        |

## Les lignées d'évolution

Une carte d'évolution se pose **à la place** de la carte dont elle est issue (voir [regles.md](regles.md)).

- **FTP → SFTP → API ou événement** : FTP est une relique « non conforme » ; SFTP peut migrer vers une carte API ou EDA.
- **webMethods Integration Server 10.15 → webMethods.io** : la migration vers l'iPaaS supprime l'entretien sur site
  et le point unique de défaillance.
- **Apigee API Gateway → Apigee AI Gateway** : quotas de tokens, cache sémantique, garde-fous, routage multi-modèles.
- **Solace Event Mesh → Solace Agent Mesh** : l'événementiel devient le système nerveux des agents (A2A et MCP).

Synergie notable : **Apigee AI Gateway + Solace Agent Mesh** en jeu ensemble forment des « agents gouvernés ».

## Choix de ton

- **Vrais noms de produits** (Apigee, Solace, webMethods), jamais leurs logos : le jeu est interne. À revoir avant
  toute diffusion publique.
- Chaque carte porte une **phrase d'explication** (pédagogique) et, si possible, un **texte d'ambiance** (humour
  d'équipe : « On devait la décommissionner en 2012. »).
- Mode futur **« Certification »** : un QCM construit à partir des textes des cartes (hors périmètre pour l'instant).
