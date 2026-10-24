import { JOUEURS } from '@hipmaster/domain';
import { z } from 'zod';

// Schémas Zod du contrat apps/api/openapi/parties.yaml.

export const schemaAction = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('poser'),
    carte: z.string().max(32),
    // Composant renforcé par OpenAPI ou AsyncAPI (US-019).
    cible: z.string().max(32).optional(),
  }),
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
  // Capacités IA et Migration (US-020).
  z.object({ type: z.literal('outiller'), source: z.string().max(32) }),
  z.object({
    type: z.literal('router'),
    retour: z.string().max(32),
    carte: z.string().max(32),
  }),
  z.object({
    type: z.literal('migrer'),
    source: z.string().max(32),
    carte: z.string().max(32),
  }),
  z.object({ type: z.literal('finirTour') }),
]);

const schemaInstance = z.object({ id: z.string(), numero: z.number().int() });

// Pourquoi une carte de sa main ne se joue pas maintenant (US-071) ; absent une fois la partie terminée.
const schemaCarteEnMain = schemaInstance.extend({ injouable: z.string().nullable().optional() });

const schemaComposant = schemaInstance.extend({
  pv: z.number().int(),
  attaque: z.number().int(),
  poseAuTour: z.number().int(),
  aAttaqueCeTour: z.boolean(),
  dernierTourAttaque: z.number().int().nullable(),
  attaquesSubies: z.number().int(),
  reactifUtilise: z.boolean(),
  entretienImpaye: z.boolean(),
  // Bonus permanent (Prompt système, Few-shot) : sans lui, un bot ne peut pas recalculer l'attaque (US-026).
  bonusAttaque: z.number().int(),
  // Statuts posés par les sorts et les incidents (US-014), affichés sur le plateau.
  immobiliseJusquAuTour: z.number().int().nullable(),
  sansCapacitesJusquAuTour: z.number().int().nullable(),
  doublon: z.boolean(),
  attaqueNulle: z.boolean(),
  coupleA: z.string().nullable(),
  delegue: z.boolean(),
  capacitesEmpruntees: z.array(z.string()),
  // Pourquoi un de ses composants n'attaque pas, pendant son tour (US-041) ; absent chez l'adversaire.
  sansAttaque: z.string().nullable().optional(),
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

/** Usages « une fois par tour » et protections du joueur : lui seul les voit (US-026). */
const schemaMarqueurs = z.object({
  fileDurableUtilisee: z.boolean(),
  parade: z.boolean(),
  siProtegeJusquAuTour: z.number().int().nullable(),
  malusDebit: z.number().int(),
  cronUtilise: z.boolean(),
  delegationUtilisee: z.boolean(),
  outillageUtilise: z.boolean(),
  cacheUtilise: z.boolean(),
  routageUtilise: z.boolean(),
});

export const schemaVue = z.object({
  joueur,
  moi: schemaCamp.extend({
    main: z.array(schemaCarteEnMain),
    aDecommissionne: z.boolean(),
    marqueurs: schemaMarqueurs,
  }),
  adversaire: schemaCamp.extend({ main: z.number().int() }),
  actif: joueur,
  tour: z.number().int(),
  issue: z
    .object({ gagnant: joueur.nullable(), raison: z.enum(['sla', 'tours', 'abandon', 'forfait']) })
    .nullable(),
  actions: z.array(schemaAction),
});

/** Les événements gardent tous leurs champs, qui dépendent de leur type (voir le domaine). */
export const schemaEvenement = z.looseObject({ type: z.string() });

export const schemaPartie = z.object({
  id: z.uuid(),
  version: z.int(),
  deck: z.string(),
  deckAdversaire: z.string(),
  niveau: z.string(),
  vue: schemaVue,
  evenements: z.array(schemaEvenement),
});

export const schemaDeck = z.object({
  id: z.string(),
  nom: z.string(),
  description: z.string(),
  cartes: z.array(z.number().int()),
});

export const schemaNiveau = z.object({ id: z.string(), nom: z.string(), description: z.string() });

// Le conseil du moment (US-066) : une des actions de la vue, et pourquoi.
export const schemaConseil = z.object({
  version: z.number().int(),
  action: schemaAction,
  explication: z.string(),
});
