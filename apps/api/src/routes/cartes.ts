import {
  type Carte,
  detaillerCapacites,
  FAMILLES,
  ficheDe,
  IDS_CAPACITE,
  LANGUES_LIEN,
  RARETES,
  SET_1,
  TYPES_CARTE,
  trouverCarte,
} from '@hipmaster/domain';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { cacheCatalogue } from '../cache-catalogue.ts';

// Contrat : apps/api/openapi/cartes.yaml.
const schemaCapacite = z.object({
  id: z.enum(IDS_CAPACITE),
  nom: z.string(),
  description: z.string(),
  valeur: z.number().int().optional(),
});

const schemaCarte = z.object({
  numero: z.number().int(),
  nom: z.string(),
  famille: z.enum(FAMILLES),
  type: z.enum(TYPES_CARTE),
  rarete: z.enum(RARETES),
  cout: z.number().int(),
  attaque: z.number().int().optional(),
  pv: z.number().int().optional(),
  origine: z.number().int().optional(),
  ia: z.boolean().optional(),
  capacites: z.array(schemaCapacite),
  effet: z.string().optional(),
  enVrai: z.string(),
});

// Fiche « En savoir plus » (US-073, ADR 0036) : servie avec le détail d'une carte seulement.
const schemaFiche = z.object({
  definition: z.string(),
  usage: z.string(),
  exemple: z.string(),
  aRetenir: z.string(),
  chezElis: z.string().optional(),
  liens: z.array(
    z.object({
      titre: z.string(),
      url: z.url({ protocol: /^https$/ }),
      langue: z.enum(LANGUES_LIEN),
    }),
  ),
});

const schemaCarteDetaillee = schemaCarte.extend({ fiche: schemaFiche.optional() });

const versApi = (carte: Carte) => ({ ...carte, capacites: detaillerCapacites(carte) });

/** Catalogue des cartes, en lecture seule (ADR 0011), en cache HTTP (US-057). */
export const routesCartes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/cartes',
    { ...cacheCatalogue, schema: { response: { 200: z.array(schemaCarte) } } },
    async () => SET_1.map(versApi),
  );

  app.get(
    '/cartes/:numero',
    {
      ...cacheCatalogue,
      schema: {
        params: z.object({ numero: z.coerce.number().int().positive() }),
        response: { 200: schemaCarteDetaillee },
      },
    },
    async (requete) => {
      const carte = trouverCarte(requete.params.numero);
      if (!carte) throw Object.assign(new Error('Carte introuvable'), { statusCode: 404 });
      const fiche = ficheDe(carte.numero);
      return { ...versApi(carte), ...(fiche && { fiche: { ...fiche, liens: [...fiche.liens] } }) };
    },
  );
};
