import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from '../config.ts';
import * as schema from './schema.ts';

/** Connexion à la base, créée à la première utilisation (l'API démarre aussi sans base). */
export function connecterBase(url = config.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL manquant : copier .env.example en .env');
  return drizzle(url, { schema, casing: 'snake_case' });
}
