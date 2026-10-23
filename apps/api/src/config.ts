import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  type Administrateurs,
  AUCUN,
  lireAdministrateurs,
  TOUS,
} from './comptes/administrateurs.ts';
import { CLE_CODES_DEVELOPPEMENT } from './comptes/comptes.ts';
import { SITE_DEVELOPPEMENT, SITE_PAR_DEFAUT } from './comptes/invitations.ts';
import { type OptionsPool, POOL_PAR_DEFAUT } from './db/index.ts';
import { NIVEAUX_JOURNAL, type NiveauJournal } from './journaux.ts';

const FICHIER_ENV = fileURLToPath(new URL('../../../.env', import.meta.url));

/**
 * Charge le fichier .env unique, à la racine du dépôt (chargement natif Node, sans dépendance). Jamais en production :
 * l'image n'en contient pas, et la configuration y vient des variables du conteneur et de Secret Manager (US-046).
 */
export function chargerEnv(): void {
  if (process.env.NODE_ENV !== 'production' && existsSync(FICHIER_ENV)) {
    process.loadEnvFile(FICHIER_ENV);
  }
}

/** Configuration invalide : le message dit quelle variable corriger. */
export class ErreurConfig extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurConfig';
  }
}

const entierPositif = z.coerce.number().int().positive();

/** Variables communes à l'API et à ses commandes (migrations) : base, écoute, journaux. */
const variablesCommunes = z.object({
  NODE_ENV: z.string().default('development'),
  /** Port imposé par Cloud Run : l'API écoute alors toutes les interfaces. */
  PORT: entierPositif.optional(),
  API_HOST: z.string().min(1).optional(),
  API_PORT: entierPositif.optional(),
  DATABASE_URL: z.url().optional(),
  /** Base PGlite quand DATABASE_URL est absente (ADR 0018) : un dossier, ou `memory://`. */
  BASE_LOCALE: z
    .string()
    .default(fileURLToPath(new URL('../../../.donnees/pglite', import.meta.url))),
  /** Pool PostgreSQL (ADR 0023) : petit, et qui ferme vite ses connexions inactives. */
  BASE_CONNEXIONS_MAX: entierPositif.default(POOL_PAR_DEFAUT.max),
  BASE_INACTIVITE_SECONDES: entierPositif.default(POOL_PAR_DEFAUT.inactiviteSecondes),
  BASE_DELAI_CONNEXION_SECONDES: entierPositif.default(POOL_PAR_DEFAUT.delaiConnexionSecondes),
  LOG_LEVEL: z.enum(NIVEAUX_JOURNAL).default('info'),
  /** Projet Google Cloud : relie chaque journal à la trace de sa requête dans Cloud Logging. */
  GOOGLE_CLOUD_PROJECT: z.string().min(1).optional(),
  /** Jours sans usage au-delà desquels une session expire, puis est purgée (US-054, ADR 0035). */
  SESSIONS_DUREE_JOURS: entierPositif.default(90),
});

/** La clé des codes, pour l'API et la commande des invitations (ADR 0025, 0027) ; pas pour les migrations. */
const variablesCle = z.object({
  ...variablesCommunes.shape,
  /** Clé secrète des codes de récupération et d'invitation : secret `cle-codes-recuperation` en production. */
  CLE_CODES_RECUPERATION: z.string().min(32).optional(),
});

/** Variables du serveur de l'API seul, ses protections (ADR 0025, 0027). */
const variablesApi = z.object({
  ...variablesCle.shape,
  /** Relais devant l'API qui ajoutent leur maillon à X-Forwarded-For : 2 derrière Firebase Hosting et Cloud Run. */
  PROXYS_DE_CONFIANCE: z.coerce.number().int().min(0).max(10).optional(),
  /** Limites de débit : un facteur appliqué aux valeurs de production, ou `desactivees`. */
  LIMITES_DEBIT: z.union([z.literal('desactivees'), z.coerce.number().positive()]).optional(),
  /** Création de compte réservée aux invités : `oui` par défaut en production, `non` ailleurs. */
  INSCRIPTION_SUR_INVITATION: z
    .stringbool({ truthy: ['oui', 'true', '1'], falsy: ['non', 'false', '0'] })
    .optional(),
  /** Administrateurs (US-072, ADR 0029) : identifiants de joueur séparés par des virgules ou des espaces. */
  ADMINISTRATEURS: z.string().optional(),
  /** Adresse du site, pour les liens d'invitation (ADR 0029). */
  ADRESSE_SITE: z.url({ protocol: /^https?$/ }).optional(),
});

