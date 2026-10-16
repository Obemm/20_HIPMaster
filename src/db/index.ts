import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL manquant : copier .env.example en .env');

export const db = drizzle(url, { schema, casing: 'snake_case' });
