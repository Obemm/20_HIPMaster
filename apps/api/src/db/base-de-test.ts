import { getTableName, is, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { type Base, type BaseOuverte, ouvrirBase } from './index.ts';
import * as schema from './schema.ts';

/** Toutes les tables du schéma, pour les vider sans dépendre d'une liste à tenir à jour. */
const TABLES = Object.values(schema)
  .filter((objet) => is(objet, PgTable))
  .map((table) => `"${getTableName(table)}"`);

/** Vide toutes les tables du schéma ; les migrations (schéma `drizzle`) restent appliquées. */
export async function viderBase(base: Base): Promise<void> {
  await base.execute(sql.raw(`TRUNCATE TABLE ${TABLES.join(', ')} CASCADE`));
}

/**
 * Une base PGlite en mémoire pour tout le fichier de test, vidée avant chaque test (US-043).
 *
 * Ouvrir PGlite coûte ≈ 1,6 s (chargement du WASM ; les migrations n'en prennent que 50 ms) : une ouverture par test
 * dépassait le délai des hooks quand tous les fichiers tournent en parallèle sur un poste chargé. Chaque test repart
 * tout de même d'une base vide, comme avec une ouverture par test.
 */
export function baseDeTest(): { readonly base: Base } {
  let ouverte: BaseOuverte | undefined;
  beforeAll(async () => {
    ouverte = await ouvrirBase({ url: null, locale: 'memory://' });
  });
  beforeEach(async () => {
    if (ouverte) await viderBase(ouverte.base);
  });
  afterAll(async () => {
    await ouverte?.fermer();
    ouverte = undefined;
  });
  return {
    get base() {
      if (!ouverte) throw new Error('La base de test n’est pas ouverte (hors d’un test).');
      return ouverte.base;
    },
  };
}
