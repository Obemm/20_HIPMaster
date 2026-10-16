import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Le fichier .env est unique, à la racine du dépôt : chargement natif Node, sans dépendance.
const fichierEnv = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(fichierEnv)) process.loadEnvFile(fichierEnv);

const schemaConfig = z.object({
  API_HOST: z.string().default('127.0.0.1'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url().optional(),
});

export type Config = z.infer<typeof schemaConfig>;

export const config: Config = schemaConfig.parse(process.env);
