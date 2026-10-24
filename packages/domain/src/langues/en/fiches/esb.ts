import type { Fiche } from '../../../fiches/fiche.ts';

/** Fiches « En savoir plus » de la famille Messagerie & ESB en anglais, par numéro de carte (ADR 0036, US-081). */
export const FICHES_ESB_EN: Readonly<Record<number, Fiche>> = {
  9: {
    definition:
      'The integration server of the webMethods suite (Software AG, then IBM since 2024): it runs the services that connect applications to one another.',
    usage:
      'Receiving a message, transforming it, calling an application (ERP, database, web service) and routing the result. It plays the role of an ESB: the central bus through which exchanges pass.',
    exemple:
      'An order arrives as XML; a flow service converts it to the ERP format, sends it through the SAP adapter, then returns an acknowledgement.',
    aRetenir:
      'A central bus is handy… until it becomes the single point of failure and the place where business logic piles up. An ESB transforms and routes; business rules live in the applications.',
    enInterne: 'the company’s legacy ESB, hosted on premises; its target is the webMethods.io iPaaS.',
    liens: [
      {
        titre: 'Enterprise service bus',
        url: 'https://en.wikipedia.org/wiki/Enterprise_service_bus',
        langue: 'en',
      },
      { titre: 'webMethods', url: 'https://en.wikipedia.org/wiki/WebMethods', langue: 'en' },
    ],
  },
  10: {
    definition:
      'The message broker of the webMethods suite: it carries messages between applications, through queues or publish-subscribe, and supports the Java JMS standard.',
    usage:
      'Moving messages asynchronously between Integration Server and applications: the sender does not wait for the receiver, and messages are kept until they are delivered.',
    exemple:
      'Integration Server publishes the “order received” document; two subscribed triggers receive it through Universal Messaging and each start their own processing.',
    aRetenir:
      'A broker keeps messages, but you still have to watch what it keeps: swelling queues, disconnected subscribers, expired messages. A saturated broker blocks everyone.',
    liens: [
      {
        titre: 'Message-oriented middleware',
        url: 'https://en.wikipedia.org/wiki/Message-oriented_middleware',
        langue: 'en',
      },
      {
        titre: 'Jakarta Messaging (formerly Java Message Service)',
        url: 'https://en.wikipedia.org/wiki/Jakarta_Messaging',
        langue: 'en',
      },
    ],
  },
  11: {
    definition:
      'The portal server of the webMethods suite: it hosts the web interfaces for administering and monitoring the products (process tracking, tasks, users).',
    usage:
      'Following running processes and services, looking up errors, restarting an execution, managing tasks assigned to humans and user permissions.',
    exemple:
      'An order flow is stuck: from MWS, you find the failed process instance, read the message at fault, then restart it.',
    aRetenir:
      'An administration console is a sensitive spot: restricted access, named accounts. And monitoring relies on alerts, not on manually checking pages… that keep loading.',
    liens: [{ titre: 'webMethods', url: 'https://en.wikipedia.org/wiki/WebMethods', langue: 'en' }],
  },
  12: {
    definition:
      'The messaging middleware launched by IBM in 1993 as MQSeries, later WebSphere MQ then IBM MQ: reliable message queues between applications, on almost every system.',
    usage:
      'Guaranteeing that a message arrives even if the recipient is down or the network is cut: it waits in a queue, and sending it can be part of a transaction. Widely used in banking and industry.',
    exemple:
      'Billing puts an invoice on an MQ queue; the ERP, down for maintenance, consumes it when it restarts, without anyone having to resend anything.',
    aRetenir:
      'A queue that fills up with no consumer ends up rejecting messages: monitor queue depth and provide a queue for failed messages.',
    liens: [
      { titre: 'IBM MQ', url: 'https://en.wikipedia.org/wiki/IBM_MQ', langue: 'en' },
      { titre: 'IBM MQ (vendor)', url: 'https://www.ibm.com/products/mq', langue: 'en' },
    ],
  },
  13: {
    definition:
      'A connector that lets the integration platform talk to SAP: calling its functions remotely (RFC, BAPI) and exchanging its IDoc documents.',
    usage:
      'Reading from and writing to the ERP without touching its database: creating an order, reading an item, receiving the IDocs SAP sends when a piece of data changes.',
    exemple:
      'An order confirmed on the website goes to the integration, which calls the order creation BAPI; SAP returns the number of the created order.',
    aRetenir:
      'SAP imposes its own formats and rules: document the mapping, handle the business errors SAP returns, and test on a quality assurance system before production.',
    liens: [
      { titre: 'IDoc', url: 'https://en.wikipedia.org/wiki/IDoc', langue: 'en' },
      { titre: 'SAP ERP', url: 'https://en.wikipedia.org/wiki/SAP_ERP', langue: 'en' },
    ],
  },
  14: {
    definition:
      'The webMethods development environment, built on Eclipse: where you create, test and debug the services that run on Integration Server.',
    usage:
      'Drawing flow services, defining documents (data structures), configuring adapters and triggers, then debugging step by step with real data.',
    exemple:
      'A developer opens the order mapping service, adds a field, replays the sample message in debug mode, then delivers the modified package.',
    aRetenir:
      'The code lives in packages: version them in Git and deploy them with a tool, rather than copying them by hand from one server to another.',
    liens: [
      { titre: 'webMethods', url: 'https://en.wikipedia.org/wiki/WebMethods', langue: 'en' },
      {
        titre: 'Eclipse (software)',
        url: 'https://en.wikipedia.org/wiki/Eclipse_(software)',
        langue: 'en',
      },
    ],
  },
  15: {
    definition:
      'A service written in the webMethods graphical language: a sequence of steps (MAP, INVOKE, BRANCH, LOOP…) that pass data to one another in a “pipeline”.',
    usage:
      'Assembling an integration process without writing Java: receiving a document, transforming it, calling other services, handling errors.',
    exemple:
      'The processOrder service calls a validation service, maps the order to the SAP format, invokes the adapter, then logs the result.',
    aRetenir:
      'A readable flow service is short: split it into reusable sub-services, drop variables that are no longer needed from the pipeline, and include an error-handling block.',
    liens: [
      {
        titre: 'Pipes and Filters (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/PipesAndFilters.html',
        langue: 'en',
      },
      { titre: 'webMethods', url: 'https://en.wikipedia.org/wiki/WebMethods', langue: 'en' },
    ],
  },
  16: {
    definition:
      'A connector that links the integration platform to a relational database through JDBC, Java’s standard interface for running SQL.',
    usage:
      'Reading, inserting or updating rows, calling stored procedures, or watching a table for new rows to trigger a flow.',
    exemple:
      'Every 10 minutes the adapter reads the new rows of the shipments table and publishes an event for each one.',
    aRetenir:
      'Reading another application’s database directly couples the two systems: the slightest schema change breaks the integration. Prefer its API when there is one.',
    liens: [
      {
        titre: 'Java Database Connectivity',
        url: 'https://en.wikipedia.org/wiki/Java_Database_Connectivity',
        langue: 'en',
      },
    ],
  },
  17: {
    definition:
      'SOAP is a protocol for exchanging XML messages between web services; WSDL is the XML document that describes a service’s operations and the format of its messages.',
    usage:
      'The web services standard of the 2000s: strict contracts, types defined in XML Schema, extensions for security (WS-Security). Still very present in ERPs and B2B exchanges.',
    exemple:
      'A carrier publishes its WSDL; the integration tool generates the client from it, which calls the calculateRate operation in a SOAP envelope.',
    aRetenir:
      'The WSDL contract is a strength: never change it without a new version. And a SOAP error (fault) often comes back as HTTP 500: read its message before concluding there is an outage.',
    liens: [
      { titre: 'SOAP', url: 'https://en.wikipedia.org/wiki/SOAP', langue: 'en' },
      {
        titre: 'Web Services Description Language',
        url: 'https://en.wikipedia.org/wiki/Web_Services_Description_Language',
        langue: 'en',
      },
    ],
  },
};
