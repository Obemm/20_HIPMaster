/** Score et cote de duel (US-069, ADR 0044) : la règle, sans base ni horloge. */

export interface ReglesScore {
  /** Points d'une victoire contre le bot, selon son niveau (identifiant de `NIVEAUX_BOT`). */
  victoireBot: Readonly<Record<string, number>>;
  /** Victoire contre le bot d'avant le score, dont le niveau n'est plus connu (parties purgées après 24 heures). */
  victoireBotSansNiveau: number;
  victoireDuel: number;
  /** Duel nul : chacun des deux joueurs. */
  nulDuel: number;
  /** Au-delà, les victoires du jour (UTC) ne rapportent plus de points, bot et duels confondus. */
  victoiresCompteesParJour: number;
  coteInitiale: number;
  /** Facteur K de la cote : l'écart maximal gagné ou perdu en un duel. */
  facteurK: number;
}

export const REGLES_SCORE: ReglesScore = {
  victoireBot: { stagiaire: 1, 'batch-de-nuit': 2, 'architecte-esb': 3, 'agent-autonome': 5 },
  victoireBotSansNiveau: 1,
  victoireDuel: 5,
  nulDuel: 2,
  victoiresCompteesParJour: 10,
  coteInitiale: 1000,
  facteurK: 32,
};

/** Les points d'une victoire contre le bot de ce niveau ; un niveau inconnu vaut comme une victoire sans niveau. */
export function pointsVictoireBot(niveau: string, regles: ReglesScore = REGLES_SCORE): number {
  return regles.victoireBot[niveau] ?? regles.victoireBotSansNiveau;
}

/** Résultat d'un duel pour le premier joueur : 1 victoire, 0,5 nul, 0 défaite. */
export type ResultatDuel = 1 | 0.5 | 0;

/**
 * Les deux cotes après un duel, à la manière d'Elo : le gagnant prend au perdant d'autant plus que sa victoire était
 * inattendue. Ce que l'un gagne, l'autre le perd : la somme des cotes ne change pas.
 */
export function cotesApresDuel(
  coteA: number,
  coteB: number,
  resultatA: ResultatDuel,
  regles: ReglesScore = REGLES_SCORE,
): [number, number] {
  const attendu = 1 / (1 + 10 ** ((coteB - coteA) / 400));
  const ecart = Math.round(regles.facteurK * (resultatA - attendu));
  return [coteA + ecart, coteB - ecart];
}
