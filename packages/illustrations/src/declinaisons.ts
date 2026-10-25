import { createHash } from 'node:crypto';
import sharp from 'sharp';

/** Largeurs servies au front, au format 4:3 (ADR 0015). */
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
  numero: number;
  /** Nom du fichier servi, empreinte de son contenu comprise (US-078). */
  nomFichier: string;
  largeur: number;
  format: Format;
  donnees: Buffer;
}

/** Empreinte du contenu d'un fichier servi : 8 caractères hexadécimaux de son SHA-256 (US-078, ADR 0046). */
export const empreinte = (donnees: Buffer) =>
  createHash('sha256').update(donnees).digest('hex').slice(0, 8);

/**
 * Nom d'un fichier servi : `<numero>-<largeur>.<empreinte>.<format>`. L'empreinte change avec le contenu : une image
 * refaite prend une autre adresse, et le cache d'un an des navigateurs ne garde jamais l'ancienne (US-078).
 */
export const nomDeclinaison = (
  numero: number,
  largeur: number,
  format: Format,
  empreinteContenu: string,
) => `${numero}-${largeur}.${empreinteContenu}.${format}`;

const NOM_DECLINAISON = /^(\d+)-(\d+)\.([0-9a-f]{8})\.(avif|webp)$/;

/** Relit un nom de fichier servi ; `undefined` s'il n'a pas la forme de `nomDeclinaison`. */
export function lireNomDeclinaison(
  nomFichier: string,
): { numero: number; largeur: number; format: Format; empreinte: string } | undefined {
  const [, numero, largeur, empreinteContenu, format] = NOM_DECLINAISON.exec(nomFichier) ?? [];
  if (!numero || !largeur || !empreinteContenu || (format !== 'avif' && format !== 'webp')) {
    return undefined;
  }
  return { numero: Number(numero), largeur: Number(largeur), format, empreinte: empreinteContenu };
}

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
        numero,
        nomFichier: nomDeclinaison(numero, largeur, format, empreinte(donnees)),
        largeur,
        format,
        donnees,
      });
    }
  }
  return declinaisons;
}
