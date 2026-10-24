import { InjectionToken } from '@angular/core';
import { LANGUE, type Langue } from '../langue';
import { ILLUSTRATIONS_SET_1 } from './illustrations.generated';

/**
 * Les textes alternatifs du manifeste dans une langue du site (US-081) : `/en/` lit l'anglais, `/fr/` le français.
 */
export function illustrationsDansLaLangue(langue: Langue): Readonly<Record<number, string>> {
  return ILLUSTRATIONS_SET_1[langue];
}

/**
 * Cartes qui ont une illustration : numéro → texte alternatif dans la langue du site (US-015, ADR 0015, US-081).
 * Par défaut, le manifeste produit par `npm run illustrations` ; les tests en fournissent un autre.
 */
export const ILLUSTRATIONS_CARTES = new InjectionToken<Readonly<Record<number, string>>>(
  'ILLUSTRATIONS_CARTES',
  { factory: () => illustrationsDansLaLangue(LANGUE) },
);

/** Largeurs déclinées par la chaîne d'illustrations, au format 4:3. */
const LARGEURS = [320, 640] as const;

const chemin = (numero: number, largeur: number, format: 'avif' | 'webp') =>
  `/cartes/set-1/${numero}-${largeur}.${format}`;

/** Les sources d'une illustration, pour un élément `<picture>`. */
export function sourcesIllustration(numero: number) {
  const srcset = (format: 'avif' | 'webp') =>
    LARGEURS.map((largeur) => `${chemin(numero, largeur, format)} ${largeur}w`).join(', ');
  return { avif: srcset('avif'), webp: srcset('webp'), defaut: chemin(numero, 640, 'webp') };
}
