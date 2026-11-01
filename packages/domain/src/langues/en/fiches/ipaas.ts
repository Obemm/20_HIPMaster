import type { Fiche } from '../../../fiches/fiche.ts';

/** Fiches « En savoir plus » de la famille iPaaS en anglais, par numéro de carte (ADR 0036, US-081). */
export const FICHES_IPAAS_EN: Readonly<Record<number, Fiche>> = {
  26: {
    definition:
      'webMethods’ iPaaS (Integration Platform as a Service) offering: integration hosted in the cloud by the vendor, with no server to install or update.',
    usage:
      'Building integrations from ready-made connectors (SaaS applications, ERPs, databases) and drawn flows, orchestrating several applications and exposing the result as an API.',
    exemple:
      'When a customer is created in the CRM, a webMethods.io flow creates it in the ERP, then notifies the billing department.',
    aRetenir:
      'Fewer servers does not mean less rigour: versioning flows, testing them, monitoring runs and watching consumption remain essential.',
    liens: [
      {
        titre: 'Cloud-based integration (iPaaS)',
        url: 'https://en.wikipedia.org/wiki/Cloud-based_integration',
        langue: 'en',
      },
      {
        titre: 'IBM webMethods Integration',
        url: 'https://www.ibm.com/products/webmethods-integration',
        langue: 'en',
      },
    ],
  },
  27: {
    definition:
      'A ready-made connector, supplied by the integration platform, that knows how to talk to an ERP (SAP, Oracle, Microsoft Dynamics…): connection, operations, formats.',
    usage:
      'Saving weeks: instead of coding the calls to the ERP, you pick an operation (create an order, read an item) and map the fields.',
    exemple:
      'In an iPaaS flow, the “SAP: create an order” step receives the order from the e-commerce site and returns the SAP order number.',
    aRetenir:
      'The connector simplifies the transport, not the business: you still need to understand the ERP’s data, its validation rules and its call limits.',
    liens: [
      {
        titre: 'Enterprise resource planning',
        url: 'https://en.wikipedia.org/wiki/Enterprise_resource_planning',
        langue: 'en',
      },
    ],
  },
  28: {
    definition:
      'A ready-made connector to an online application (CRM, HR, messaging, storage…), which handles the vendor’s authentication and API for you.',
    usage:
      'Plugging in a cloud application in minutes: triggering a flow on an event (“new contact”) and calling actions (“create a ticket”).',
    exemple:
      'When an urgent ticket is created in the support tool, an iPaaS flow alerts the team’s channel and creates a task in the project management tool.',
    aRetenir:
      'The vendor changes its API, the connector follows… sometimes late. Watch for deprecations, manage service accounts and their secrets, and respect the SaaS call limits.',
    liens: [
      {
        titre: 'Software as a service',
        url: 'https://en.wikipedia.org/wiki/Software_as_a_service',
        langue: 'en',
      },
      {
        titre: 'Cloud-based integration (iPaaS)',
        url: 'https://en.wikipedia.org/wiki/Cloud-based_integration',
        langue: 'en',
      },
    ],
  },
  29: {
    definition:
      'An integration flow built by visually assembling steps (trigger, actions, conditions, loops) rather than by writing code.',
    usage:
      'Moving fast on simple integrations and opening them up to less technical profiles; code remains possible for special cases.',
    exemple:
      'Trigger: a new order in the shop. Condition: over €1,000. Action: request approval by email, then create the order in the ERP.',
    aRetenir:
      'Drawn does not mean engineering-free: name the steps, handle errors, test, version and document, or the flow soon turns into a plate of spaghetti.',
    liens: [
      {
        titre: 'Low-code development platform',
        url: 'https://en.wikipedia.org/wiki/Low-code_development_platform',
        langue: 'en',
      },
    ],
  },
  30: {
    definition:
      'The correspondence between the fields of a source format and those of a target format, with the necessary transformations: renaming, converting, calculating, grouping.',
    usage:
      'Helping two systems that do not speak alike understand each other (dates, units, country codes, nested structures). It is the “Message Translator” of the Enterprise Integration Patterns.',
    exemple:
      'dateCommande “24/10/2026” becomes orderDate “2026-10-24”, and the country “France” becomes “FR” thanks to a lookup table.',
    aRetenir:
      'Many integration incidents start in the mapping: document every rule, handle empty or unknown values, and test with real data.',
    liens: [
      {
        titre: 'Message Translator (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/MessageTranslator.html',
        langue: 'en',
      },
      { titre: 'Data mapping', url: 'https://en.wikipedia.org/wiki/Data_mapping', langue: 'en' },
    ],
  },
};
