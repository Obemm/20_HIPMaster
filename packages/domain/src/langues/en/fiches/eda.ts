import type { Fiche } from '../../../fiches/fiche.ts';

/** Fiches « En savoir plus » de la famille Événementiel (EDA) en anglais, par numéro de carte (ADR 0036, US-081). */
export const FICHES_EDA_EN: Readonly<Record<number, Fiche>> = {
  31: {
    definition:
      'A network of interconnected Solace event brokers: an event published on one side reaches all its subscribers, on premises as well as in the cloud.',
    usage:
      'Distributing business events in real time between applications that do not know each other: the publisher publishes to a topic, and the mesh routes the event to each subscriber.',
    exemple:
      'The order system publishes “order validated”; logistics, billing and customer relations each receive it in their own queue, with no direct call.',
    aRetenir:
      'An event is a contract: describe its schema (AsyncAPI, Event Portal) and evolve it without breaking existing subscribers.',
    enInterne: 'the company’s event mesh.',
    liens: [
      {
        titre: 'Event-driven architecture',
        url: 'https://en.wikipedia.org/wiki/Event-driven_architecture',
        langue: 'en',
      },
      {
        titre: 'What is an Event Mesh?',
        url: 'https://solace.com/what-is-an-event-mesh/',
        langue: 'en',
      },
    ],
  },
  32: {
    definition:
      'Solace’s tool for designing, cataloguing and governing events: which ones exist, their schemas, their topics, who publishes them and who subscribes to them.',
    usage:
      'Finding the available events before creating new ones, designing event-driven applications, versioning schemas and exporting their AsyncAPI contracts.',
    exemple:
      'A team searches for “order” in the Event Portal, finds the “order validated” event, its schema and its topic, and subscribes its application to it.',
    aRetenir:
      'A catalogue is only worth something if it reflects reality: document each event as soon as it is created, and now and then compare the catalogue with what the brokers actually carry.',
    liens: [
      {
        titre: 'Solace Event Portal',
        url: 'https://solace.com/products/event-portal/',
        langue: 'en',
      },
      {
        titre: 'Event Portal documentation',
        url: 'https://docs.solace.com/Cloud/Event-Portal/event-portal-lp.htm',
        langue: 'en',
      },
    ],
  },
  33: {
    definition:
      'The software that receives events from publishers, stores them when needed, and distributes them to subscribers: the go-between of event-driven architecture.',
    usage:
      'Decoupling publishers and subscribers, who only know the broker: it routes by topic, queues for absent subscribers and absorbs load peaks.',
    exemple:
      'The till publishes “sale recorded”; stock and accounting receive it, even if accounting was down at the time of the sale.',
    aRetenir:
      'The broker becomes a critical component: make it redundant, monitor its queues and connections, and choose for each flow between guaranteed and “best-effort” delivery.',
    liens: [
      {
        titre: 'What is an Event Broker?',
        url: 'https://solace.com/what-is-an-event-broker/',
        langue: 'en',
      },
      {
        titre: 'Message broker',
        url: 'https://en.wikipedia.org/wiki/Message_broker',
        langue: 'en',
      },
    ],
  },
  34: {
    definition:
      'Change Data Capture: detecting inserts, updates and deletes in a database, usually by reading its transaction log, and publishing them as events.',
    usage:
      'Turning an application that publishes nothing into an event source, without touching its code; feeding caches, data warehouses or other applications in near real time.',
    exemple:
      'Every time a row changes in the old ERP’s customer table, the CDC tool publishes “customer updated”, with the before and after values.',
    aRetenir:
      'CDC publishes table changes, not business facts: “status = 3” does not say “order shipped”. Translate into a business event before sharing.',
    liens: [
      {
        titre: 'Change data capture',
        url: 'https://en.wikipedia.org/wiki/Change_data_capture',
        langue: 'en',
      },
      {
        titre: 'Debezium architecture',
        url: 'https://debezium.io/documentation/reference/stable/architecture.html',
        langue: 'en',
      },
    ],
  },
  35: {
    definition:
      'Publish/Subscribe: a publisher publishes a message without knowing who will read it; each interested subscriber receives a copy.',
    usage:
      'Broadcasting the same fact to several consumers, and adding new ones without touching the publisher: the exact opposite of a point-to-point call.',
    exemple:
      '“Customer created” is published once; the CRM, billing and the welcome email service receive it. Tomorrow, loyalty subscribes without changing anything else.',
    aRetenir:
      'Publish a fact, not an order: “order validated” rather than “invoice this order”. The publisher must not depend on what its subscribers do.',
    liens: [
      {
        titre: 'Publish–subscribe pattern',
        url: 'https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern',
        langue: 'en',
      },
      {
        titre: 'Publish-Subscribe Channel (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/PublishSubscribeChannel.html',
        langue: 'en',
      },
    ],
  },
  36: {
    definition:
      'The address of an event, as a hierarchical string such as sales/order/validated/v1/FR: subscribers choose what they receive by subscribing to patterns.',
    usage:
      'Routing finely without knowing the subscribers. In Solace, * replaces one level and > all the following levels: you take a whole branch (sales/>) or a single country.',
    exemple:
      'French logistics subscribes to sales/order/*/v1/FR: it receives validated and cancelled orders from France, and nothing else.',
    aRetenir:
      'A topic taxonomy is designed from the start: from the most general to the most specific, stable levels, a version, and never any personal data in the topic.',
    liens: [
      {
        titre: 'Understanding Topics (Solace)',
        url: 'https://docs.solace.com/Get-Started/what-are-topics.htm',
        langue: 'en',
      },
      {
        titre: 'Topic Architecture Best Practices (Solace)',
        url: 'https://docs.solace.com/Messaging/Topic-Architecture-Best-Practices.htm',
        langue: 'en',
      },
    ],
  },
  37: {
    definition:
      'A buffer that keeps messages in their order of arrival until a consumer processes them and acknowledges receipt.',
    usage:
      'Absorbing peaks, surviving the consumer’s absence and guaranteeing delivery: a message only leaves the queue once it has been processed.',
    exemple:
      'During warehouse maintenance, 3,000 orders pile up in its queue; on restart, it processes them all, without losing a single one.',
    aRetenir:
      'A queue that only grows signals a problem: monitor its depth and the age of the oldest message, and provide a queue for failed messages.',
    liens: [
      {
        titre: 'Point-to-Point Channel (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/PointToPointChannel.html',
        langue: 'en',
      },
      {
        titre: 'Queues and Topic Endpoints (Solace)',
        url: 'https://docs.solace.com/Messaging/Guaranteed-Msg/Endpoints.htm',
        langue: 'en',
      },
    ],
  },
  38: {
    definition:
      'An open specification for describing event-driven APIs (channels, operations, messages and their schemas): the asynchronous equivalent of OpenAPI.',
    usage:
      'Writing the contract of an event flow, documenting it, generating code and sharing it in a catalogue: publishers and subscribers agree on the format before writing a line.',
    exemple:
      'The AsyncAPI file for “order validated” describes the topic, the message schema and an example; the Event Portal imports it, and subscribers generate their code from it.',
    aRetenir:
      'The message schema is the contract: only add optional fields to it, and publish a new version for any breaking change.',
    liens: [
      {
        titre: 'AsyncAPI concepts',
        url: 'https://www.asyncapi.com/docs/concepts',
        langue: 'en',
      },
      {
        titre: 'The AsyncAPI specification',
        url: 'https://www.asyncapi.com/docs/reference/specification/latest',
        langue: 'en',
      },
    ],
  },
};
