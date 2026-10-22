import { construireApp } from './app.ts';
import { arreterSurSignal } from './arret.ts';
import { chargerEnv, type ConfigApi, lireConfigApi } from './config.ts';
import { ouvrirBase } from './db/index.ts';
import { creerJournal, messageErreur } from './journaux.ts';
import { limitesMultipliees } from './limites.ts';

chargerEnv();
let config: ConfigApi;
try {
  config = lireConfigApi();
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
const app = construireApp({
  journal,
  projet: config.projetGcp,
  base,
  cleCodes: config.cleCodes,
  proxysDeConfiance: config.proxysDeConfiance,
  ...(config.limitesDebit !== null && { limites: limitesMultipliees(config.limitesDebit) }),
});
// De quoi vérifier dans les journaux la configuration des protections (ADR 0025), sans aucun secret.
journal.info(
  {
    proxysDeConfiance: config.proxysDeConfiance,
    limitesDebit: config.limitesDebit ?? 'desactivees',
  },
  'Protections de l’API',
);
app.addHook('onClose', fermer);
arreterSurSignal(app);

try {
  await app.listen({ host: config.hote, port: config.port });
} catch (erreur) {
  app.log.error(erreur);
  process.exit(1);
}
