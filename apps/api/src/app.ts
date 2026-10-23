import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyBaseLogger, type FastifyError } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Logger } from 'pino';
import { DepotParties, type OptionsDepot } from './parties/depot.ts';
import type { OptionsBoosters } from './comptes/boosters.ts';
import { type Administrateurs, AUCUN } from './comptes/administrateurs.ts';
import { CLE_CODES_DEVELOPPEMENT } from './comptes/comptes.ts';
import { SITE_DEVELOPPEMENT } from './comptes/invitations.ts';
import type { Base } from './db/index.ts';
import type { OptionsDuels } from './duels/duels.ts';
import { champsTrace, messageErreur } from './journaux.ts';
import type { LimitesDebit } from './limites.ts';
import { routesAdministration } from './routes/administration.ts';
import { routesBoosters } from './routes/boosters.ts';
import { routesCollection } from './routes/collection.ts';
import { routesDuels } from './routes/duels.ts';
import { routesErreurs } from './routes/erreurs.ts';
import { routesCartes } from './routes/cartes.ts';
import { routesComptes } from './routes/comptes.ts';
import { routesParties } from './routes/parties.ts';
import { routesRaretes } from './routes/raretes.ts';
import { routesSante } from './routes/sante.ts';

const PROBLEME = 'application/problem+json';
const probleme = (status: number, title: string) => ({ type: 'about:blank', title, status });

/** Taille maximale d'un corps de requête (ADR 0025) : une action de partie, le plus gros corps légitime, pèse 1 Ko. */
export const CORPS_MAX_OCTETS = 16 * 1024;

/** Titres en français des refus posés par Fastify lui-même, à la place de son message anglais. */
const TITRES: Record<string, string> = {
  FST_ERR_CTP_BODY_TOO_LARGE: 'Corps de requête trop volumineux : 16 Ko au plus',
};

