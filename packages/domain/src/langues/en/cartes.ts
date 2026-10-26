import type { TexteCarte } from '../textes.ts';

/**
 * Les textes des 74 cartes du set 1 en anglais britannique (US-081), par numéro de carte. Traduction de `set-1.ts`,
 * qui fait foi, selon le glossaire de l'EPIC-14 : SI → System, Débit → Throughput, PV → HP, poser → deploy,
 * « adverse » → « opposing ». Les noms de produits ne se traduisent pas. Un effet n'existe que si la carte française
 * en a un, avec les mêmes valeurs chiffrées.
 */
export const TEXTES_CARTES_EN: Readonly<Record<number, TexteCarte>> = {
  // Fichiers & Batch
  // 1 — FTP
  1: {
    nom: 'FTP',
    enVrai: 'Plain-text file transfer. Officially banned at the company. Unofficially…',
  },
  // 2 — SFTP
  2: {
    nom: 'SFTP',
    enVrai: 'File transfer encrypted over SSH, gradually giving way to APIs and events.',
  },
  // 3 — EDI
  3: {
    nom: 'EDI',
    enVrai: 'Standardised document exchange between partners.',
  },
  // 4 — Fichier CSV
  4: {
    nom: 'CSV file',
    enVrai: 'The universal format. Separator may vary.',
  },
  // 5 — Fichier à positions fixes
  5: {
    nom: 'Fixed-width file',
    enVrai: '“The amount is in columns 47 to 52.”',
  },
  // 6 — Cron
  6: {
    nom: 'Cron',
    effet:
      'At the start of your turn, one of your Batch components can attack even if it attacked on the previous turn.',
    enVrai: 'The scheduler behind the nightly jobs.',
  },
  // 7 — Répertoire de dépôt
  7: {
    nom: 'Drop folder',
    enVrai: 'Where files wait to be processed.',
  },
  // 8 — Fichier .ok témoin
  8: {
    nom: '.ok flag file',
    effet: 'Your cards are immune to Empty file at 3 a.m.',
    enVrai: 'An empty file dropped at the end of the transfer, proving the file is complete.',
  },

  // Messagerie & ESB
  // 9 — webMethods Integration Server 10.15
  9: {
    nom: 'webMethods Integration Server 10.15',
    enVrai: 'the company’s long-standing ESB, hosted on-premises.',
  },
  // 10 — Universal Messaging
  10: {
    nom: 'Universal Messaging',
    enVrai: 'The messaging layer of webMethods.',
  },
  // 11 — MWS – My webMethods Server
  11: {
    nom: 'MWS – My webMethods Server',
    enVrai: 'Administration and monitoring for webMethods. “The page is loading…”',
  },
  // 12 — MQSeries
  12: {
    nom: 'MQSeries',
    enVrai: 'The ancestor of message queues.',
  },
  // 13 — Adaptateur SAP
  13: {
    nom: 'SAP Adapter',
    enVrai: 'The one and only way through to the ERP.',
  },
  // 14 — webMethods Designer
  14: {
    nom: 'webMethods Designer',
    effet: 'When deployed, draw a Patterns card.',
    enVrai: 'The workshop where webMethods flows are built.',
  },
  // 15 — Flow service
  15: {
    nom: 'Flow service',
    enVrai: 'The processing unit of webMethods.',
  },
  // 16 — Adaptateur JDBC
  16: {
    nom: 'JDBC Adapter',
    enVrai: 'Reading from and writing to the database.',
  },
  // 17 — SOAP / WSDL
  17: {
    nom: 'SOAP / WSDL',
    enVrai: 'The web service from before REST, described in XML.',
  },

  // API
  // 18 — Apigee API Gateway
  18: {
    nom: 'Apigee API Gateway',
    enVrai: 'the company’s API gateway: single point of entry, security, quotas and analytics.',
  },
  // 19 — Apigee API Hub
  19: {
    nom: 'Apigee API Hub',
    effet: 'When deployed, draw an API or Agentic AI card.',
    enVrai: 'The API catalogue.',
  },
  // 20 — OAuth2
  20: {
    nom: 'OAuth2',
    effet: 'Your API components are immune to Expired certificate.',
    enVrai: 'Delegated authorisation, by token.',
  },
  // 21 — Rate limiting
  21: {
    nom: 'Rate limiting',
    effet: 'An opposing component cannot attack on its next turn.',
    enVrai: 'Capping the number of calls a consumer can make.',
  },
  // 22 — API REST
  22: {
    nom: 'REST API',
    enVrai: 'Resources, HTTP verbs and JSON.',
  },
  // 23 — OpenAPI
  23: {
    nom: 'OpenAPI',
    effet: 'When deployed, one of your API components gains +1 attack.',
    enVrai: 'The contract of a REST API.',
  },
  // 24 — Portail développeur
  24: {
    nom: 'Developer portal',
    enVrai: 'Where consumers discover APIs and subscribe to them.',
  },
  // 25 — Webhook
  25: {
    nom: 'Webhook',
    enVrai: 'The API that calls you back when something happens.',
  },

  // iPaaS
  // 26 — webMethods.io
  26: {
    nom: 'webMethods.io',
    enVrai: 'Integration as an iPaaS, with no server to look after.',
  },
  // 27 — Connecteur ERP
  27: {
    nom: 'ERP connector',
    enVrai: 'A ready-made connector to the ERP.',
  },
  // 28 — Connecteur SaaS
  28: {
    nom: 'SaaS connector',
    enVrai: 'Plug in a cloud application in minutes.',
  },
  // 29 — Workflow low-code
  29: {
    nom: 'Low-code workflow',
    enVrai: 'A flow drawn rather than coded.',
  },
  // 30 — Mapping de données
  30: {
    nom: 'Data mapping',
    effet: 'One of your components gains +1 HP.',
    enVrai: 'Turning one format into another.',
  },

  // Événementiel (EDA)
  // 31 — Solace Event Mesh
  31: {
    nom: 'Solace Event Mesh',
    enVrai: 'the company’s event mesh: one published event reaches all of its subscribers.',
  },
  // 32 — Solace Event Portal
  32: {
    nom: 'Solace Event Portal',
    effet: 'When deployed, draw an EDA card.',
    enVrai: 'The event catalogue.',
  },
  // 33 — Event broker
  33: {
    nom: 'Event broker',
    enVrai: 'Receives, stores and distributes events.',
  },
  // 34 — CDC
  34: {
    nom: 'CDC',
    effet: 'When deployed, draw one card for each Files component you have in play.',
    enVrai: 'Change Data Capture: capturing a database’s changes and publishing them.',
  },
  // 35 — Pub/Sub
  35: {
    nom: 'Pub/Sub',
    enVrai: 'One publisher, many subscribers.',
  },
  // 36 — Topic
  36: {
    nom: 'Topic',
    enVrai: 'The hierarchical address of an event.',
  },
  // 37 — File d’attente
  37: {
    nom: 'Queue',
    enVrai: 'Keeps messages until they are consumed.',
  },
  // 38 — AsyncAPI
  38: {
    nom: 'AsyncAPI',
    effet: 'When deployed, one of your EDA components gains +1 attack.',
    enVrai: 'The contract of an event-driven API.',
  },

  // IA agentique
  // 39 — Solace Agent Mesh
  39: {
    nom: 'Solace Agent Mesh',
    effet: 'Your agents gain Delegation and Tooling.',
    enVrai: 'AI agents plugged into the event mesh, talking A2A and using MCP.',
  },
  // 40 — Apigee AI Gateway
  40: {
    nom: 'Apigee AI Gateway',
    enVrai:
      'the company’s upcoming AI gateway: token quotas, semantic cache, guardrails and routing between models.',
  },
  // 41 — LLM
  41: {
    nom: 'LLM',
    enVrai: 'The large language model.',
  },
  // 42 — Agent
  42: {
    nom: 'Agent',
    enVrai: 'An LLM that plans and acts with tools.',
  },
  // 43 — Orchestrateur multi-agents
  43: {
    nom: 'Multi-agent orchestrator',
    enVrai: 'Shares the work out between several agents.',
  },
  // 44 — Serveur MCP
  44: {
    nom: 'MCP server',
    enVrai: 'Model Context Protocol: exposes tools and data to AI models.',
  },
  // 45 — Agent Card (A2A)
  45: {
    nom: 'Agent Card (A2A)',
    enVrai: 'In the A2A protocol, the card an agent uses to introduce itself to another.',
  },
  // 46 — RAG
  46: {
    nom: 'RAG',
    enVrai: 'Retrieval-Augmented Generation: finding the right documents before answering.',
  },
  // 47 — Chain of thought
  47: {
    nom: 'Chain of thought',
    effet: 'Draw 2 cards.',
    enVrai: 'Making the model reason step by step.',
  },
  // 48 — Human-in-the-loop
  48: {
    nom: 'Human-in-the-loop',
    effet: 'The next incident played against you has no effect.',
    enVrai: 'A human signs off before the agent acts.',
  },
  // 49 — Base vectorielle
  49: {
    nom: 'Vector database',
    effet: 'Your agents have +1 HP.',
    enVrai: 'Finding texts by their meaning rather than their words.',
  },
  // 50 — Fenêtre de contexte
  50: {
    nom: 'Context window',
    enVrai: 'What the model can read in one go.',
  },
  // 51 — Prompt système
  51: {
    nom: 'System prompt',
    effet: 'One of your agents gains +2 attack.',
    enVrai: 'The standing instructions given to the model.',
  },
  // 52 — Few-shot
  52: {
    nom: 'Few-shot',
    effet: 'One of your AI components gains +1 attack and +1 HP.',
    enVrai: 'Showing the model a few examples for it to imitate.',
  },

  // Patterns
  // 53 — Dead Letter Queue
  53: {
    nom: 'Dead Letter Queue',
    effet: 'Return a component from your discard pile to play with 1 HP.',
    enVrai: 'The queue where failed messages wait to be replayed.',
  },
  // 54 — Circuit Breaker
  54: {
    nom: 'Circuit Breaker',
    effet: 'Your System loses no SLA until your next turn.',
    enVrai: 'Cutting off calls to a failing service while it recovers.',
  },
  // 55 — Content-Based Router
  55: {
    nom: 'Content-Based Router',
    effet: 'Deal 2 damage to the opposing component of your choice.',
    enVrai: 'Routing a message according to its content.',
  },
  // 56 — Splitter
  56: {
    nom: 'Splitter',
    effet: 'Deal 1 damage to each opposing component.',
    enVrai: 'Cutting one message into several.',
  },
  // 57 — Idempotent Consumer
  57: {
    nom: 'Idempotent Consumer',
    effet: 'Cancel Duplicate; otherwise, draw a card.',
    enVrai: 'Receiving the same message twice, with no side effects.',
  },
  // 58 — Retry
  58: {
    nom: 'Retry',
    effet: 'One of your components that has attacked can attack again, and loses 1 HP.',
    enVrai: 'Trying again after a failure, in moderation.',
  },

  // Bestiaire
  // 59 — Prompt injection
  59: {
    nom: 'Prompt injection',
    effet:
      'An opposing agent immediately attacks a target of your choice on its own side (component or System).',
    enVrai: 'Instructions hidden in the data hijack the agent.',
  },
  // 60 — Mot de passe en clair
  60: {
    nom: 'Plain-text password',
    effet:
      'Target an opposing Files component: destroyed if it is FTP, otherwise it takes 2 damage.',
    enVrai: 'FTP sends credentials without any encryption.',
  },
  // 61 — Certificat expiré
  61: {
    nom: 'Expired certificate',
    effet: 'An opposing API component loses its abilities and cannot attack on its next turn.',
    enVrai: 'The TLS certificate nobody renewed.',
  },
  // 62 — Couplage fort
  62: {
    nom: 'Tight coupling',
    effet: 'Link two opposing components: when one takes damage, so does the other.',
    enVrai: 'Two systems so dependent on each other that when one goes down, so does the other.',
  },
  // 63 — Hallucination
  63: {
    nom: 'Hallucination',
    effet: 'An opposing AI component attacks a random target, on either side.',
    enVrai: 'The model makes up an answer that sounds right but is wrong.',
  },
  // 64 — Message poison
  64: {
    nom: 'Poison message',
    effet: 'Destroy an opposing component costing 2 or less.',
    enVrai: 'A message the consumer cannot process, which blocks the queue.',
  },
  // 65 — Timeout
  65: {
    nom: 'Timeout',
    effet: 'An opposing component cannot attack on its next turn.',
    enVrai: 'The response never arrived in time.',
  },
  // 66 — Doublon
  66: {
    nom: 'Duplicate',
    effet: 'The next damage an opposing component takes is doubled.',
    enVrai: 'The same message, processed twice.',
  },
  // 67 — Fichier vide à 3 h du matin
  67: {
    nom: 'Empty file at 3 a.m.',
    effet: 'The next attack by an opposing Batch component deals no damage.',
    enVrai: 'The nightly job ran… on an empty file.',
  },
  // 68 — Encodage cassé
  68: {
    nom: 'Broken encoding',
    effet: 'Deal 2 damage to an opposing Files or ESB component.',
    enVrai: 'ISO-8859-1 versus UTF-8: accented letters turn into gibberish.',
  },
  // 69 — Contexte saturé
  69: {
    nom: 'Context overflow',
    effet: 'An opposing AI component loses its abilities until the end of its next turn.',
    enVrai: 'Too much information: the model forgets the instructions it was given at the start.',
  },
  // 70 — Boucle d’agents
  70: {
    nom: 'Agent loop',
    effet: 'One or two opposing agents cannot attack on their next turn.',
    enVrai: 'Two agents handing the task back and forth to each other, forever.',
  },
  // 71 — Facture de tokens
  71: {
    nom: 'Token bill',
    effet: 'Your opponent has 2 less Throughput on their next turn.',
    enVrai: 'Every call to the model is billed by the token.',
  },
  // Extension (US-077)
  // 72 — API First
  72: {
    nom: 'API First',
    effet:
      'Draw the first two API cards from your deck, then one of your API components gains +1 attack.',
    enVrai:
      'Designing the API contract before the code: provider and consumers move forward in parallel.',
  },
  // 73 — EDA
  73: {
    nom: 'EDA',
    effet: 'Each of your EDA components deals 1 damage to a random opposing component.',
    enVrai:
      'Event-driven architecture: a fact is published, and each subscriber reacts to it without waiting for the others.',
  },
  // 74 — API GraphQL
  74: {
    nom: 'GraphQL API',
    effet: 'When deployed, draw one card for each other component you have in play (2 at most).',
    enVrai:
      'A single endpoint: the client asks for exactly the fields it needs, in one query across several sources.',
  },
};
