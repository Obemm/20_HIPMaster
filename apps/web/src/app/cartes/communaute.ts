import { LOCALE } from '../langue';
import type { Carte } from './carte';

/** Une personne qui a proposé des cartes au jeu (US-031), avec ses cartes publiées. */
export interface Contributeur {
  nom: string;
  cartes: Carte[];
}

/** Les cartes de la communauté : celles qui portent un auteur (US-030). */
export const estCarteCommunaute = (carte: Carte): boolean => carte.auteur !== undefined;

/**
 * Les contributeurs du catalogue, par ordre alphabétique (pas de classement au nombre de cartes, EPIC-08), chacun avec
 * ses cartes par numéro. Tiré du catalogue déjà en cache (ADR 0039) : aucune route dédiée.
 */
export function contributeurs(cartes: readonly Carte[]): Contributeur[] {
  const parNom = new Map<string, Carte[]>();
  for (const carte of cartes) {
    if (carte.auteur === undefined) continue;
    parNom.set(carte.auteur, [...(parNom.get(carte.auteur) ?? []), carte]);
  }
  return [...parNom]
    .map(([nom, siennes]) => ({ nom, cartes: [...siennes].sort((a, b) => a.numero - b.numero) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, LOCALE));
}
