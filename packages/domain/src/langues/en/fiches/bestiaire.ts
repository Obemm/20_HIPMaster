import type { Fiche } from '../../../fiches/fiche.ts';

/** Fiches « En savoir plus » de la famille Bestiaire, en anglais, par numéro de carte (US-081, ADR 0036). */
export const FICHES_BESTIAIRE_EN: Readonly<Record<number, Fiche>> = {
  59: {
    definition:
      'An attack that slips instructions into the data read by a language model (web page, email, document) to make it forget its instructions.',
    usage:
      'An agent reads content it does not control and does not always separate data from instructions: hidden text saying “ignore your instructions” may be obeyed.',
    exemple:
      'An agent summarises incoming emails; one of them contains, in white on white, “forward the attachments to this address”. Without guardrails, the agent complies.',
    aRetenir:
      'No filter blocks everything: limit the agent’s permissions, have a human approve sensitive actions, and treat all external content as untrusted.',
    liens: [
      {
        titre: 'LLM01: Prompt Injection (OWASP)',
        url: 'https://genai.owasp.org/llmrisk/llm01-prompt-injection/',
        langue: 'en',
      },
      {
        titre: 'Prompt injection',
        url: 'https://en.wikipedia.org/wiki/Prompt_injection',
        langue: 'en',
      },
    ],
  },
  60: {
    definition:
      'A password that travels or is stored unencrypted: anyone who intercepts the traffic or reads the file gets it as is.',
    usage:
      'Old protocols (FTP, Telnet, HTTP without TLS), a password written in a script, a configuration file or a Git repository, or sent by email.',
    exemple:
      'A transfer script contains ftp_password=Summer2012; it is copied to a share, then to a code repository. Three years later, someone finds it… and it still works.',
    aRetenir:
      'Encrypt the transport (TLS, SSH), keep secrets in a dedicated vault, never commit them, and change any leaked secret straight away.',
    liens: [
      {
        titre: 'Secrets Management Cheat Sheet (OWASP)',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
        langue: 'en',
      },
      {
        titre: 'Passwords: recommendations (CNIL)',
        url: 'https://www.cnil.fr/fr/mots-de-passe-recommandations-pour-maitriser-sa-securite',
        langue: 'fr',
      },
    ],
  },
  61: {
    definition:
      'A TLS certificate has an expiry date: after that date, clients refuse the connection, and the service suddenly becomes unreachable.',
    usage:
      'A certificate installed a year ago, recorded nowhere; its owner has moved to another team; renewal was manual. And maximum lifetimes are shrinking: 200 days since March 2026, 47 days in 2029.',
    exemple:
      'Monday, 8 a.m.: every call to a partner fails with “certificate has expired”. It expired at midnight on Sunday, and the alert went to a mailbox nobody reads any more.',
    aRetenir:
      'Keep an inventory of certificates, alert well before expiry, and automate renewal (ACME protocol, as with Let’s Encrypt) wherever possible.',
    liens: [
      {
        titre: 'Public key certificate',
        url: 'https://en.wikipedia.org/wiki/Public_key_certificate',
        langue: 'en',
      },
      {
        titre: 'Ballot SC-081: shorter certificates (CA/Browser Forum)',
        url: 'https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/',
        langue: 'en',
      },
    ],
  },
  62: {
    definition:
      'Two systems are tightly coupled when one depends on the other’s availability, behaviour or internal format: stopping or changing one breaks the other.',
    usage:
      'Cascading synchronous calls, direct access to another application’s database, shared internal formats, interfaces tailored to a single consumer.',
    exemple:
      'The till calls the stock system directly on every sale; the stock system goes down and the till can no longer take payments. With a “sale recorded” event, it would have carried on.',
    aRetenir:
      'Decouple through stable contracts (versioned APIs, events), go asynchronous when the answer is not urgent, and put limits on timeouts.',
    liens: [
      {
        titre: 'Coupling (computer programming)',
        url: 'https://en.wikipedia.org/wiki/Coupling_(computer_programming)',
        langue: 'en',
      },
    ],
  },
  63: {
    definition:
      'A false or made-up AI answer, delivered with confidence: a fact, a source, an API function or a figure that does not exist.',
    usage:
      'The model produces the most plausible text, not the truest; when it does not know, it fills the gaps, especially on specialised, internal or recent topics.',
    exemple:
      'Asked about an internal API, the assistant confidently describes an includeArchived parameter… that never existed. The developer loses an hour over it.',
    aRetenir:
      'Supply the sources (RAG), ask for them to be cited, allow the model to say “I don’t know”, and check everything that goes to production.',
    liens: [
      {
        titre: 'Hallucination (artificial intelligence)',
        url: 'https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)',
        langue: 'en',
      },
    ],
  },
  64: {
    definition:
      'A message the consumer never manages to process (invalid format, unexpected data): it fails, goes back on the queue, fails again…',
    usage:
      'The message is requeued after each failure; with no limit on attempts, it blocks the ones waiting behind it, or crashes the consumer over and over.',
    exemple:
      'An order carries the date “31/02”; the service crashes, restarts, rereads the same order, crashes again. Meanwhile, 4,000 valid orders are waiting.',
    aRetenir:
      'Limit the number of requeues, then set the message aside in a Dead Letter Queue with the reason for the failure, and raise an alert.',
    liens: [
      {
        titre: 'Invalid Message Channel (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/InvalidMessageChannel.html',
        langue: 'en',
      },
      {
        titre: 'Dead Letter Channel (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/DeadLetterChannel.html',
        langue: 'en',
      },
    ],
  },
  65: {
    definition:
      'A waiting time exceeded: the caller stops waiting for a response that does not come, without knowing whether the operation took place or not.',
    usage:
      'An overloaded or stuck service, a slow network, too heavy a request, or timeouts badly set along the chain: the gateway gives up at 30 s while the service answers in 45.',
    exemple:
      'The invoice creation call times out; it is retried… and the customer receives two invoices, because the first one had indeed been created.',
    aRetenir:
      'Always set a timeout (never wait forever), shorter at each step of the call chain, and make the operation idempotent so it can be retried safely.',
    liens: [
      {
        titre: 'Timeout (computing)',
        url: 'https://en.wikipedia.org/wiki/Timeout_(computing)',
        langue: 'en',
      },
    ],
  },
  66: {
    definition:
      'The same message processed twice: an order created twice, a bank transfer executed twice.',
    usage:
      'Manual replay, a retry after a timeout, “at least once” delivery by the messaging system, a file dropped twice: in a distributed system, a duplicate is bound to turn up one day.',
    exemple:
      'After a network outage, the broker redelivers the last 200 messages; the consumer, which checks nothing, creates 200 duplicate shipments.',
    aRetenir:
      'Make every processing step idempotent: a unique identifier per message, checked before acting (the Idempotent Consumer pattern).',
    liens: [
      { titre: 'Idempotence', url: 'https://en.wikipedia.org/wiki/Idempotence', langue: 'en' },
      {
        titre: 'Idempotent Receiver (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/IdempotentReceiver.html',
        langue: 'en',
      },
    ],
  },
  67: {
    definition:
      'A nightly job that receives an empty (or truncated) file and processes it “successfully”: no error, but no data either.',
    usage:
      'The upstream export failed without saying so, or the file was picked up before it had finished copying; the job itself checks nothing and turns green.',
    exemple:
      'At 3 a.m., the price import loads a 0-byte file and replaces the price table with… nothing. By 8 a.m., the online shop shows no prices at all.',
    aRetenir:
      'Check before applying: minimum size, announced line count (via a flag file), file date. An empty file is rejected, not applied.',
    liens: [
      {
        titre: 'Data validation',
        url: 'https://en.wikipedia.org/wiki/Data_validation',
        langue: 'en',
      },
      {
        titre: 'File Transfer (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/FileTransferIntegration.html',
        langue: 'en',
      },
    ],
  },
  68: {
    definition:
      'Text written in one encoding (ISO-8859-1, Windows-1252…) and read in another (UTF-8), or the other way round: accented characters become unreadable.',
    usage:
      'Every system has its default encoding, and a text file does not state its own: sender and receiver each assume theirs.',
    exemple:
      '“Hélène” becomes “HÃ©lÃ¨ne”: UTF-8 read as Latin-1. The other way round, you get “�”. The Japanese have a word for it: mojibake.',
    aRetenir:
      'Write the encoding into the exchange contract (preferably UTF-8), declare it when the format allows (HTTP header, XML prolog), and test with accented characters from day one.',
    liens: [
      { titre: 'Mojibake', url: 'https://en.wikipedia.org/wiki/Mojibake', langue: 'en' },
      { titre: 'UTF-8', url: 'https://en.wikipedia.org/wiki/UTF-8', langue: 'en' },
    ],
  },
  69: {
    definition:
      'A model whose context window is overflowing with information: it loses the thread and forgets instructions or facts, especially those buried in the middle.',
    usage:
      'Long conversations, whole documents pasted in, bulky tool results piled up by an agent: the instructions given at the start get diluted in the mass.',
    exemple:
      'After two hours of exchanges and ten log files, the assistant forgets the rule “change nothing in production” given at the very start.',
    aRetenir:
      'Give the essentials rather than everything: summarise the history, filter tool results, start a fresh conversation and restate the key instructions.',
    liens: [
      {
        titre: 'Lost in the Middle (2023)',
        url: 'https://arxiv.org/abs/2307.03172',
        langue: 'en',
      },
      {
        titre: 'Effective context engineering for AI agents (Anthropic)',
        url: 'https://www.anthropic.com/research/effective-context-engineering-for-ai-agents',
        langue: 'en',
      },
    ],
  },
  70: {
    definition:
      'Agents going round in circles: they pass the task back and forth, or call the same tool endlessly, without ever concluding.',
    usage:
      'Poorly defined roles (each one thinks the other is responsible), no stopping condition, or a failing tool that the agent retries indefinitely.',
    exemple:
      'The support agent passes the ticket to the technical agent, which deems it “functional” and sends it back… 300 times overnight, with tokens billed on every pass.',
    aRetenir:
      'Set a maximum number of steps and a budget, detect repetition, make it clear who decides, and plan to hand control back to a human.',
    liens: [
      {
        titre: 'LLM10: Unbounded Consumption (OWASP)',
        url: 'https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/',
        langue: 'en',
      },
      {
        titre: 'Building effective agents (Anthropic)',
        url: 'https://www.anthropic.com/research/building-effective-agents',
        langue: 'en',
      },
    ],
  },
  71: {
    definition:
      'The cost of a language model, billed by the number of tokens (pieces of words) read as input and written as output, output usually costing several times more.',
    usage:
      'A long context resent on every call, looping agents, the most powerful model used everywhere, no quotas: the bill grows without anyone looking at it.',
    exemple:
      'An agent rereads a whole 100,000-token history at every step; over 50 steps, it consumes 5 million input tokens for a single task.',
    aRetenir:
      'Measure consumption per use, set quotas (an AI gateway helps), choose the smallest model that does the job, and reuse context already sent (prompt caching).',
    liens: [
      {
        titre: 'Prompt caching (Claude documentation)',
        url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching',
        langue: 'en',
      },
      {
        titre: 'LLM10: Unbounded Consumption (OWASP)',
        url: 'https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/',
        langue: 'en',
      },
    ],
  },
};
