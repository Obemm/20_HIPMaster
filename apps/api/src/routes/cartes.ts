import {
  type Carte,
  detaillerCapacites,
  FAMILLES,
  ficheDe,
  IDS_CAPACITE,
  LANGUES_LIEN,
  RARETES,
  type Langue,
  SET_1,
  TYPES_CARTE,
  traduireCarte,
  trouverCarte,
} from '@hipmaster/domain';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { cacheCatalogue } from '../cache-catalogue.ts';
import { langueDe } from '../langue.ts';
import { erreurProbleme } from '../problemes.ts';

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
  enInterne: z.string().optional(),
  liens: z.array(
    z.object({
      titre: z.string(),
      url: z.url({ protocol: /^https$/ }),
      langue: z.enum(LANGUES_LIEN),
    }),
  ),
});

const schemaCarteDetaillee = schemaCarte.extend({ fiche: schemaFiche.optional() });

const versApi = (carte: Carte, langue: Langue) => ({
  ...traduireCarte(carte, langue),
  capacites: detaillerCapacites(carte, langue),
});

/** Catalogue des cartes, en lecture seule (ADR 0011), en cache HTTP (US-057), dans la langue demandée (US-081). */
export const routesCartes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/cartes',
    { ...cacheCatalogue, schema: { response: { 200: z.array(schemaCarte) } } },
    async (requete) => {
      const langue = langueDe(requete);
      return SET_1.map((carte) => versApi(carte, langue));
    },
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
      if (!carte) throw erreurProbleme(404, 'carte-inconnue', 'Carte introuvable');
      const langue = langueDe(requete);
      const fiche = ficheDe(carte.numero, langue);
      return {
        ...versApi(carte, langue),
        ...(fiche && { fiche: { ...fiche, liens: [...fiche.liens] } }),
      };
    },
  );
};
