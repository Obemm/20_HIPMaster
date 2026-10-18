import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import type { Illustration } from './metadonnees.ts';

/**
 * Source TypeScript du manifeste lu par le front : numéro de carte → texte alternatif.
 * Le fichier est régénéré à chaque passage du script : il ne se modifie pas à la main.
 */
export async function genererManifeste(illustrations: readonly Illustration[]): Promise<string> {
  const lignes = illustrations.map(({ numero, alt }) => `  ${numero}: ${JSON.stringify(alt)},`);
  const source = [
    '// Fichier généré par `npm run illustrations` (packages/illustrations, ADR 0014) : ne pas modifier à la main.',
    '',
    '/** Cartes du set 1 qui ont une illustration : numéro → texte alternatif. */',
    `export const ILLUSTRATIONS_SET_1: Readonly<Record<number, string>> = {${lignes.length ? '\n' + lignes.join('\n') + '\n' : ''}};`,
    '',
  ].join('\n');
  // La configuration Prettier du dépôt, quel que soit le dossier de sortie : le manifeste passe `format:check`.
  const config = await resolveConfig(fileURLToPath(import.meta.url));
  return format(source, { ...config, parser: 'typescript' });
}
