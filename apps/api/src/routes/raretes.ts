import { CHANCES_BOOSTER, RARETES } from '@hipmaster/domain';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { cacheCatalogue } from '../cache-catalogue.ts';

const schemaRarete = z.object({ rarete: z.enum(RARETES), chance: z.number() });

/** Les chances de chaque rareté dans un booster, calculées par le domaine. */
export const routesRaretes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/raretes',
    { ...cacheCatalogue, schema: { response: { 200: z.array(schemaRarete) } } },
    async () => RARETES.map((rarete) => ({ rarete, chance: CHANCES_BOOSTER[rarete] })),
  );
};
