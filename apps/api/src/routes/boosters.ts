import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { lireBoosters, type OptionsBoosters, ouvrirUnBooster } from '../comptes/boosters.ts';
import type { Base } from '../db/index.ts';
import { exigerJoueur, refuser } from './comptes.ts';

// Contrat : apps/api/openapi/boosters.yaml (US-023, ADR 0019).

const schemaBoosters = z.object({
  stock: z.int().min(0),
  plafond: z.int(),
  prochainDans: z.int().nullable(),
});

export const routesBoosters: FastifyPluginAsyncZod<{
  base: Base;
  boosters?: OptionsBoosters;
}> = async (app, { base, boosters: options = {} }) => {
  app.get(
    '/moi/boosters',
    { schema: { response: { 200: schemaBoosters } } },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      return connecte ? lireBoosters(base, connecte.joueur.id, options) : reponse;
    },
  );

  app.post(
    '/moi/boosters/ouvertures',
    {
      schema: {
        response: {
          201: z.object({
            cartes: z.array(z.object({ numero: z.int(), nouvelle: z.boolean() })),
            boosters: schemaBoosters,
          }),
        },
      },
    },
    async (requete, reponse) => {
      const connecte = await exigerJoueur(base, requete, reponse);
      if (!connecte) return reponse;
      const ouverture = await ouvrirUnBooster(base, connecte.joueur.id, options);
      if (!ouverture) return refuser(reponse, 409, 'Aucun booster en stock');
      return reponse.status(201).send(ouverture);
    },
  );
};
