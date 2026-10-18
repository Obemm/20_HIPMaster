import Fastify, { type FastifyError } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { DepotParties, type OptionsDepot } from './parties/depot.ts';
import type { Base } from './db/index.ts';
import { routesCartes } from './routes/cartes.ts';
import { routesComptes } from './routes/comptes.ts';
import { routesParties } from './routes/parties.ts';
import { routesRaretes } from './routes/raretes.ts';
import { routesSante } from './routes/sante.ts';

const PROBLEME = 'application/problem+json';
const probleme = (status: number, title: string) => ({ type: 'about:blank', title, status });

/** Construit l'application sans l'écouter : les tests l'interrogent avec `app.inject()`. */
export function construireApp(
  options: { journaux?: boolean; parties?: OptionsDepot; base?: Base } = {},
) {
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
  // Parties en cours, gardées en mémoire (ADR 0014).
  // Comptes invités (US-022) : seulement quand une base est fournie (ADR 0018).
  if (options.base) app.register(routesComptes, { prefix: '/api/v1', base: options.base });
  app.register(routesParties, { prefix: '/api/v1', depot: new DepotParties(options.parties) });

  return app;
}

export type App = ReturnType<typeof construireApp>;
