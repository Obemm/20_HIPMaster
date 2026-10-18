import { choisirActionBatchDeNuit } from './bot.ts';
import { choisirActionAgentAutonome, choisirActionArchitecteEsb } from './bots-forts.ts';
import type { Strategie } from './simulation.ts';

/** Un niveau de bot, du plus simple au plus fort (US-021). */
export interface NiveauBot {
  id: string;
  nom: string;
  description: string;
  strategie: Strategie;
}

export const NIVEAUX_BOT: readonly NiveauBot[] = [
  {
    id: 'batch-de-nuit',
    nom: 'Batch de nuit',
    description: 'Facile : il suit toujours la même routine, sans réfléchir à la suite.',
    strategie: choisirActionBatchDeNuit,
  },
  {
    id: 'architecte-esb',
    nom: 'Architecte ESB',
    description: 'Moyen : il étudie ses meilleures actions et anticipe le coup suivant.',
    strategie: choisirActionArchitecteEsb,
  },
  {
    id: 'agent-autonome',
    nom: 'Agent autonome',
    description:
      'Difficile : il étudie toutes ses actions possibles et voit les combinaisons d’un coup à l’autre.',
    strategie: choisirActionAgentAutonome,
  },
];

export const NIVEAU_PAR_DEFAUT = 'batch-de-nuit';

export function trouverNiveau(id: string): NiveauBot | undefined {
  return NIVEAUX_BOT.find((n) => n.id === id);
}
