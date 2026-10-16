/** Raretés des cartes, de la plus courante à la plus rare. */
export const RARETES = ['commune', 'rare', 'epique', 'legendaire'] as const;
export type Rarete = (typeof RARETES)[number];

/** Chances d'obtenir chaque rareté à l'ouverture d'un booster (somme = 1). Valeurs provisoires. */
export const CHANCES_BOOSTER: Record<Rarete, number> = {
  commune: 0.7,
  rare: 0.22,
  epique: 0.07,
  legendaire: 0.01,
};

/**
 * Tire une rareté selon `CHANCES_BOOSTER`.
 * `aleatoire` renvoie un nombre dans [0, 1[ ; injecté pour rendre le tirage testable.
 */
export function tirerRarete(aleatoire: () => number = Math.random): Rarete {
  let seuil = aleatoire();
  for (const rarete of RARETES) {
    seuil -= CHANCES_BOOSTER[rarete];
    if (seuil < 0) return rarete;
  }
  return 'commune';
}
