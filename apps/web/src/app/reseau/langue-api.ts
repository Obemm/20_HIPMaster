import type { HttpInterceptorFn } from '@angular/common/http';
import { LANGUE } from '../langue';

/**
 * Les textes du jeu servis par l'API (cartes, fiches, decks, niveaux, conseil, partie guidée) dans la langue de cette
 * version du site (US-081, ADR 0043) : le paramètre `langue` s'ajoute à chaque appel de l'API. En français, la
 * langue de référence, l'API le suppose : les adresses restent celles d'avant.
 */
export const intercepteurLangue: HttpInterceptorFn = (requete, suivant) => {
  if (LANGUE === 'fr' || !requete.url.startsWith('/api/')) return suivant(requete);
  return suivant(requete.clone({ setParams: { langue: LANGUE } }));
};
