import {
  type Carte,
  detaillerCapacites,
  FAMILLES,
  IDS_CAPACITE,
  RARETES,
  SET_1,
  TYPES_CARTE,
  trouverCarte,
} from '@hipmaster/domain';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

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

const versApi = (carte: Carte) => ({ ...carte, capacites: detaillerCapacites(carte) });

/** Catalogue des cartes, en lecture seule (ADR 0011). */
export const routesCartes: FastifyPluginAsyncZod = async (app) => {
  app.get('/cartes', { schema: { response: { 200: z.array(schemaCarte) } } }, async () =>
    SET_1.map(versApi),
  );

  app.get(
    '/cartes/:numero',
    {
      schema: {
        params: z.object({ numero: z.coerce.number().int().positive() }),
        response: { 200: schemaCarte },
      },
    },
    async (requete) => {
      const carte = trouverCarte(requete.params.numero);
      if (!carte) throw Object.assign(new Error('Carte introuvable'), { statusCode: 404 });
      return versApi(carte);
    },
  );
};
