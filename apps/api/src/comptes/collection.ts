import { asc, eq } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { collection } from '../db/schema.ts';

/** Les cartes possédées par un joueur (US-024), par numéro croissant. */
export async function lireCollection(
  base: Base,
  joueurId: string,
): Promise<{ numero: number; exemplaires: number }[]> {
  return base
    .select({ numero: collection.numero, exemplaires: collection.exemplaires })
    .from(collection)
    .where(eq(collection.joueurId, joueurId))
    .orderBy(asc(collection.numero));
}
