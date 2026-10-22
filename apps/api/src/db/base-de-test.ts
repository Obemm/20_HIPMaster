import { randomUUID } from 'node:crypto';
import { getTableName, is, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
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

/** Une base PostgreSQL vide, créée sur le serveur de `url` pour un fichier de test (US-056), et de quoi la supprimer. */
export async function creerBaseVide(
  url: string,
): Promise<{ url: string; supprimer: () => Promise<void> }> {
  const serveur = postgres(url, { max: 1, onnotice: () => undefined });
  const nom = `hipmaster_test_${randomUUID().replaceAll('-', '')}`;
  await serveur.unsafe(`create database ${nom}`);
  const urlBase = new URL(url);
  urlBase.pathname = `/${nom}`;
  return {
    url: urlBase.toString(),
    supprimer: async () => {
      await serveur.unsafe(`drop database if exists ${nom} with (force)`);
      await serveur.end();
    },
  };
}

/** PGlite en mémoire, ou une base PostgreSQL vide quand `DATABASE_URL` est posée, migrée à l'ouverture. */
async function ouvrirBaseDeTest(): Promise<BaseOuverte> {
  const url = process.env['DATABASE_URL'];
  if (!url) return ouvrirBase({ url: null, locale: 'memory://' });
  const vide = await creerBaseVide(url);
  try {
    const ouverte = await ouvrirBase({ url: vide.url, locale: 'memory://' });
    return {
      base: ouverte.base,
      fermer: async () => {
        await ouverte.fermer();
        await vide.supprimer();
      },
    };
  } catch (erreur) {
    await vide.supprimer();
    throw erreur;
  }
}

/**
 * Une base pour tout le fichier de test, vidée avant chaque test (US-043) : PGlite en mémoire, ou, quand
 * `DATABASE_URL` est posée (job « API sur PostgreSQL » de la CI, US-056), une base PostgreSQL créée pour le fichier.
 *
 * Ouvrir PGlite coûte ≈ 1,6 s (chargement du WASM ; les migrations n'en prennent que 50 ms) : une ouverture par test
 * dépassait le délai des hooks quand tous les fichiers tournent en parallèle sur un poste chargé. Chaque test repart
 * tout de même d'une base vide, comme avec une ouverture par test.
 */
export function baseDeTest(): { readonly base: Base } {
  let ouverte: BaseOuverte | undefined;
  beforeAll(async () => {
    ouverte = await ouvrirBaseDeTest();
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
