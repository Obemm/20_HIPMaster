import { type HttpEvent, type HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, filter, type Observable, shareReplay, throwError } from 'rxjs';

/** Les lectures du catalogue (US-057) : cartes et leur détail, decks prêts, niveaux du bot, chances des raretés. */
const CATALOGUE = /^\/api\/v1\/(?:cartes(?:\/\d+)?|decks|niveaux|raretes)$/;

/**
 * Le catalogue déjà reçu, gardé en mémoire le temps de la session (US-057) : il ne change qu'avec une nouvelle version
 * du jeu (ADR 0011), que le service worker propose de charger (ADR 0038). Les données d'un joueur n'y passent jamais.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueEnMemoire {
  readonly reponses = new Map<string, Observable<HttpEvent<unknown>>>();
}

/**
 * Une lecture du catalogue ne part qu'une fois par session, même demandée par plusieurs écrans en même temps : les
 * suivantes reçoivent la même réponse. Une lecture en échec est oubliée, pour être retentée au prochain affichage.
 */
export const intercepteurCatalogue: HttpInterceptorFn = (requete, suivant) => {
  if (requete.method !== 'GET' || !CATALOGUE.test(requete.url)) return suivant(requete);
  const reponses = inject(CatalogueEnMemoire).reponses;
  const cle = requete.urlWithParams;
  const connue = reponses.get(cle);
  if (connue) return connue;
  const partagee = suivant(requete).pipe(
    filter((evenement) => evenement instanceof HttpResponse),
    catchError((erreur: unknown) => {
      reponses.delete(cle);
      return throwError(() => erreur);
    }),
    shareReplay(1),
  );
  reponses.set(cle, partagee);
  return partagee;
};
