/**
 * Générateur pseudo-aléatoire déterministe (mulberry32) : une même graine donne toujours la même suite,
 * donc une carte donne toujours la même illustration.
 */
export function creerHasard(graine: number): () => number {
  let etat = Math.imul(graine, 2654435761) >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un nombre dans [min, max[ tiré de `hasard`. */
export const entre = (hasard: () => number, min: number, max: number) =>
  min + hasard() * (max - min);
