/**
 * Langue de cette version du site (US-079, ADR 0042) : chaque langue a son propre build, servi sous `/fr/` ou `/en/`,
 * et le build localisé inscrit la sienne dans `$localize.locale`. Sans build localisé (serveur de développement,
 * tests), c'est le français, langue de référence.
 */
export type Langue = 'fr' | 'en';

export interface DescriptionLangue {
  code: Langue;
  /** Nom de la langue dans cette langue, comme le lit un lecteur d'écran réglé sur elle. */
  nom: string;
  /** Code court affiché dans le sélecteur. */
  court: string;
  /** Locale des dates et des nombres (`Intl`). */
  locale: string;
}

export const LANGUES: readonly DescriptionLangue[] = [
  { code: 'fr', nom: 'Français', court: 'FR', locale: 'fr-FR' },
  { code: 'en', nom: 'English', court: 'EN', locale: 'en-GB' },
];

export const LANGUE: Langue = $localize.locale?.startsWith('en') ? 'en' : 'fr';

/** Locale `Intl` de la langue du site : dates et nombres suivent la langue (US-080). */
export const LOCALE = LANGUES.find((l) => l.code === LANGUE)?.locale ?? 'fr-FR';

/**
 * Adresse de la même page dans une autre langue : la langue préfixe le chemin de l'application (`/collection` →
 * `/en/collection`). Rechargement complet : chaque langue est un autre build.
 */
export function adresseDansLaLangue(langue: Langue, cheminApplication: string): string {
  return `/${langue}${cheminApplication.startsWith('/') ? '' : '/'}${cheminApplication}`;
}
