/**
 * Générateur pseudo-aléatoire à graine (mulberry32) : son état est un entier 32 bits gardé dans la partie, ce qui
 * rend les parties rejouables (ADR 0013).
 */
export function suivant(etat: number): { valeur: number; etat: number } {
  const nouvelEtat = (etat + 0x6d2b79f5) | 0;
  let t = nouvelEtat;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { valeur: ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296, etat: nouvelEtat };
}

/** Porte l'état du générateur et l'avance à chaque tirage. */
export interface SourceAlea {
  alea: number;
}

/** Nombre dans [0, 1[ ; avance l'état du générateur. */
export function tirer(source: SourceAlea): number {
  const { valeur, etat } = suivant(source.alea);
  source.alea = etat;
  return valeur;
}

/** Entier dans [0, max[. */
export function tirerIndex(source: SourceAlea, max: number): number {
  return Math.floor(tirer(source) * max);
}

/** Mélange de Fisher-Yates, en place. */
export function melanger<T>(source: SourceAlea, liste: T[]): void {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = tirerIndex(source, i + 1);
    [liste[i], liste[j]] = [liste[j] as T, liste[i] as T];
  }
}