type Contexte = z.core.$RefinementCtx;

function exigerEnProduction(
  env: { NODE_ENV: string } & Partial<Record<string, unknown>>,
  contexte: Contexte,
  variable: string,
  raison: string,
): void {
  if (env.NODE_ENV === 'production' && env[variable] === undefined) {
    contexte.addIssue({
      code: 'custom',
      path: [variable],
      message: `obligatoire en production : ${raison}`,
    });
  }
}

function verifierCommunes(env: z.output<typeof variablesCommunes>, contexte: Contexte): void {
  exigerEnProduction(
    env,
    contexte,
    'DATABASE_URL',
    'PGlite ne sert qu’au développement et aux tests (ADR 0018, 0023)',
  );
  // Neon nomme son point d'accès mutualisé (PgBouncer en mode transaction) « ep-…-pooler » : il casserait le verrou
  // des migrations et demanderait des précautions sur les requêtes préparées (ADR 0023).
  if (
    env.DATABASE_URL &&
    URL.canParse(env.DATABASE_URL) &&
    new URL(env.DATABASE_URL).hostname.includes('-pooler.')
  ) {
    contexte.addIssue({
      code: 'custom',
      path: ['DATABASE_URL'],
      message: 'utiliser le point d’accès direct de Neon (sans « -pooler »), voir ADR 0023',
    });
  }
}

function verifierCle(env: z.output<typeof variablesCle>, contexte: Contexte): void {
  verifierCommunes(env, contexte);
  exigerEnProduction(
    env,
    contexte,
    'CLE_CODES_RECUPERATION',
    'la clé publique de développement ne protège aucun code (ADR 0025)',
  );
}

const schemaCommun = variablesCommunes.superRefine(verifierCommunes);

const schemaCle = variablesCle.superRefine(verifierCle);

const schemaApi = variablesApi.superRefine((env, contexte) => {
  verifierCle(env, contexte);
  // Oubliée, cette valeur donnerait à tous les joueurs l'adresse du frontal de Google, donc une seule limite pour tous.
  exigerEnProduction(
    env,
    contexte,
    'PROXYS_DE_CONFIANCE',
    '2 derrière Firebase Hosting et Cloud Run (ADR 0025)',
  );
  const administrateurs = lireAdministrateurs(env.ADMINISTRATEURS);
  if ('erreur' in administrateurs) {
    contexte.addIssue({
      code: 'custom',
      path: ['ADMINISTRATEURS'],
      message: administrateurs.erreur,
    });
  } else if (administrateurs.administrateurs === TOUS && env.NODE_ENV === 'production') {
    contexte.addIssue({
      code: 'custom',
      path: ['ADMINISTRATEURS'],
      message: `« ${TOUS} » ne sert qu’au développement et aux tests (ADR 0029)`,
    });
  }
});

export interface Config {
  /** `NODE_ENV=production` : l'image Docker de l'API (Cloud Run, ADR 0021). */
  production: boolean;
  hote: string;
  port: number;
  /** URL PostgreSQL ; sans elle, PGlite dans `baseLocale` (développement et tests, ADR 0018). */
  databaseUrl: string | null;
  baseLocale: string;
  pool: OptionsPool;
  niveauJournal: NiveauJournal;
  projetGcp: string | null;
  /** Durée sans usage au-delà de laquelle une session expire (US-054) : 90 jours par défaut. */
  dureeSessionMs: number;
}

/** La configuration commune et la clé des codes : celle de la commande des invitations (ADR 0027). */
export interface ConfigCle extends Config {
  /** Clé des codes de récupération et d'invitation ; la clé publique de développement hors production. */
  cleCodes: string;
}

