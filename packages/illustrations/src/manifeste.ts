import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import type { Illustration } from './metadonnees.ts';

/** Les textes alternatifs d'une langue, en littéral d'objet : numéro → texte. */
function objetLangue(illustrations: readonly Illustration[], champ: 'alt' | 'altEn'): string {
  const lignes = illustrations.map((illustration) => {
    return `    ${illustration.numero}: ${JSON.stringify(illustration[champ])},`;
  });
  return `{${lignes.length ? '\n' + lignes.join('\n') + '\n  ' : ''}}`;
}

/**
 * Source TypeScript du manifeste lu par le front : langue → numéro de carte → texte alternatif (US-081).
 * Le fichier est régénéré à chaque passage du script : il ne se modifie pas à la main.
 */
export async function genererManifeste(illustrations: readonly Illustration[]): Promise<string> {
  const source = [
    '// Fichier généré par `npm run illustrations` (packages/illustrations, ADR 0015) : ne pas modifier à la main.',
    '',
    '/** Numéro de carte → texte alternatif de son illustration. */',
    'type TextesAlternatifs = Readonly<Record<number, string>>;',
    '',
    '/** Cartes du set 1 qui ont une illustration : langue du site → numéro → texte alternatif. */',
    "export const ILLUSTRATIONS_SET_1: Readonly<Record<'fr' | 'en', TextesAlternatifs>> = {",
    `  fr: ${objetLangue(illustrations, 'alt')},`,
    `  en: ${objetLangue(illustrations, 'altEn')},`,
    '};',
    '',
  ].join('\n');
  // La configuration Prettier du dépôt, quel que soit le dossier de sortie : le manifeste passe `format:check`.
  const config = await resolveConfig(fileURLToPath(import.meta.url));
  return format(source, { ...config, parser: 'typescript' });
}