/** Construit l'application sans l'écouter : les tests l'interrogent avec `app.inject()`. */
export function construireApp(
  options: {
    /** Journal de l'API (`creerJournal`) ; aucun journal par défaut (tests). */
    journal?: Logger;
    /** Projet Google Cloud : chaque journal d'une requête porte alors sa trace (US-046). */
    projet?: string | null;
    parties?: OptionsDepot;
    base?: Base;
    boosters?: OptionsBoosters;
    duels?: OptionsDuels;
    /** Clé secrète des codes de récupération et d'invitation (ADR 0025, 0027) ; une clé publique par défaut. */
    cleCodes?: string;
    /** Création de compte réservée aux invités (ADR 0027) ; libre par défaut (développement, tests). */
    inscriptionSurInvitation?: boolean;
    /** Les comptes administrateurs (US-072, ADR 0029) ; personne par défaut. */
    administrateurs?: Administrateurs;
    /** Adresse du site, pour les liens d'invitation ; le front de développement par défaut. */
    site?: string;
    /** Limites de débit par adresse (ADR 0025) ; aucune limitation sans elles (développement, tests). */
    limites?: LimitesDebit;
    /**
     * Relais de confiance devant l'API (Firebase Hosting, frontal de Cloud Run) : l'adresse du joueur est lue dans
     * `X-Forwarded-For`, juste avant leurs maillons. 0 par défaut : l'adresse de la connexion.
     */
    proxysDeConfiance?: number;
  } = {},
) {
  const {
    journal,
    projet = null,
    cleCodes = CLE_CODES_DEVELOPPEMENT,
    administrateurs = AUCUN,
    limites,
  } = options;
  const proxysDeConfiance = options.proxysDeConfiance ?? 0;
  const app = Fastify({
    ...(journal && {
      loggerInstance: journal as FastifyBaseLogger,
      // Les journaux d'une même requête portent la trace posée par Cloud Run, pour les regrouper.
      childLoggerFactory: (parent, liaisons, reglages, requete) =>
        parent.child(
          { ...liaisons, ...champsTrace(requete.headers['x-cloud-trace-context'], projet) },
          reglages,
        ),
    }),
    // Limites posées dès le départ (ADR 0007, inspiré d'ADR-020 Elis), resserrées avant l'ouverture (ADR 0025).
    bodyLimit: CORPS_MAX_OCTETS,
    requestTimeout: 10_000,
    // Les `proxysDeConfiance` derniers maillons (la connexion, puis X-Forwarded-For lu de droite à gauche) sont des
    // relais ; l'adresse du joueur est le maillon suivant. Fastify refuse un simple nombre (aucune confiance) : la
    // fonction dit la même chose.
    ...(proxysDeConfiance > 0 && {
      trustProxy: (_adresse: string, maillon: number) => maillon < proxysDeConfiance,
    }),
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Aucune réponse de l'API ne reste dans un cache, sauf politique propre à une route (catalogue public, US-057) :
  // jetons, codes et données des joueurs n'y ont pas leur place. Jamais d'interprétation du type par le navigateur.
  app.addHook('onSend', async (_requete, reponse, corps) => {
    reponse.header('x-content-type-options', 'nosniff');
    if (!reponse.hasHeader('cache-control')) reponse.header('cache-control', 'no-store');
    return corps;
  });

  // Limitation de débit par adresse (ADR 0025) : chaque route limitée le déclare dans son option `config`.
  if (limites) {
    app.register(rateLimit, {
      global: false,
      // 429 au format Problem Details ; le plugin pose `Retry-After` et les en-têtes `x-ratelimit-*`.
      errorResponseBuilder: (_requete, contexte) =>
        Object.assign(
          new Error(`Trop de requêtes : réessayez dans ${Math.ceil(contexte.ttl / 1000)} s`),
          { statusCode: contexte.statusCode },
        ),
    });
  }

  // Erreurs au format Problem Details (RFC 9457).
  app.setErrorHandler<FastifyError>((erreur, requete, reponse) => {
    const statut = erreur.statusCode ?? 500;
    // Ce gestionnaire remplace celui de Fastify, le seul qui journalisait (US-046) : une erreur 500 laisse ici son
    // message et sa pile ; une requête refusée, son seul code (le message d'une erreur de syntaxe JSON cite le corps).
    // Une limite de débit atteinte est un avertissement (un abus, ou une limite trop basse pour un bureau entier) : il
    // nomme le motif de la route, sans recopier d'identifiant.
    if (statut >= 500) requete.log.error({ err: erreur }, messageErreur(erreur));
    else if (statut === 429)
      requete.log.warn({ route: requete.routeOptions.url }, 'Limite de débit atteinte');
    else requete.log.info({ code: erreur.code, statut }, 'Requête refusée');
    const titre = statut >= 500 ? 'Erreur interne' : (TITRES[erreur.code] ?? erreur.message);
    return reponse.status(statut).type(PROBLEME).send(probleme(statut, titre));
  });
  app.setNotFoundHandler((_requete, reponse) =>
    reponse.status(404).type(PROBLEME).send(probleme(404, 'Ressource introuvable')),
  );

  app.register(routesSante, { prefix: '/api/v1' });
  // Erreurs JavaScript des navigateurs, vers Error Reporting (US-051).
  app.register(routesErreurs, { prefix: '/api/v1', ...(limites && { limites }) });
  app.register(routesRaretes, { prefix: '/api/v1' });
  app.register(routesCartes, { prefix: '/api/v1' });
  // Parties en cours, gardées en mémoire (ADR 0014).
  // Comptes invités (US-022) : seulement quand une base est fournie (ADR 0018).
  if (options.base) {
    app.register(routesComptes, {
      prefix: '/api/v1',
      base: options.base,
      cleCodes,
      inscriptionSurInvitation: options.inscriptionSurInvitation ?? false,
      administrateurs,
      ...(limites && { limites }),
    });
    // Routes réservées aux administrateurs, cachées derrière un 404 pour tout autre appelant (US-072, ADR 0029).
    app.register(routesAdministration, {
      prefix: '/api/v1',
      base: options.base,
      cleCodes,
      administrateurs,
      site: options.site ?? SITE_DEVELOPPEMENT,
      ...(limites && { limites }),
    });
    app.register(routesBoosters, {
      prefix: '/api/v1',
      base: options.base,
      ...(options.boosters && { boosters: options.boosters }),
    });
    app.register(routesCollection, { prefix: '/api/v1', base: options.base });
    app.register(routesDuels, {
      prefix: '/api/v1',
      base: options.base,
      // Les boosters gagnés en duel suivent les mêmes règles que contre le bot (US-038).
      duels: { ...options.duels, ...(options.boosters && { boosters: options.boosters }) },
      ...(limites && { limites }),
    });
  }
  app.register(routesParties, {
    prefix: '/api/v1',
    depot: new DepotParties(options.parties),
    ...(options.base && { base: options.base }),
    ...(options.boosters && { boosters: options.boosters }),
    ...(limites && { limites }),
  });

  return app;
}

export type App = ReturnType<typeof construireApp>;
