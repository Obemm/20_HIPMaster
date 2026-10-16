import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const routesSante: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/sante',
    { schema: { response: { 200: z.object({ statut: z.literal('ok') }) } } },
    async () => ({ statut: 'ok' as const }),
  );
};
