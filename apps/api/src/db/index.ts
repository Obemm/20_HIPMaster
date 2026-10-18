import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migrerPglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migrerPostgres } from 'drizzle-orm/postgres-js/migrator';
import * as schema from './schema.ts';

/** La base de l'API, quel que soit le moteur (PostgreSQL ou PGlite, ADR 0018). */
export type Base = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface BaseOuverte {
  base: Base;
  fermer: () => Promise<void>;
}

const MIGRATIONS = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * Ouvre la base et applique les migrations (ADR 0018) : PostgreSQL si `url` est donnée, sinon PGlite, dans le dossier
 * `locale` ou en mémoire (`memory://`).
 */
export async function ouvrirBase(options: {
  url: string | null;
  locale: string;
}): Promise<BaseOuverte> {
  if (options.url) {
    const base = drizzlePostgres(options.url, { schema, casing: 'snake_case' });
    await migrerPostgres(base, { migrationsFolder: MIGRATIONS });
    return { base, fermer: () => base.$client.end() };
  }
  if (options.locale !== 'memory://') mkdirSync(options.locale, { recursive: true });
  const client = new PGlite(options.locale);
  const base = drizzlePglite(client, { schema, casing: 'snake_case' });
  await migrerPglite(base, { migrationsFolder: MIGRATIONS });
  return { base, fermer: () => client.close() };
}
