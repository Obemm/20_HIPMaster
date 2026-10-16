import { construireApp } from './app.ts';
import { config } from './config.ts';

const app = construireApp({ journaux: true });

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (erreur) {
  app.log.error(erreur);
  process.exit(1);
}
