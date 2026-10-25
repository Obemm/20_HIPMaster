import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { FORMATS, LARGEURS, type Declinaison } from './declinaisons.ts';
import type { Illustration } from './metadonnees.ts';

/** Ce que le manifeste retient d'un fichier servi. */
export type FichierServi = Pick<Declinaison, 'numero' | 'largeur' | 'format' | 'nomFichier'>;

/** Les textes alternatifs d'une langue, en littéral d'objet : numéro → texte. */
function objetLangue(illustrations: readonly Illustration[], champ: 'alt' | 'altEn'): string {
  const lignes = illustrations.map((illustration) => {
    return `    ${illustration.numero}: ${JSON.stringify(illustration[champ])},`;
  });
  return `{${lignes.length ? '\n' + lignes.join('\n') + '\n  ' : ''}}`;
}

/** Les noms des fichiers servis, en littéral d'objet : numéro → format → largeur → nom (US-078). */
function objetFichiers(
  illustrations: readonly Illustration[],
  fichiers: readonly FichierServi[],
): string {
  const nom = (numero: number, largeur: number, format: string) => {
    const fichier = fichiers.find(
      (f) => f.numero === numero && f.largeur === largeur && f.format === format,
    );
    if (!fichier) throw new Error(`carte ${numero} : aucun fichier ${largeur} px en ${format}`);
    return JSON.stringify(fichier.nomFichier);
  };
  const lignes = illustrations.map(({ numero }) => {
    const formats = FORMATS.map((format) => {
      const largeurs = LARGEURS.map((largeur) => `${largeur}: ${nom(numero, largeur, format)}`);
      return `${format}: { ${largeurs.join(', ')} }`;
    });
    return `  ${numero}: { ${formats.join(', ')} },`;
  });
  return `{${lignes.length ? '\n' + lignes.join('\n') + '\n' : ''}}`;
}

/**
 * Source TypeScript du manifeste lu par le front : langue → numéro de carte → texte alternatif (US-081), et les noms
 * des fichiers servis de chaque carte, empreinte comprise (US-078).
 * Le fichier est régénéré à chaque passage du script : il ne se modifie pas à la main.
 */
export async function genererManifeste(
  illustrations: readonly Illustration[],
  fichiers: readonly FichierServi[],
): Promise<string> {
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
    '/** Noms des fichiers d’une illustration, empreinte de leur contenu comprise : format → largeur → nom. */',
    "type Fichiers = Readonly<Record<'avif' | 'webp', Readonly<Record<320 | 640, string>>>>;",
    '',
    '/** Fichiers servis sous `/illustrations/set-1/` : numéro de carte → ses déclinaisons (US-078, ADR 0046). */',
    `export const FICHIERS_SET_1: Readonly<Record<number, Fichiers>> = ${objetFichiers(illustrations, fichiers)};`,
    '',
  ].join('\n');
  // La configuration Prettier du dépôt, quel que soit le dossier de sortie : le manifeste passe `format:check`.
  const config = await resolveConfig(fileURLToPath(import.meta.url));
  return format(source, { ...config, parser: 'typescript' });
}
