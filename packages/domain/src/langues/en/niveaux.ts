import type { TexteNomme } from '../textes.ts';

/** Les niveaux de bot en anglais britannique (US-081), par identifiant, traduits de `combat/niveaux.ts`. */
export const NIVEAUX_EN: Readonly<Record<string, TexteNomme>> = {
  // Stagiaire
  stagiaire: {
    nom: 'Intern',
    description:
      'Easy: deploys one card per turn, the most expensive one, and charges at your System without thinking. Ideal for beginners.',
  },
  // Batch de nuit
  'batch-de-nuit': {
    nom: 'Nightly Batch',
    description:
      'Medium: follows a well-oiled routine (good trades, spells, decommissions), without thinking ahead.',
  },
  // Architecte ESB
  'architecte-esb': {
    nom: 'ESB Architect',
    description: 'Hard: weighs up its best moves and anticipates the next one.',
  },
  // Agent autonome
  'agent-autonome': {
    nom: 'Autonomous Agent',
    description:
      'Expert: weighs up every possible move and sees the combinations from one move to the next.',
  },
};