/** La configuration du serveur de l'API : la configuration commune et ses protections (ADR 0025, 0027). */
export interface ConfigApi extends ConfigCle {
  /** Relais de confiance devant l'API (`trustProxy`) ; 0 hors production. */
  proxysDeConfiance: number;
  /** Facteur des limites de débit ; `null` quand elles sont désactivées (par défaut hors production). */
  limitesDebit: number | null;
  /** Création de compte réservée aux invités ; par défaut en production seulement. */
  inscriptionSurInvitation: boolean;
  /** Les comptes administrateurs (US-072, ADR 0029) ; personne par défaut. */
  administrateurs: Administrateurs;
  /** Adresse du site, pour les liens d'invitation : celle du jeu en production, du front de développement ailleurs. */
  site: string;
}

function lire<S extends z.ZodType>(schema: S, env: NodeJS.ProcessEnv): z.output<S> {
  const lu = schema.safeParse(env);
  if (!lu.success) throw new ErreurConfig(`Configuration invalide :\n${z.prettifyError(lu.error)}`);
  return lu.data;
}

function versConfig(e: z.output<typeof variablesCommunes>): Config {
  return {
    production: e.NODE_ENV === 'production',
    // Cloud Run fournit PORT et attend une écoute sur toutes les interfaces ; API_HOST et API_PORT (.env) priment,
    // et le développement garde 127.0.0.1:3000.
    hote: e.API_HOST ?? (e.PORT === undefined ? '127.0.0.1' : '0.0.0.0'),
    port: e.API_PORT ?? e.PORT ?? 3000,
    databaseUrl: e.DATABASE_URL ?? null,
    baseLocale: e.BASE_LOCALE,
    pool: {
      max: e.BASE_CONNEXIONS_MAX,
      inactiviteSecondes: e.BASE_INACTIVITE_SECONDES,
      delaiConnexionSecondes: e.BASE_DELAI_CONNEXION_SECONDES,
    },
    niveauJournal: e.LOG_LEVEL,
    projetGcp: e.GOOGLE_CLOUD_PROJECT ?? null,
    dureeSessionMs: e.SESSIONS_DUREE_JOURS * 24 * 60 * 60 * 1000,
  };
}

/**
 * Lit la configuration commune (base, écoute, journaux) dans les variables d'environnement ; lève une `ErreurConfig`
 * explicite si elle est invalide. C'est celle des commandes, comme les migrations.
 */
export function lireConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return versConfig(lire(schemaCommun, env));
}

/** Lit la configuration commune et la clé des codes ; lève une `ErreurConfig` si elle est invalide. */
export function lireConfigCle(env: NodeJS.ProcessEnv = process.env): ConfigCle {
  const e = lire(schemaCle, env);
  return { ...versConfig(e), cleCodes: e.CLE_CODES_RECUPERATION ?? CLE_CODES_DEVELOPPEMENT };
}

/** Lit la configuration du serveur de l'API, protections comprises ; lève une `ErreurConfig` si elle est invalide. */
export function lireConfigApi(env: NodeJS.ProcessEnv = process.env): ConfigApi {
  const e = lire(schemaApi, env);
  const config = versConfig(e);
  const administrateurs = lireAdministrateurs(e.ADMINISTRATEURS);
  return {
    ...config,
    cleCodes: e.CLE_CODES_RECUPERATION ?? CLE_CODES_DEVELOPPEMENT,
    proxysDeConfiance: e.PROXYS_DE_CONFIANCE ?? 0,
    limitesDebit: facteurLimites(e.LIMITES_DEBIT, config.production),
    // Hors production, le développement et les parcours e2e créent des comptes librement.
    inscriptionSurInvitation: e.INSCRIPTION_SUR_INVITATION ?? config.production,
    // Une valeur invalide a déjà été refusée par le schéma.
    administrateurs: 'administrateurs' in administrateurs ? administrateurs.administrateurs : AUCUN,
    site: e.ADRESSE_SITE ?? (config.production ? SITE_PAR_DEFAUT : SITE_DEVELOPPEMENT),
  };
}

/**
 * Le facteur des limites de débit ; `null` quand elles sont désactivées. Par défaut, 1 en production, désactivées
 * ailleurs : le développement et les parcours e2e créent des dizaines de comptes depuis la même adresse.
 */
function facteurLimites(valeur: number | 'desactivees' | undefined, production: boolean) {
  if (valeur === 'desactivees') return null;
  if (valeur !== undefined) return valeur;
  return production ? 1 : null;
}
