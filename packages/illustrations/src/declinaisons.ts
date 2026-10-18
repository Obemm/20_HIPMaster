import sharp from 'sharp';

/** Largeurs servies au front, au format 4:3 (ADR 0014). */
export const LARGEURS = [320, 640] as const;
export const FORMATS = ['avif', 'webp'] as const;
export type Format = (typeof FORMATS)[number];

/** Poids maximal d'un fichier servi (indicateur de réussite d'EPIC-05). */
export const POIDS_MAX = 100 * 1024;

/** Qualités essayées dans l'ordre, jusqu'à passer sous le poids maximal. */
const QUALITES: Record<Format, readonly number[]> = {
  avif: [55, 45, 35, 25],
  webp: [78, 65, 50, 35],
};

export interface Declinaison {
  nomFichier: string;
  largeur: number;
  format: Format;
  donnees: Buffer;
}

export const nomDeclinaison = (numero: number, largeur: number, format: Format) =>
  `${numero}-${largeur}.${format}`;

/** Refuse un original trop petit pour la plus grande largeur servie. */
export async function verifierOriginal(original: Buffer): Promise<string | undefined> {
  const { width } = await sharp(original).metadata();
  const minimum = Math.max(...LARGEURS);
  if (width < minimum) return `largeur ${width} px, il en faut au moins ${minimum}`;
  return undefined;
}

/**
 * Décline un original en toutes les largeurs et tous les formats, recadré en 4:3 sur sa zone la plus marquante.
 * La qualité baisse par paliers tant que le fichier dépasse `POIDS_MAX` ; au dernier palier, il est rendu tel quel
 * et c'est à l'appelant de le refuser.
 */
export async function declinerIllustration(
  numero: number,
  original: Buffer,
): Promise<Declinaison[]> {
  const declinaisons: Declinaison[] = [];
  for (const largeur of LARGEURS) {
    const redimensionnee = sharp(original).resize({
      width: largeur,
      height: (largeur * 3) / 4,
      fit: 'cover',
      position: 'attention',
    });
    for (const format of FORMATS) {
      let donnees = Buffer.alloc(0);
      for (const quality of QUALITES[format]) {
        donnees = await redimensionnee.clone().toFormat(format, { quality }).toBuffer();
        if (donnees.length < POIDS_MAX) break;
      }
      declinaisons.push({
        nomFichier: nomDeclinaison(numero, largeur, format),
        largeur,
        format,
        donnees,
      });
    }
  }
  return declinaisons;
}
