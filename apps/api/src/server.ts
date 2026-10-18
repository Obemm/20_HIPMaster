import { construireApp } from './app.ts';
import { config } from './config.ts';
import { ouvrirBase } from './db/index.ts';

// Base PostgreSQL si DATABASE_URL est renseignée, sinon PGlite (ADR 0018) ; migrations appliquées au démarrage.
const { base, fermer } = await ouvrirBase({
  url: config.DATABASE_URL ?? null,
  locale: config.BASE_LOCALE,
});
const app = construireApp({ journaux: true, base });
app.addHook('onClose', fermer);

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (erreur) {
  app.log.error(erreur);
  process.exit(1);
}
