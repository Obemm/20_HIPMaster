import { chargerEnv, lireConfig } from './config.ts';
import { migrerPostgres } from './db/index.ts';
import { creerJournal, messageErreur } from './journaux.ts';

// Commande de migration (ADR 0023) : `node apps/api/src/migrer.ts`, ou `npm run db:migrate`. En production, un Cloud
// Run Job l'exécute avec l'image de l'API avant chaque déploiement (US-050) ; l'API ne migre plus au démarrage.

chargerEnv();
const journal = creerJournal({ niveau: 'info' });
try {
  const config = lireConfig();
  if (!config.databaseUrl) {
    // Ouvrir le dossier PGlite d'une API en marche l'abîmerait ; elle le migre d'ailleurs elle-même au démarrage.
    throw new Error(
      'DATABASE_URL manque : cette commande migre PostgreSQL, PGlite se migre au démarrage de l’API.',
    );
  }
  const debut = performance.now();
  const bilan = await migrerPostgres(config.databaseUrl, config.pool);
  journal.info(
    {
      ...bilan,
      hote: new URL(config.databaseUrl).hostname,
      dureeMs: Math.round(performance.now() - debut),
    },
    `Migrations à jour : ${bilan.appliquees} appliquée(s), ${bilan.total} au total`,
  );
} catch (erreur) {
  journal.fatal({ err: erreur }, `Migrations en échec : ${messageErreur(erreur)}`);
  process.exitCode = 1;
}
