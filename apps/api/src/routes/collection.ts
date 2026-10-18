import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { lireCollection } from '../comptes/collection.ts';
import type { Base } from '../db/index.ts';
import { exigerJoueur } from './comptes.ts';

// Contrat : apps/api/openapi/collection.yaml (US-024).

export const routesCollection: FastifyPluginAsyncZod<{ base: Base }> = async (app, { base }) => {
  app.get(
    '/moi/collection',
    {
      schema: {
        response: {
          200: z.object({
            cartes: z.array(z.object({ numero: z.int(), exemplaires: z.int().min(1) })),
          }),
        },
      },
    },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      return connecte ? { cartes: await lireCollection(base, connecte.joueur.id) } : reponse;
    },
  );
};
