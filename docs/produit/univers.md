# Universe: the integration platform

HIPMaster tells the story of the company's **hybrid integration platform** (HIP), from the file dropped over FTP to AI
agents. Each card is a technology, a pattern or an incident that an integration team knows well. The game is first of
all **internal**: it is used to train and engage the team.

## The story: every building block evolves towards its modern form

| Era                | Starting point                      | Target                  |
| ------------------ | ----------------------------------- | ----------------------- |
| Files & Batch      | FTP (**banned** at the company) → SFTP     | → API or event          |
| Messaging & ESB    | webMethods Integration Server 10.15 | → webMethods.io (iPaaS) |
| API                | Apigee API Gateway                  | → Apigee AI Gateway     |
| Event-driven (EDA) | Solace Event Mesh                   | → Solace Agent Mesh     |
| Agentic AI         | (reached through evolution)         | agents, MCP, A2A, LLM   |

The message of the game: **the winning deck combines the eras**, like a real hybrid platform. An "all AI" deck is
powerful but exposed to incidents; an "all files" deck is solid but slow and non-compliant.

## The families

Six era families, two cross-cutting families.

| Family                 | Era   | Examples                                                                                | Signature ability                |
| ---------------------- | ----- | --------------------------------------------------------------------------------------- | -------------------------------- |
| **Files & Batch**      | 1990+ | FTP, SFTP, CSV, fixed-width files, cron, EDI                                            | **Batch** (slow but strong)      |
| **Messaging & ESB**    | 2000+ | webMethods IS 10.15, Universal Messaging, MWS, JMS                                      | **Hub** (bonus, single point)    |
| **API**                | 2010+ | Apigee, API Hub, REST, OpenAPI, OAuth2                                                  | **Guard** (protects the System)  |
| **iPaaS**              | 2015+ | webMethods.io, SaaS and ERP connectors, low-code                                        | **Connector** (draws cards)      |
| **Event-driven (EDA)** | 2018+ | Solace Event Mesh, Event Portal, topic, queue, CDC                                      | **Broadcast** (several targets)  |
| **Agentic AI**         | 2023+ | Solace Agent Mesh, Apigee AI Gateway, LLM, MCP, A2A                                     | **Autonomous** (acts on its own) |
| **Patterns**           | —     | _Enterprise Integration Patterns_: Router, Splitter, Circuit Breaker, Dead Letter Queue | spells                           |
| **Bestiary**           | —     | Poison message, Timeout, Hallucination, Prompt injection, Token bill                    | incidents                        |

## The evolution lines

An evolution card is deployed **in place of** the card it comes from (see [regles.md](regles.md)).

- **FTP → SFTP → API or event**: FTP is a "non-compliant" relic; SFTP can migrate to an API or EDA card.
- **webMethods Integration Server 10.15 → webMethods.io**: the move to iPaaS removes on-premises upkeep and the
  single point of failure.
- **Apigee API Gateway → Apigee AI Gateway**: token quotas, semantic cache, guardrails, multi-model routing.
- **Solace Event Mesh → Solace Agent Mesh**: events become the nervous system of the agents (A2A and MCP).

Notable synergy: **Apigee AI Gateway + Solace Agent Mesh** in play together form "governed agents".

## Tone

- **Real product names** (Apigee, Solace, webMethods), never their logos: the game is internal. To be reviewed before
  any public release.
- Each card carries an **explanatory sentence** (educational) and, where possible, a **flavour text** (team humour:
  "We were supposed to decommission it in 2012.").
- Future **"Certification"** mode: a multiple-choice quiz built from the card texts (out of scope for now).
