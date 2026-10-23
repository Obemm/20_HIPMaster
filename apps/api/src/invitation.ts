import { AIDE, ErreurArguments, executer, lireArguments } from './comptes/commande-invitation.ts';
import { chargerEnv, lireConfigCle } from './config.ts';
import { ouvrirBase } from './db/index.ts';
import { creerJournal, messageErreur } from './journaux.ts';

// Commande des invitations (US-048, ADR 0027) : `npm run invitation -- …`, ou `node apps/api/src/invitation.ts …`. En
// production, un Cloud Run Job l'exécute avec l'image de l'API (docs/exploitation/README.md).

const ecrire = (ligne: string) => process.stdout.write(`${ligne}\n`);

chargerEnv();
const journal = creerJournal({ niveau: 'info' });
try {
  const commande = lireArguments(process.argv.slice(2));
  if (commande.action === 'aide') {
    ecrire(AIDE);
  } else {
    const config = lireConfigCle();
    if (!config.databaseUrl) {
      // Ouvrir le dossier PGlite d'une API en marche l'abîmerait ; en développement, l'inscription est libre.
      throw new Error(
        'DATABASE_URL manque : cette commande écrit dans PostgreSQL ; en développement, l’inscription est libre.',
      );
    }
    // Hors production, la base est migrée au besoin, comme au démarrage de l'API (ADR 0018) ; en production, le
    // déploiement l'a déjà fait (ADR 0023).
    const { base, fermer } = await ouvrirBase({
      url: config.databaseUrl,
      locale: config.baseLocale,
      migrer: !config.production,
      pool: config.pool,
    });
    try {
      if (!(await executer(commande, base, config.cleCodes, ecrire))) process.exitCode = 1;
    } finally {
      await fermer();
    }
  }
} catch (erreur) {
  if (erreur instanceof ErreurArguments) {
    process.stderr.write(`${erreur.message}\n\n${AIDE}\n`);
    process.exitCode = 2;
  } else {
    journal.fatal({ err: erreur }, `Invitations en échec : ${messageErreur(erreur)}`);
    process.exitCode = 1;
  }
}
