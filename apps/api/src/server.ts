import { construireApp } from './app.ts';
import { arreterSurSignal } from './arret.ts';
import { chargerEnv, type Config, lireConfig } from './config.ts';
import { ouvrirBase } from './db/index.ts';
import { creerJournal, messageErreur } from './journaux.ts';

chargerEnv();
let config: Config;
try {
  config = lireConfig();
} catch (erreur) {
  // Par exemple DATABASE_URL absente en production : l'API refuse de démarrer, et dit pourquoi.
  creerJournal({ niveau: 'info' }).fatal(messageErreur(erreur));
  process.exit(1);
}
const journal = creerJournal({ niveau: config.niveauJournal });

// PostgreSQL si DATABASE_URL est renseignée, sinon PGlite (ADR 0018). En production, les migrations passent avant le
// déploiement par la commande `migrer.ts` (ADR 0023) : l'API ne touche pas la base pour démarrer.
const { base, fermer } = await ouvrirBase({
  url: config.databaseUrl,
  locale: config.baseLocale,
  migrer: !config.production,
  pool: config.pool,
  surFermeture: (connexion) => journal.info({ connexion }, 'Connexion PostgreSQL fermée'),
});
const app = construireApp({ journal, projet: config.projetGcp, base });
app.addHook('onClose', fermer);
arreterSurSignal(app);

try {
  await app.listen({ host: config.hote, port: config.port });
} catch (erreur) {
  app.log.error(erreur);
  process.exit(1);
}
