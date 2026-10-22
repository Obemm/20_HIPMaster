import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema.ts';

/** La base de l'API, quel que soit le moteur (PostgreSQL ou PGlite, ADR 0018). */
export type Base = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface BaseOuverte {
  base: Base;
  fermer: () => Promise<void>;
}

/** Pool de connexions PostgreSQL (ADR 0023). */
export interface OptionsPool {
  /** Connexions au plus : une seule instance de l'API (ADR 0021) et quelques dizaines de joueurs. */
  max: number;
  /** Une connexion inactive se ferme après ce délai : la base Neon ne dort pas tant qu'une connexion reste ouverte. */
  inactiviteSecondes: number;
  /** Délai pour établir une connexion, réveil de la base Neon compris. */
  delaiConnexionSecondes: number;
}

export const POOL_PAR_DEFAUT: OptionsPool = {
  max: 5,
  inactiviteSecondes: 30,
  delaiConnexionSecondes: 10,
};

export interface OptionsBase {
  /** URL PostgreSQL ; sans elle, PGlite dans le dossier `locale` ou en mémoire (`memory://`). */
  url: string | null;
  locale: string;
  /** Applique les migrations à l'ouverture (par défaut) ; la production migre avant le déploiement (ADR 0023). */
  migrer?: boolean;
  pool?: OptionsPool;
  /** Appelée à chaque connexion PostgreSQL fermée : de quoi vérifier que la base peut s'endormir. */
  surFermeture?: (connexion: number) => void;
}

const MIGRATIONS = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * L'URL telle que postgres.js doit la lire (ADR 0023) :
 * - `sslmode=require`, celui des URL de Neon, devient une connexion TLS au certificat vérifié : postgres.js
 *   accepterait sinon n'importe quel certificat ;
 * - `channel_binding` disparaît : postgres.js ne le gère pas et le transmettrait au serveur comme un paramètre inconnu.
 */
export function urlPostgres(url: string): string {
  const lue = new URL(url);
  lue.searchParams.delete('channel_binding');
  if (lue.searchParams.get('sslmode') === 'require') lue.searchParams.set('sslmode', 'verify-full');
  return lue.toString();
}

const optionsCommunes = (pool: OptionsPool) => ({
  connect_timeout: pool.delaiConnexionSecondes,
  // Les avis du serveur (« already exists, skipping » des migrations) ne sont pas des erreurs : pas d'affichage brut.
  onnotice: () => undefined,
});

/**
 * Ouvre la base : PostgreSQL si `url` est donnée, sinon PGlite (ADR 0018). Le pool PostgreSQL ne se connecte qu'à la
 * première requête, et applique d'abord les migrations sauf `migrer: false`.
 */
export async function ouvrirBase(options: OptionsBase): Promise<BaseOuverte> {
  const migrer = options.migrer ?? true;
  if (!options.url) return ouvrirPglite(options.locale, migrer);
  const pool = options.pool ?? POOL_PAR_DEFAUT;
  if (migrer) await migrerPostgres(options.url, pool);
  const client = postgres(urlPostgres(options.url), {
    ...optionsCommunes(pool),
    max: pool.max,
    idle_timeout: pool.inactiviteSecondes,
    ...(options.surFermeture && { onclose: options.surFermeture }),
  });
  const base = drizzle({ client, schema, casing: 'snake_case' });
  // Au plus 5 s pour les requêtes en cours : l'arrêt doit tenir dans le délai de Cloud Run (10 s).
  return { base, fermer: () => client.end({ timeout: 5 }) };
}

/** PGlite, chargé à la demande : l'image de production ne l'embarque pas (US-046). */
async function ouvrirPglite(locale: string, migrer: boolean): Promise<BaseOuverte> {
  const [{ PGlite }, { drizzle: drizzlePglite }, { migrate: migrerPglite }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
    import('drizzle-orm/pglite/migrator'),
  ]);
  if (locale !== 'memory://') mkdirSync(locale, { recursive: true });
  const client = new PGlite(locale);
  const base = drizzlePglite(client, { schema, casing: 'snake_case' });
  if (migrer) await migrerPglite(base, { migrationsFolder: MIGRATIONS });
  return { base, fermer: () => client.close() };
}

export interface BilanMigrations {
  /** Migrations appliquées par cet appel. */
  appliquees: number;
  /** Migrations enregistrées dans la base après l'appel. */
  total: number;
}

/**
 * Applique les migrations d'une base PostgreSQL (ADR 0023), sur une seule connexion et sous verrou consultatif : deux
 * migrations lancées ensemble s'attendent au lieu de s'exécuter en double. Le verrou tombe avec la connexion, fermée à
 * la fin, même en cas d'échec.
 */
export async function migrerPostgres(
  url: string,
  pool: OptionsPool = POOL_PAR_DEFAUT,
): Promise<BilanMigrations> {
  const client = postgres(urlPostgres(url), { ...optionsCommunes(pool), max: 1 });
  const compter = async () => {
    const [table] = await client`select to_regclass('drizzle.__drizzle_migrations') as nom`;
    if (!table?.['nom']) return 0;
    const [ligne] = await client`select count(*)::int as n from drizzle.__drizzle_migrations`;
    return Number(ligne?.['n'] ?? 0);
  };
  try {
    await client`select pg_advisory_lock(hashtext('hipmaster:migrations'))`;
    const avant = await compter();
    await migrate(drizzle({ client, casing: 'snake_case' }), { migrationsFolder: MIGRATIONS });
    const total = await compter();
    return { appliquees: total - avant, total };
  } finally {
    await client.end();
  }
}
