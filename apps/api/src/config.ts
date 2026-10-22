import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
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

const schemaEnv = z
  .object({
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
  })
  .superRefine((env, contexte) => {
    if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
      contexte.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message:
          'obligatoire en production : PGlite ne sert qu’au développement et aux tests (ADR 0018, 0023)',
      });
    }
    // Neon nomme son point d'accès mutualisé (PgBouncer en mode transaction) « ep-…-pooler » : il casserait le
    // verrou des migrations et demanderait des précautions sur les requêtes préparées (ADR 0023).
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
}

/** Lit la configuration dans les variables d'environnement ; lève une `ErreurConfig` explicite si elle est invalide. */
export function lireConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const lu = schemaEnv.safeParse(env);
  if (!lu.success) throw new ErreurConfig(`Configuration invalide :\n${z.prettifyError(lu.error)}`);
  const e = lu.data;
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
  };
}
