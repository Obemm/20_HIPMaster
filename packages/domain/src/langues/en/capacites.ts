import type { IdCapacite } from '../../capacites.ts';
import type { TexteCapacite } from '../textes.ts';

/** Les capacités en anglais britannique (US-081), traduites de `capacites.ts` selon le glossaire de l'EPIC-14. */
export const CAPACITES_EN: Readonly<Record<IdCapacite, TexteCapacite>> = {
  batch: { nom: 'Batch', description: 'Cannot attack two turns in a row.' },
  veteran: {
    nom: 'Veteran',
    description: 'Cannot be targeted by Agentic AI cards or by AI incidents.',
  },
  'non-conforme': {
    nom: 'Non-compliant',
    description: 'At the start of your turn, your System loses 1 SLA while this card is in play.',
  },
  'sur-site': {
    nom: 'On-premises',
    description:
      'At the start of your turn, pay 1 Throughput for upkeep, or the card cannot attack this turn.',
  },
  hub: { nom: 'Hub', description: 'Your other components have +1 attack.' },
  'point-unique': {
    nom: 'Single point of failure',
    description: 'When this card is destroyed, your other components take 1 damage.',
  },
  garde: {
    nom: 'Guard',
    description: 'Must be attacked before your other components and your System.',
  },
  quotas: {
    nom: 'Quotas',
    description: 'Cannot be attacked more than twice per turn.',
  },
  connecteur: {
    nom: 'Connector',
    description: 'When the card is deployed, draw as many cards as the value shown.',
  },
  diffusion: {
    nom: 'Broadcast',
    description:
      'When it attacks a component, it also deals 1 damage to up to 2 other opposing components.',
  },
  reactif: {
    nom: 'Reactive',
    description:
      'Once per turn, when one of your components is attacked, deals 1 damage to the attacker.',
  },
  'file-durable': {
    nom: 'Durable queue',
    description:
      'Once per game, when one of your components is destroyed, it returns to your hand.',
  },
  supervision: {
    nom: 'Monitoring',
    description: 'At the start of your turn, look at the top card of your opponent’s deck.',
  },
  migration: {
    nom: 'Migration',
    description:
      'Once, replace this card with an API or EDA component from your hand, which then costs 2 less.',
  },
  autonome: {
    nom: 'Autonomous',
    description:
      'Does not attack on command: at the start of your turn, it attacks a random valid target.',
  },
  orchestration: {
    nom: 'Orchestration',
    description: 'You choose the target of your Autonomous components.',
  },
  outillage: {
    nom: 'Tooling',
    description:
      'At the start of your turn, choose one of your non-AI components: your agents gain its ability until the end of the turn.',
  },
  delegation: {
    nom: 'Delegation',
    description: 'Once per turn, another of your agents can attack a second time.',
  },
  contexte: {
    nom: 'Context',
    description: '+1 attack for every 2 cards in your discard pile (up to +3).',
  },
  'garde-fous': {
    nom: 'Guardrails',
    description: 'Your AI components are immune to Hallucination and Prompt injection.',
  },
  asynchrone: {
    nom: 'Asynchronous',
    description: 'Your AI components are immune to Timeout and Agent loop.',
  },
  'cache-semantique': {
    nom: 'Semantic cache',
    description: 'Your first AI spell each turn costs nothing.',
  },
  'routage-multi-modeles': {
    nom: 'Multi-model routing',
    description:
      'Once per turn, return one of your AI components to your hand and deploy, for free, an AI component from your hand with an equal or lower cost.',
  },
};
