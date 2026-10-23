import { chargerEnv, lireConfig } from './config.ts';
import { ouvrirBase } from './db/index.ts';
import { creerJournal, messageErreur } from './journaux.ts';
import { purger } from './purge/purge.ts';

// Commande de purge (US-054, ADR 0035) : `node apps/api/src/purger.ts`, ou `npm run purge -w apps/api`. En production,
// le job Cloud Run hipmaster-purge l'exécute avec l'image de l'API, chaque nuit, lancé par Cloud Scheduler ; l'API
// n'a aucune tâche de fond.

chargerEnv();
const journal = creerJournal({ niveau: 'info' });
try {
  const config = lireConfig();
  if (!config.databaseUrl) {
    // Ouvrir le dossier PGlite d'une API en marche l'abîmerait.
    throw new Error('DATABASE_URL manque : cette commande purge PostgreSQL.');
  }
  // En production, le déploiement a déjà migré la base (ADR 0023) ; ailleurs, elle l'est au besoin.
  const { base, fermer } = await ouvrirBase({
    url: config.databaseUrl,
    locale: config.baseLocale,
    migrer: !config.production,
    pool: config.pool,
  });
  try {
    const debut = performance.now();
    const bilan = await purger(base, { dureeSessionMs: config.dureeSessionMs });
    journal.info(
      { ...bilan, dureeMs: Math.round(performance.now() - debut) },
      `Purge faite : ${bilan.sessions} session(s) expirée(s), ${bilan.defis} défi(s) jamais accepté(s), ${bilan.parties} partie(s) abandonnée(s) supprimés`,
    );
  } finally {
    await fermer();
  }
} catch (erreur) {
  journal.fatal({ err: erreur }, `Purge en échec : ${messageErreur(erreur)}`);
  process.exitCode = 1;
}
