import { chargerEnv, lireConfig } from './config.ts';
import { migrerPostgres, ouvrirBase } from './db/index.ts';
import { creerJournal, messageErreur } from './journaux.ts';
import { rattraperScores } from './scores/scores.ts';

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
  // Ce qui a été gagné avant le score, ou pendant le déploiement, compte avant que la nouvelle version réponde
  // (US-069, ADR 0044). Sans rien à rattraper, deux lectures légères.
  const { base, fermer } = await ouvrirBase({
    url: config.databaseUrl,
    locale: config.baseLocale,
    migrer: false,
    pool: config.pool,
  });
  try {
    const scores = await rattraperScores(base);
    journal.info(
      scores,
      `Scores rattrapés : ${scores.duels} duel(s), ${scores.victoiresBot} victoire(s) contre le bot`,
    );
  } finally {
    await fermer();
  }
} catch (erreur) {
  journal.fatal({ err: erreur }, `Migrations en échec : ${messageErreur(erreur)}`);
  process.exitCode = 1;
}
