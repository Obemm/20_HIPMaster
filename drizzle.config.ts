import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit ne lit pas .env tout seul (contrairement à Next) : chargement natif Node.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
