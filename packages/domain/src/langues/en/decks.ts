import type { TexteNomme } from '../textes.ts';

/**
 * Les decks prêtés en anglais britannique (US-081), par identifiant : ceux de `DECKS_PRETES` (`combat/decks.ts`), puis
 * les deux decks d'initiation de la partie guidée (`combat/partie-guidee.ts`), qui ont eux aussi un nom et une
 * description.
 */
export const DECKS_EN: Readonly<Record<string, TexteNomme>> = {
  // Héritage
  heritage: {
    nom: 'Legacy',
    description:
      'Files and ESB: slow, solid, a little non-compliant. FTP and webMethods call the tune, and the Dead Letter Queue makes up for the losses.',
  },
  // Moderne
  moderne: {
    nom: 'Modern',
    description:
      'APIs, iPaaS and events: Apigee protects, Solace broadcasts, and both evolve towards AI (AI Gateway, Agent Mesh).',
  },
  // Hybride
  hybride: {
    nom: 'Hybrid',
    description:
      'A bit of every era, some agents and an LLM: the hybrid platform in a single deck, with SFTP ready to migrate.',
  },
  // Initiation (partie guidée)
  initiation: {
    nom: 'Starter',
    description: 'The guided game deck: simple components that attack fast.',
  },
  // Initiation (bot)
  'initiation-bot': {
    nom: 'Starter (bot)',
    description: 'The bot’s deck for the guided game: small components, and Guard.',
  },
};
