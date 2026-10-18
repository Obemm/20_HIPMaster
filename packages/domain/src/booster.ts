import type { Carte } from './carte.ts';
import { tirerRarete } from './rarete.ts';
import { SET_1 } from './set-1.ts';

/** Boosters (US-023, ADR 0019) : le tirage et la recharge, sans base ni horloge (le temps est passé en paramètre). */

export const TAILLE_BOOSTER = 5;

/** Règles de la distribution des boosters ; valeurs réglables, à confirmer par le porteur du projet. */
export interface ReglesBoosters {
  /** Boosters offerts à la création du compte. */
  bienvenue: number;
  /** Délai entre deux boosters gratuits, en millisecondes. */
  intervalleMs: number;
  /** Au-delà, la recharge s'arrête (un booster gagné, lui, peut faire dépasser ce plafond). */
  plafond: number;
  /** Boosters gagnés au plus par jour (jour UTC) en battant le bot (US-025). */
  victoiresParJour: number;
}

export const REGLES_BOOSTERS: ReglesBoosters = {
  bienvenue: 5,
  intervalleMs: 10 * 60 * 1000,
  plafond: 10,
  victoiresParJour: 3,
};

/**
 * Tire les cartes d'un booster : pour chacune, une rareté selon `CHANCES_BOOSTER`, puis une carte au hasard dans
 * cette rareté. `aleatoire` renvoie un nombre dans [0, 1[ ; injecté pour rendre le tirage testable.
 */
export function ouvrirBooster(
  aleatoire: () => number = Math.random,
  catalogue: readonly Carte[] = SET_1,
): number[] {
  return Array.from({ length: TAILLE_BOOSTER }, () => {
    const rarete = tirerRarete(aleatoire);
    const candidates = catalogue.filter((carte) => carte.rarete === rarete);
    const carte = candidates[Math.floor(aleatoire() * candidates.length)];
    if (!carte) throw new Error(`Aucune carte de rareté ${rarete} dans le catalogue.`);
    return carte.numero;
  });
}

/** Le stock tel qu'il est gardé : un nombre de boosters et l'instant d'où court la prochaine recharge. */
export interface StockBoosters {
  stock: number;
  /** Instant (ms depuis l'époque Unix) à partir duquel le prochain booster gratuit se compte. */
  depuis: number;
}

/** Le stock à l'instant `maintenant`, recharges comprises, et le délai avant le prochain booster gratuit. */
export function stockA(
  { stock, depuis }: StockBoosters,
  maintenant: number,
  regles: ReglesBoosters = REGLES_BOOSTERS,
): StockBoosters & { prochainDansMs: number | null } {
  if (stock >= regles.plafond) return { stock, depuis: maintenant, prochainDansMs: null };
  const gagnes = Math.max(0, Math.floor((maintenant - depuis) / regles.intervalleMs));
  const nouveau = Math.min(regles.plafond, stock + gagnes);
  if (nouveau >= regles.plafond)
    return { stock: nouveau, depuis: maintenant, prochainDansMs: null };
  const reference = depuis + gagnes * regles.intervalleMs;
  return {
    stock: nouveau,
    depuis: reference,
    prochainDansMs: reference + regles.intervalleMs - maintenant,
  };
}
