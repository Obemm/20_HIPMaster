import type { Fiche } from '../../../fiches/fiche.ts';

/** Fiches « En savoir plus » de la famille IA agentique, en anglais, par numéro de carte (US-081, ADR 0036). */
export const FICHES_IA_EN: Readonly<Record<number, Fiche>> = {
  39: {
    definition:
      'A Solace framework for building AI agents that cooperate across the event mesh: they discover each other, delegate tasks to one another and share data through events.',
    usage:
      'Connecting agents to the company’s data and events, sharing work between specialised agents, and keeping exchanges asynchronous, decoupled and observable.',
    exemple:
      'A lead agent receives “explain this delivery delay”; it delegates to one agent that reads the orders and to another that queries the carrier, then assembles the answer.',
    aRetenir:
      'Agents that talk to each other are still software: trace every exchange, limit each agent’s permissions, and keep a human for sensitive decisions.',
    liens: [
      {
        titre: 'Solace Agent Mesh',
        url: 'https://solace.com/products/agent-mesh/',
        langue: 'en',
      },
      {
        titre: 'Source code on GitHub',
        url: 'https://github.com/SolaceProducts/solace-agent-mesh',
        langue: 'en',
      },
    ],
  },
  40: {
    definition:
      'Apigee used as a gateway in front of AI models: calls to LLMs go through it, like API calls, so they can be secured, limited and measured.',
    usage:
      'Token quotas per application, semantic cache (a similar question reuses an answer), security filters on prompts, routing to the right model, and cost tracking.',
    exemple:
      'The internal assistant calls the AI through the gateway: it checks the assistant’s token, cuts it off beyond its daily token quota, serves a cached answer if the question has already been asked, otherwise routes it to the model.',
    aRetenir:
      'Centralising access to models avoids keys scattered across the code and surprise bills: a single point to control, measure and switch models.',
    enInterne: 'the company’s future AI gateway, an evolution of its API gateway.',
    liens: [
      {
        titre: 'Apigee AI solutions (Google Cloud)',
        url: 'https://cloud.google.com/solutions/apigee-ai',
        langue: 'en',
      },
    ],
  },
  41: {
    definition:
      'Large Language Model: a neural network trained on huge volumes of text to predict what comes next, token by token, which lets it write, summarise, translate or code.',
    usage:
      'Understanding and producing language: assistants, document summaries, information extraction, request classification, generating code or mappings.',
    exemple:
      'The model is given a complaint email; it extracts the order number, the reason and the tone, in the JSON expected by the ticketing tool.',
    aRetenir:
      'An LLM produces what is plausible, not what is verified: check its outputs (format, facts), do not give it sensitive data without safeguards, and measure its quality on real examples.',
    liens: [
      {
        titre: 'Large language model',
        url: 'https://en.wikipedia.org/wiki/Large_language_model',
        langue: 'en',
      },
    ],
  },
  42: {
    definition:
      'A program in which an LLM decides for itself the steps and tools (search, APIs, code) to reach a goal, in a loop, until it judges the task complete.',
    usage:
      'Handing over multi-step tasks whose path is not known in advance: diagnosing an incident, preparing an analysis, handling a request end to end.',
    exemple:
      '“Why hasn’t order 1234 gone out?” The agent checks the logs, finds the failed message in the Dead Letter Queue, then offers to replay it.',
    aRetenir:
      'Start simple: a fixed sequence of steps is often enough. An agent needs well-described tools, guardrails, a maximum number of steps and a trace of what it did.',
    liens: [
      {
        titre: 'Building effective agents (Anthropic)',
        url: 'https://www.anthropic.com/research/building-effective-agents',
        langue: 'en',
      },
      {
        titre: 'Intelligent agent',
        url: 'https://en.wikipedia.org/wiki/Intelligent_agent',
        langue: 'en',
      },
    ],
  },
  43: {
    definition:
      'A conductor agent that breaks a task down, shares it out between specialised agents, often in parallel, then gathers and checks their results.',
    usage:
      'Handling broad or parallelisable tasks (research, analysing many documents) by giving each agent a narrow role, set of tools and context.',
    exemple:
      'To audit 40 flows, the orchestrator hands five flows to each of its eight sub-agents, then merges their reports into a summary.',
    aRetenir:
      'More agents means more tokens and more coordination: precise instructions for each sub-agent, a limited number of agents, and a check of the final result.',
    liens: [
      {
        titre: 'How we built our multi-agent research system (Anthropic)',
        url: 'https://www.anthropic.com/research/multi-agent-research-system',
        langue: 'en',
      },
      {
        titre: 'Multi-agent system',
        url: 'https://en.wikipedia.org/wiki/Multi-agent_system',
        langue: 'en',
      },
    ],
  },
  44: {
    definition:
      'Model Context Protocol: an open protocol, published by Anthropic in late 2024, that standardises how an AI accesses tools and data. An MCP server exposes those tools.',
    usage:
      'Connecting an assistant or agent to a system (database, API, files, ticketing tool) once, for any MCP-compatible client, instead of writing one integration per model.',
    exemple:
      'An “API catalogue” MCP server exposes the search_api tool; the agent calls it to find the right API before answering the developer.',
    aRetenir:
      'An MCP server gives the AI hands: expose only the tools that are useful, with the user’s permissions, and be wary of the data it returns (prompt injection).',
    liens: [
      {
        titre: 'Model Context Protocol',
        url: 'https://en.wikipedia.org/wiki/Model_Context_Protocol',
        langue: 'en',
      },
      {
        titre: 'Official MCP documentation',
        url: 'https://modelcontextprotocol.io/',
        langue: 'en',
      },
    ],
  },
  45: {
    definition:
      'In A2A (Agent2Agent), an open protocol launched by Google in 2025, the JSON document in which an agent introduces itself: name, skills, address and how to authenticate.',
    usage:
      'Letting one agent discover another and hand it a task, even if they come from different vendors. The card is often published at /.well-known/agent-card.json.',
    exemple:
      'The “delivery tracking” agent publishes its card with the skill “locate a parcel”; the customer service agent reads it, then sends it the task.',
    aRetenir:
      'A card says what an agent claims it can do, not what it does: verify its identity, authenticate calls and give it only the permissions it needs.',
    liens: [
      { titre: 'A2A Protocol', url: 'https://a2a-protocol.org/latest/', langue: 'en' },
      {
        titre: 'The A2A specification',
        url: 'https://a2a-protocol.org/latest/specification/',
        langue: 'en',
      },
    ],
  },
  46: {
    definition:
      'Retrieval-Augmented Generation: before answering, the useful passages are looked up in a document base and given to the model, which builds its answer on them.',
    usage:
      'Getting an LLM to answer on knowledge it has not learnt (internal documentation, procedures, contracts), up to date, citing its sources.',
    exemple:
      '“How do I restart a failed SAP flow?” The system finds the three paragraphs of the procedure that cover it; the model answers, citing them.',
    aRetenir:
      'The answer is only as good as the search: split documents with care, respect access rights, and check that the model really cites its sources.',
    liens: [
      {
        titre: 'Retrieval-augmented generation',
        url: 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation',
        langue: 'en',
      },
      {
        titre: 'The founding paper (2020)',
        url: 'https://arxiv.org/abs/2005.11401',
        langue: 'en',
      },
    ],
  },
  47: {
    definition:
      'A prompting technique that has the model set out its reasoning step by step before its answer, which improves results on multi-step problems.',
    usage:
      'Calculations, logic, diagnosis, planning: by writing out its intermediate steps, the model makes fewer mistakes. Recent models often do it on their own (“thinking” mode).',
    exemple:
      'Rather than “which flow is at fault?”, ask: “list the symptoms, compare them with each flow, then conclude”. The model then rules out the false leads one by one.',
    aRetenir:
      'Displayed reasoning is not proof: it can look sound and still lead to a wrong conclusion. Check the answer, not just the explanation.',
    liens: [
      {
        titre: 'Chain-of-Thought Prompting (2022)',
        url: 'https://arxiv.org/abs/2201.11903',
        langue: 'en',
      },
      {
        titre: 'Prompt engineering',
        url: 'https://en.wikipedia.org/wiki/Prompt_engineering',
        langue: 'en',
      },
    ],
  },
  48: {
    definition:
      'A human in the loop of an automated system or an AI: they approve, correct or reject before an important action is carried out.',
    usage:
      'Keeping control over an agent’s sensitive or irreversible actions (payment, deletion, sending to a customer), and improving the system through human corrections.',
    exemple:
      'The agent prepares the replay of 200 failed messages; it shows a summary and waits for an operator to click “Approve” before launching anything.',
    aRetenir:
      'An approval is only worth something if the human understands what they are approving: present the action and its effects clearly, and do not swamp the operator with requests.',
    liens: [
      {
        titre: 'Human-in-the-loop',
        url: 'https://en.wikipedia.org/wiki/Human-in-the-loop',
        langue: 'en',
      },
    ],
  },
  49: {
    definition:
      'A database that stores texts (or images) as vectors of numbers, the embeddings, and finds those whose meaning is closest to a question.',
    usage:
      'The search building block of RAG systems: finding the right passages even when they do not use the same words as the question.',
    exemple:
      '“My parcel never arrived” finds the “delivery not received” procedure, without a single word in common.',
    aRetenir:
      'Close in meaning does not mean relevant: combine it with keyword search and filters (date, access rights), and take care over how documents are split.',
    liens: [
      {
        titre: 'Vector database',
        url: 'https://en.wikipedia.org/wiki/Vector_database',
        langue: 'en',
      },
      {
        titre: 'Word embedding',
        url: 'https://en.wikipedia.org/wiki/Word_embedding',
        langue: 'en',
      },
    ],
  },
  50: {
    definition:
      'The maximum amount of text, counted in tokens, that a model can take into account at once: instructions, conversation, supplied documents and the answer included.',
    usage:
      'It caps what can be given to the model at one time (a long document, a conversation’s history, an agent’s tool results): from a few thousand to over a million tokens depending on the model.',
    exemple:
      'An agent reading 50,000-line logs fills its window in a few calls: filter, summarise or split rather than giving it everything.',
    aRetenir:
      'Bigger is not always better: a full context is costly, slows things down and scatters the model’s attention. Give it the essentials, at the right moment.',
    liens: [
      {
        titre: 'Context windows (Claude documentation)',
        url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows',
        langue: 'en',
      },
    ],
  },
  51: {
    definition:
      'The instructions given to the model before the conversation (its role, its tone, its rules, what it must do or refuse), which apply to every exchange that follows.',
    usage:
      'Framing an assistant or agent for the long term: its job, its audience, the expected format, the tools it may use and the limits it must not cross.',
    exemple:
      '“You are the integration team’s assistant. Answer in English, cite the procedure used, and never suggest changing production without approval.”',
    aRetenir:
      'A system prompt is not a safe: it can leak or be bypassed (prompt injection). Put no secrets in it, and enforce the real security rules outside the model.',
    liens: [
      {
        titre: 'Prompting best practices (Claude documentation)',
        url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices',
        langue: 'en',
      },
      {
        titre: 'Prompt engineering',
        url: 'https://en.wikipedia.org/wiki/Prompt_engineering',
        langue: 'en',
      },
    ],
  },
  52: {
    definition:
      'Giving the model a few examples (an input, the expected output) in the prompt so that it understands the task and copies the format, without retraining it.',
    usage:
      'Setting an output format, a tone or a rule that is hard to explain: two or three well-chosen examples are often worth a long paragraph of instructions.',
    exemple:
      'To classify tickets, show three tickets already classified (“SFTP connection refused” → network, “empty field” → mapping…), then the new ticket.',
    aRetenir:
      'The model copies everything, flaws included: use varied, correct and representative examples, or it will reproduce their wording or their biases.',
    liens: [
      {
        titre: 'Language Models are Few-Shot Learners (2020)',
        url: 'https://arxiv.org/abs/2005.14165',
        langue: 'en',
      },
      {
        titre: 'Prompt engineering',
        url: 'https://en.wikipedia.org/wiki/Prompt_engineering',
        langue: 'en',
      },
    ],
  },
};
