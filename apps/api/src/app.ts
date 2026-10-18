import Fastify, { type FastifyError } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { routesCartes } from './routes/cartes.ts';
import { routesRaretes } from './routes/raretes.ts';
import { routesSante } from './routes/sante.ts';

const PROBLEME = 'application/problem+json';
const probleme = (status: number, title: string) => ({ type: 'about:blank', title, status });

/** Construit l'application sans l'écouter : les tests l'interrogent avec `app.inject()`. */
export function construireApp(options: { journaux?: boolean } = {}) {
  const app = Fastify({
    logger: options.journaux ?? false,
    // Limites posées dès le départ (ADR 0007, inspiré d'ADR-020 Elis).
    bodyLimit: 1024 * 1024,
    requestTimeout: 10_000,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Erreurs au format Problem Details (RFC 9457).
  app.setErrorHandler<FastifyError>((erreur, _requete, reponse) => {
    const statut = erreur.statusCode ?? 500;
    const titre = statut >= 500 ? 'Erreur interne' : erreur.message;
    return reponse.status(statut).type(PROBLEME).send(probleme(statut, titre));
  });
  app.setNotFoundHandler((_requete, reponse) =>
    reponse.status(404).type(PROBLEME).send(probleme(404, 'Ressource introuvable')),
  );

  app.register(routesSante, { prefix: '/api/v1' });
  app.register(routesRaretes, { prefix: '/api/v1' });
  app.register(routesCartes, { prefix: '/api/v1' });

  return app;
}

export type App = ReturnType<typeof construireApp>;
