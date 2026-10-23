import { choisirActionBatchDeNuit } from './bot.ts';
import { choisirActionStagiaire } from './bot-stagiaire.ts';
import { choisirActionAgentAutonome, choisirActionArchitecteEsb } from './bots-forts.ts';
import type { Strategie } from './simulation.ts';

/** Un niveau de bot, du plus simple au plus fort (US-021, US-064). */
export interface NiveauBot {
  id: string;
  nom: string;
  description: string;
  strategie: Strategie;
}

export const NIVEAUX_BOT: readonly NiveauBot[] = [
  {
    id: 'stagiaire',
    nom: 'Stagiaire',
    description:
      'Facile : il pose une carte par tour, la plus chère, et fonce sur votre SI sans calculer. Idéal pour débuter.',
    strategie: choisirActionStagiaire,
  },
  {
    id: 'batch-de-nuit',
    nom: 'Batch de nuit',
    description:
      'Moyen : il suit une routine bien rodée (bons échanges, sorts, décommissionnements), sans réfléchir à la suite.',
    strategie: choisirActionBatchDeNuit,
  },
  {
    id: 'architecte-esb',
    nom: 'Architecte ESB',
    description: 'Difficile : il étudie ses meilleures actions et anticipe le coup suivant.',
    strategie: choisirActionArchitecteEsb,
  },
  {
    id: 'agent-autonome',
    nom: 'Agent autonome',
    description:
      'Expert : il étudie toutes ses actions possibles et voit les combinaisons d’un coup à l’autre.',
    strategie: choisirActionAgentAutonome,
  },
];

/** Le niveau présélectionné : le plus facile, pour qu'une première partie puisse se gagner (US-064). */
export const NIVEAU_PAR_DEFAUT = 'stagiaire';

export function trouverNiveau(id: string): NiveauBot | undefined {
  return NIVEAUX_BOT.find((n) => n.id === id);
}
