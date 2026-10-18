import { randomInt } from 'node:crypto';
import { ouvrirBooster, REGLES_BOOSTERS, type ReglesBoosters, stockA } from '@hipmaster/domain';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { collection, joueurs } from '../db/schema.ts';

/** Boosters d'un joueur (US-023, ADR 0019) : le stock se recalcule à chaque lecture, le tirage se fait ici. */

export interface EtatBoosters {
  stock: number;
  plafond: number;
  /** Secondes avant le prochain booster gratuit ; `null` quand le stock est plein. */
  prochainDans: number | null;
}

export interface OptionsBoosters {
  regles?: ReglesBoosters;
  /** Horloge et hasard injectables pour les tests ; par défaut l'heure réelle et un hasard cryptographique. */
  maintenant?: () => number;
  aleatoire?: () => number;
}

const hasardSur = () => randomInt(2 ** 32) / 2 ** 32;

const versEtat = (calcul: ReturnType<typeof stockA>, regles: ReglesBoosters): EtatBoosters => ({
  stock: calcul.stock,
  plafond: regles.plafond,
  prochainDans: calcul.prochainDansMs === null ? null : Math.ceil(calcul.prochainDansMs / 1000),
});

export async function lireBoosters(
  base: Base,
  joueurId: string,
  options: OptionsBoosters = {},
): Promise<EtatBoosters> {
  const regles = options.regles ?? REGLES_BOOSTERS;
  const [ligne] = await base
    .select({ stock: joueurs.boosters, depuis: joueurs.rechargeDepuis })
    .from(joueurs)
    .where(eq(joueurs.id, joueurId));
  if (!ligne) throw new Error('Joueur introuvable.');
  const maintenant = (options.maintenant ?? Date.now)();
  return versEtat(
    stockA({ stock: ligne.stock, depuis: ligne.depuis.getTime() }, maintenant, regles),
    regles,
  );
}

export interface CarteTiree {
  numero: number;
  /** Première fois que le joueur obtient cette carte. */
  nouvelle: boolean;
}

/**
 * Ouvre un booster : décompte le stock, tire 5 cartes et les ajoute à la collection, dans une transaction
 * (le joueur est verrouillé : deux ouvertures simultanées ne consomment pas le même booster).
 * `null` quand le stock est vide.
 */
export async function ouvrirUnBooster(
  base: Base,
  joueurId: string,
  options: OptionsBoosters = {},
): Promise<{ cartes: CarteTiree[]; boosters: EtatBoosters } | null> {
  const regles = options.regles ?? REGLES_BOOSTERS;
  return base.transaction(async (tx) => {
    const [ligne] = await tx
      .select({ stock: joueurs.boosters, depuis: joueurs.rechargeDepuis })
      .from(joueurs)
      .where(eq(joueurs.id, joueurId))
      .for('update');
    if (!ligne) throw new Error('Joueur introuvable.');
    const maintenant = (options.maintenant ?? Date.now)();
    const actuel = stockA(
      { stock: ligne.stock, depuis: ligne.depuis.getTime() },
      maintenant,
      regles,
    );
    if (actuel.stock <= 0) return null;

    const apres = { stock: actuel.stock - 1, depuis: actuel.depuis };
    await tx
      .update(joueurs)
      .set({ boosters: apres.stock, rechargeDepuis: new Date(apres.depuis) })
      .where(eq(joueurs.id, joueurId));

    const numeros = ouvrirBooster(options.aleatoire ?? hasardSur);
    const dejaLa = new Set(
      (
        await tx
          .select({ numero: collection.numero })
          .from(collection)
          .where(and(eq(collection.joueurId, joueurId), inArray(collection.numero, numeros)))
      ).map((l) => l.numero),
    );
    const cartes = numeros.map((numero) => {
      const nouvelle = !dejaLa.has(numero);
      dejaLa.add(numero);
      return { numero, nouvelle };
    });

    const exemplaires = new Map<number, number>();
    for (const numero of numeros) exemplaires.set(numero, (exemplaires.get(numero) ?? 0) + 1);
    await tx
      .insert(collection)
      .values([...exemplaires].map(([numero, n]) => ({ joueurId, numero, exemplaires: n })))
      .onConflictDoUpdate({
        target: [collection.joueurId, collection.numero],
        set: { exemplaires: sql`${collection.exemplaires} + excluded.exemplaires` },
      });

    return { cartes, boosters: versEtat(stockA(apres, maintenant, regles), regles) };
  });
}
