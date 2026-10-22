import { readFileSync } from 'node:fs';
import { count } from 'drizzle-orm';
import { pgSchema, serial } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { creerJoueur } from '../comptes/comptes.ts';
import { creerBaseVide } from './base-de-test.ts';
import { type Base, ouvrirBase } from './index.ts';
import { joueurs } from './schema.ts';

/** Nombre de migrations du dépôt, d'après le journal de drizzle-kit. */
const MIGRATIONS = (
  JSON.parse(
    readFileSync(new URL('../../drizzle/meta/_journal.json', import.meta.url), 'utf8'),
  ) as { entries: unknown[] }
).entries.length;

/** La table où le migrateur de Drizzle note les migrations appliquées. */
const migrationsAppliquees = pgSchema('drizzle').table('__drizzle_migrations', { id: serial() });

async function migrationsEnregistrees(base: Base): Promise<number | undefined> {
  const [ligne] = await base.select({ n: count() }).from(migrationsAppliquees);
  return ligne?.n;
}

// Sur un vrai PostgreSQL seulement (job « API sur PostgreSQL » de la CI) : PGlite repart d'une base en mémoire neuve
// à chaque ouverture.
describe.skipIf(!process.env['DATABASE_URL'])('migrations sur PostgreSQL (US-056)', () => {
  it('s’appliquent à une base vide, puis une seconde fois sans effet', async () => {
    const vide = await creerBaseVide(process.env['DATABASE_URL'] ?? '');
    try {
      const premiere = await ouvrirBase({ url: vide.url, locale: 'memory://' });
      expect(await migrationsEnregistrees(premiere.base)).toBe(MIGRATIONS);
      await creerJoueur(premiere.base, 'Ada');
      await premiere.fermer();

      const seconde = await ouvrirBase({ url: vide.url, locale: 'memory://' });
      expect(await migrationsEnregistrees(seconde.base)).toBe(MIGRATIONS);
      expect(await seconde.base.select({ pseudo: joueurs.pseudo }).from(joueurs)).toEqual([
        { pseudo: 'Ada' },
      ]);
      await seconde.fermer();
    } finally {
      await vide.supprimer();
    }
  });
});
