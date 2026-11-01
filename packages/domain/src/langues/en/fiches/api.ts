import type { Fiche } from '../../../fiches/fiche.ts';

/** Fiches « En savoir plus » de la famille API en anglais, par numéro de carte (ADR 0036, US-081). */
export const FICHES_API_EN: Readonly<Record<number, Fiche>> = {
  18: {
    definition:
      'Google Cloud’s API gateway: a single entry point, placed in front of APIs, to secure them, limit their use and measure them.',
    usage:
      'Every call goes through a proxy that checks the consumer’s identity (API key, OAuth2 token), applies quotas, transforms the request if needed, relays it to the real service and keeps statistics on it.',
    exemple:
      'A mobile app calls /orders: Apigee checks its token, rejects the request that goes over the per-minute limit, then forwards the others to the internal service.',
    aRetenir:
      'The gateway protects and observes; it does not carry business logic. A proxy stuffed with rules turns into a small ESB that is hard to maintain.',
    liens: [
      {
        titre: 'What is Apigee?',
        url: 'https://docs.cloud.google.com/apigee/docs/api-platform/get-started/what-apigee',
        langue: 'en',
      },
      {
        titre: 'API management',
        url: 'https://en.wikipedia.org/wiki/API_management',
        langue: 'en',
      },
    ],
  },
  19: {
    definition:
      'The central API catalogue in Apigee: it lists an organisation’s APIs, their versions, their specifications and their owners, whether or not they go through Apigee.',
    usage:
      'Knowing which APIs exist before creating a new one, finding the right contract and its team, and checking the quality of specifications with style rules.',
    exemple:
      'Before writing a “customers” API, a team searches API Hub and finds it already exists, with its OpenAPI specification and the team to contact.',
    aRetenir:
      'A catalogue is only worth something if it is up to date: register each API from the design stage, with an owner and a status (in design, in production, deprecated).',
    liens: [
      {
        titre: 'What is Apigee API hub?',
        url: 'https://docs.cloud.google.com/apigee/docs/apihub/what-is-api-hub',
        langue: 'en',
      },
    ],
  },
  20: {
    definition:
      'An authorisation framework (RFC 6749) that lets an application access a resource with a time-limited token, without ever knowing the user’s password.',
    usage:
      'Securing APIs: the client obtains an access token from an authorisation server, then presents it with every call; the API checks the token and its permissions (scopes).',
    exemple:
      'A batch job calls the invoices API: it exchanges its client ID and secret for a token valid for one hour (client credentials flow), which it attaches to every request.',
    aRetenir:
      'OAuth2 authorises, it does not authenticate the user: that is OpenID Connect’s job. Short-lived tokens, narrow scopes, and never a token in a URL.',
    liens: [
      { titre: 'OAuth', url: 'https://en.wikipedia.org/wiki/OAuth', langue: 'en' },
      { titre: 'OAuth 2.0', url: 'https://oauth.net/2/', langue: 'en' },
    ],
  },
  21: {
    definition:
      'Limiting the number of calls a consumer can make in a given time: beyond that, the API responds 429 Too Many Requests.',
    usage:
      'Protecting a service from overload, sharing its capacity fairly between consumers, and enforcing usage contracts (quotas per day or per month).',
    exemple:
      'A buggy app calls the API in a loop: the gateway lets 100 requests per second through, responds 429 to the rest, and the service behind holds firm.',
    aRetenir:
      'For the consumer, a 429 is not an outage: wait (Retry-After header) then retry. For the provider, distinguish protection against spikes from commercial quotas.',
    liens: [
      {
        titre: '429 Too Many Requests (MDN)',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429',
        langue: 'en',
      },
      {
        titre: 'Rate limiting (Apigee)',
        url: 'https://docs.cloud.google.com/apigee/docs/api-platform/develop/rate-limiting',
        langue: 'en',
      },
    ],
  },
  22: {
    definition:
      'An architectural style (Roy Fielding, 2000) where you manipulate resources identified by URLs with HTTP verbs: GET reads, POST creates, PUT or PATCH modifies, DELETE deletes.',
    usage:
      'The most widespread way to expose data and services: simple, stateless, with open formats (often JSON) and HTTP status codes.',
    exemple:
      'GET /customers/42 returns customer 42 as JSON; POST /customers creates one and responds 201, with the new customer’s address in the Location header.',
    aRetenir:
      'A good REST API is designed through its contract, before the code: plural resource names, correct HTTP codes, standard errors (RFC 9457) and versions.',
    liens: [
      { titre: 'REST', url: 'https://en.wikipedia.org/wiki/REST', langue: 'en' },
      {
        titre: 'REST (MDN glossary)',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/REST',
        langue: 'en',
      },
    ],
  },
  23: {
    definition:
      'An open specification, derived from Swagger, for describing a REST API in a YAML or JSON file: paths, operations, parameters, responses and data schemas.',
    usage:
      'Writing the contract before the code, deriving documentation, clients and mocks from it, validating requests and testing the API against its specification.',
    exemple:
      'This game is an example: each route of its API is first described in OpenAPI, then coded, and the tests check the responses against that contract.',
    aRetenir:
      'A specification nobody checks ends up lying: test it automatically against the implementation, and version it like code.',
    liens: [
      { titre: 'OpenAPI Initiative', url: 'https://www.openapis.org/', langue: 'en' },
      {
        titre: 'The OpenAPI Specification',
        url: 'https://spec.openapis.org/oas/latest.html',
        langue: 'en',
      },
    ],
  },
  24: {
    definition:
      'The site where developers discover an organisation’s APIs, read their documentation, try them out and request access.',
    usage:
      'Making APIs easy to find and consume, without meetings: up-to-date documentation, a test console, self-service sign-up and API keys.',
    exemple:
      'A developer at a subsidiary finds the pricing API on the portal, tries it in the console, then registers their app and receives its key.',
    aRetenir:
      'An API without documentation does not exist for its consumers: concrete examples, a getting-started guide and explained errors are worth more than a long reference.',
    liens: [
      {
        titre: 'Build your integrated portal (Apigee)',
        url: 'https://docs.cloud.google.com/apigee/docs/api-platform/publish/portal/build-integrated-portal',
        langue: 'en',
      },
    ],
  },
  25: {
    definition:
      'An HTTP call that a system sends on its own, to an address provided by another, when an event occurs: the API that calls you back instead of you polling it endlessly.',
    usage:
      'Being notified in real time without polling: payment accepted, parcel delivered, document signed. Widely used by SaaS applications.',
    exemple:
      'The payment provider calls POST /webhooks/payments as soon as a payment is confirmed; the integration responds 200 straight away, then processes the payment.',
    aRetenir:
      'A webhook sometimes arrives twice, late, or from an impostor: verify its signature, process it idempotently, and respond quickly, then process it afterwards.',
    liens: [
      { titre: 'Webhook', url: 'https://en.wikipedia.org/wiki/Webhook', langue: 'en' },
      { titre: 'Standard Webhooks', url: 'https://www.standardwebhooks.com/', langue: 'en' },
    ],
  },
  72: {
    definition:
      'An approach that designs an API’s contract (often in OpenAPI) before writing the code, and treats the API as a product in its own right.',
    usage:
      'The contract is discussed and agreed with consumers, then serves as the shared reference: the provider codes the API, consumers build against a mock derived from the contract, and documentation and tests follow from it.',
    exemple:
      'For a “delivery rounds” API, the team first writes the OpenAPI specification with the mobile app team; while the service is being coded, the app moves forward against a mock server built from the same contract.',
    aRetenir:
      'The contract is the reference: the code follows the specification, not the other way round. A specification generated afterwards from the code is just well-documented “code first”.',
    liens: [
      {
        titre: 'Understanding the API-First Approach (Swagger)',
        url: 'https://swagger.io/blog/understanding-the-api-first-approach-to-building-products/',
        langue: 'en',
      },
      { titre: 'Learn OpenAPI', url: 'https://learn.openapis.org/', langue: 'en' },
    ],
  },
  74: {
    definition:
      'A query language for APIs, open-sourced by Facebook in 2015: the client sends a single endpoint a query that describes exactly the data it wants, following a typed schema.',
    usage:
      'Serving varied screens (mobile, web) without multiplying calls: one query gathers data from several sources, and the response has the shape of the query, nothing more, nothing less.',
    exemple:
      'A customer page shows their contracts, latest deliveries and invoices: a single GraphQL query instead of three REST calls, each field being supplied by the service that owns it.',
    aRetenir:
      'Client flexibility is paid for on the server: limit query depth and cost, avoid cascading calls (the N+1 problem); HTTP caching is also less straightforward than with REST.',
    liens: [
      { titre: 'GraphQL', url: 'https://en.wikipedia.org/wiki/GraphQL', langue: 'en' },
      { titre: 'Learn GraphQL', url: 'https://graphql.org/learn/', langue: 'en' },
    ],
  },
};
