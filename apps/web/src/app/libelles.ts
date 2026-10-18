export type Rarete = 'commune' | 'rare' | 'epique' | 'legendaire';

export const LIBELLES_RARETE: Record<Rarete, string> = {
  commune: 'Commune',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
};

/** Symbole affiché avec le libellé : la rareté ne se lit pas seulement à la couleur. */
export const SYMBOLES_RARETE: Record<Rarete, string> = {
  commune: '●',
  rare: '◆',
  epique: '▲',
  legendaire: '★',
};
