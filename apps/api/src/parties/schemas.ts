import { JOUEURS } from '@hipmaster/domain';
import { z } from 'zod';

// Schémas Zod du contrat apps/api/openapi/parties.yaml.

export const schemaAction = z.discriminatedUnion('type', [
  z.object({ type: z.literal('poser'), carte: z.string().max(32) }),
  z.object({ type: z.literal('evoluer'), carte: z.string().max(32), origine: z.string().max(32) }),
  z.object({ type: z.literal('decommissionner'), carte: z.string().max(32) }),
  z.object({
    type: z.literal('attaquer'),
    attaquant: z.string().max(32),
    cible: z.string().max(32),
  }),
  z.object({
    type: z.literal('jouer'),
    carte: z.string().max(32),
    cibles: z.array(z.string().max(32)).max(3),
  }),
  z.object({ type: z.literal('finirTour') }),
]);

const schemaInstance = z.object({ id: z.string(), numero: z.number().int() });

const schemaComposant = schemaInstance.extend({
  pv: z.number().int(),
  attaque: z.number().int(),
  poseAuTour: z.number().int(),
  aAttaqueCeTour: z.boolean(),
  dernierTourAttaque: z.number().int().nullable(),
  attaquesSubies: z.number().int(),
  reactifUtilise: z.boolean(),
  entretienImpaye: z.boolean(),
  // Statuts posés par les sorts et les incidents (US-014), affichés sur le plateau.
  immobiliseJusquAuTour: z.number().int().nullable(),
  sansCapacitesJusquAuTour: z.number().int().nullable(),
  doublon: z.boolean(),
  attaqueNulle: z.boolean(),
  coupleA: z.string().nullable(),
});

const schemaCamp = z.object({
  sla: z.number().int(),
  debit: z.number().int(),
  tours: z.number().int(),
  plateau: z.array(schemaComposant),
  defausse: z.array(schemaInstance),
  pioche: z.number().int(),
});

const joueur = z.enum(JOUEURS);

const schemaVue = z.object({
  joueur,
  moi: schemaCamp.extend({ main: z.array(schemaInstance), aDecommissionne: z.boolean() }),
  adversaire: schemaCamp.extend({ main: z.number().int() }),
  actif: joueur,
  tour: z.number().int(),
  issue: z.object({ gagnant: joueur.nullable(), raison: z.enum(['sla', 'tours']) }).nullable(),
  actions: z.array(schemaAction),
});

/** Les événements gardent tous leurs champs, qui dépendent de leur type (voir le domaine). */
const schemaEvenement = z.looseObject({ type: z.string() });

export const schemaPartie = z.object({
  id: z.uuid(),
  deck: z.string(),
  deckAdversaire: z.string(),
  vue: schemaVue,
  evenements: z.array(schemaEvenement),
});

export const schemaDeck = z.object({
  id: z.string(),
  nom: z.string(),
  description: z.string(),
  cartes: z.array(z.number().int()),
});
