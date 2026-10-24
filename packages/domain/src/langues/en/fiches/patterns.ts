import type { Fiche } from '../../../fiches/fiche.ts';

/** Fiches « En savoir plus » de la famille Patterns en anglais, par numéro de carte (ADR 0036, US-081). */
export const FICHES_PATTERNS_EN: Readonly<Record<number, Fiche>> = {
  53: {
    definition:
      'The queue where messages that could not be processed are put, instead of losing them or blocking the main queue. It is the “Dead Letter Channel” of the Enterprise Integration Patterns.',
    usage:
      'Isolating a failed message (invalid format, too many attempts, timeout) so that the flow carries on, then analysing it, fixing it and replaying it.',
    exemple:
      'A malformed order fails three times: the broker moves it to the DLQ. The next day, the mapping is fixed and the queue is replayed.',
    aRetenir:
      'A DLQ that nobody monitors is just a bin: alert as soon as it fills up, and plan how to replay without creating duplicates.',
    liens: [
      {
        titre: 'Dead Letter Channel (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/DeadLetterChannel.html',
        langue: 'en',
      },
      {
        titre: 'Dead letter queue',
        url: 'https://en.wikipedia.org/wiki/Dead_letter_queue',
        langue: 'en',
      },
    ],
  },
  54: {
    definition:
      'A software circuit breaker: after too many failures towards a service, you stop calling it for a while, failing straight away, then carefully check whether it is back.',
    usage:
      'Stopping a failure from spreading: not exhausting your own resources (connections, threads) waiting for a service that is down, and letting it recover.',
    exemple:
      'The pricing service stops responding: after 5 failures, the circuit opens; for 30 seconds, the site shows the last known price, then a trial call checks whether the service is back.',
    aRetenir:
      'Plan what to do when the circuit is open (default value, clear message, queuing), and monitor its state: a circuit breaker that is often open signals a real problem.',
    liens: [
      {
        titre: 'Circuit Breaker pattern (Microsoft Learn)',
        url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker',
        langue: 'en',
      },
      {
        titre: 'Circuit Breaker (Martin Fowler)',
        url: 'https://martinfowler.com/bliki/CircuitBreaker.html',
        langue: 'en',
      },
    ],
  },
  55: {
    definition:
      'A pattern from the Enterprise Integration Patterns: a component reads the content of a message and sends it to the right destination according to rules.',
    usage:
      'Directing each message to the system that knows how to process it, without the sender having to know those systems: by country, by product type, by amount.',
    exemple:
      'Orders from France go to the French ERP, those from Germany to the German ERP, and all the others to a queue for review.',
    aRetenir:
      'Always provide a default destination for messages that no rule recognises, and keep the rules simple: a router must not turn into a business rules engine.',
    liens: [
      {
        titre: 'Content-Based Router (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/ContentBasedRouter.html',
        langue: 'en',
      },
    ],
  },
  56: {
    definition:
      'A pattern from the Enterprise Integration Patterns: splitting a message made up of several elements into as many messages, to process them one by one.',
    usage:
      'Processing each line of an order or each record of a file separately, in parallel, and confining errors to the faulty element.',
    exemple:
      'A file of 500 invoices becomes 500 messages: one invalid invoice goes to error, the other 499 go through. An Aggregator can then reassemble the batch.',
    aRetenir:
      'Keep the batch identifier and its position (“3 of 500”) in each message: without them, you cannot reassemble the batch, track its progress or know whether it is complete.',
    liens: [
      {
        titre: 'Splitter (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/Sequencer.html',
        langue: 'en',
      },
      {
        titre: 'Aggregator (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/Aggregator.html',
        langue: 'en',
      },
    ],
  },
  57: {
    definition:
      'A consumer that can receive the same message several times without the result changing: the second pass has no further effect.',
    usage:
      'Messaging systems often guarantee “at least once” delivery: duplicates are normal (replay, recovery after a failure), and it is up to the consumer to neutralise them.',
    exemple:
      'Each payment carries a unique identifier; before crediting an account, the consumer checks that it has not already processed that identifier. The duplicate is ignored.',
    aRetenir:
      'You need a stable identifier, supplied by the sender, and to record “already processed” in the same transaction as the processing: otherwise a failure between the two recreates the duplicate.',
    liens: [
      {
        titre: 'Idempotent Receiver (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/IdempotentReceiver.html',
        langue: 'en',
      },
      {
        titre: 'Idempotent Consumer (microservices.io)',
        url: 'https://microservices.io/patterns/communication-style/idempotent-consumer.html',
        langue: 'en',
      },
    ],
  },
  58: {
    definition:
      'Trying again an operation that failed for a temporary reason (network down, service overloaded, timeout), in the hope that it will succeed next time.',
    usage:
      'Absorbing, without human intervention, the transient errors that are inevitable between distributed systems.',
    exemple:
      'An API call fails with a 503; you retry after 1 s, then 2 s, then 4 s, with a touch of randomness. On the fifth failure, the message goes to the Dead Letter Queue.',
    aRetenir:
      'Only retry temporary errors (not a 400), limit the number of attempts, space them out more and more (exponential backoff with jitter), and only for idempotent operations.',
    liens: [
      {
        titre: 'Retry pattern (Microsoft Learn)',
        url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/retry',
        langue: 'en',
      },
      {
        titre: 'Exponential Backoff And Jitter (AWS)',
        url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/',
        langue: 'en',
      },
    ],
  },
};
