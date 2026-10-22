import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, retry, throwError, timeout, timer } from 'rxjs';

/**
 * Délais avant les deux nouvelles tentatives d'une lecture qui échoue : croissants, le temps qu'un serveur qui démarre
 * à froid ou se redéploie réponde (ADR 0021).
 */
export const DELAIS_NOUVEL_ESSAI_MS = [1000, 3000] as const;
/** Une lecture restée sans réponse est abandonnée au bout de ce délai, puis retentée : rien n'attend indéfiniment. */
export const DELAI_REPONSE_MS = 15_000;
/** Attente après un 429 qui ne dit pas combien de temps patienter. */
const PAUSE_PAR_DEFAUT_MS = 60_000;

/** Panne passagère (réseau coupé, délai dépassé, serveur indisponible) : une lecture vaut d'être retentée. */
function passagere(erreur: unknown): boolean {
  return (
    erreur instanceof HttpErrorResponse &&
    (erreur.status === 0 || erreur.status === 408 || erreur.status >= 500)
  );
}

/**
 * L'attente demandée par le serveur avec un 429 (en-tête `Retry-After` : des secondes ou une date HTTP), en
 * millisecondes ; `null` sans en-tête lisible.
 */
export function attenteDemandee(erreur: HttpErrorResponse, maintenant = Date.now()): number | null {
  const valeur = erreur.headers.get('Retry-After')?.trim();
  if (!valeur) return null;
  const secondes = Number(valeur);
  if (Number.isFinite(secondes)) return Math.max(0, secondes * 1000);
  const date = Date.parse(valeur);
  return Number.isNaN(date) ? null : Math.max(0, date - maintenant);
}

/** « 30 s », « 2 min » : arrondi au-dessus, pour ne jamais inviter à réessayer trop tôt. */
function dureeLisible(ms: number): string {
  const secondes = Math.ceil(ms / 1000);
  return secondes < 60 ? `${secondes} s` : `${Math.ceil(secondes / 60)} min`;
}

/** La cause d'un échec, avec les mots d'un joueur et ce qu'il peut y faire (US-055). */
export function expliquer(erreur: unknown): string {
  if (!(erreur instanceof HttpErrorResponse)) {
    return 'Une erreur inattendue est survenue : réessayez dans un instant.';
  }
  if (erreur.status === 429) {
    const attente = attenteDemandee(erreur);
    const duree = attente ? dureeLisible(attente) : 'un instant';
    return `Trop de demandes en peu de temps : patientez ${duree}, puis réessayez.`;
  }
  if (erreur.status === 0) return 'Serveur injoignable : vérifiez votre connexion, puis réessayez.';
  if ([408, 502, 503, 504].includes(erreur.status)) {
    return 'Serveur injoignable pour le moment : réessayez dans un instant.';
  }
  if (erreur.status >= 500)
    return 'Le serveur a rencontré un problème : réessayez dans un instant.';
  return 'La demande n’a pas abouti : réessayez dans un instant.';
}

/**
 * Ce que le serveur a demandé avec un 429 : ne plus l'interroger en tâche de fond avant un certain instant. Les
 * interrogations périodiques s'y plient (`interroger`) ; les gestes du joueur, non.
 */
@Injectable({ providedIn: 'root' })
export class ReseauService {
  private pauseJusqua = 0;

  /** Millisecondes à attendre encore avant une interrogation de fond ; 0 si le serveur n'a rien demandé. */
  pause(maintenant = Date.now()): number {
    return Math.max(0, this.pauseJusqua - maintenant);
  }

  retenirPause(erreur: HttpErrorResponse): void {
    const fin = Date.now() + (attenteDemandee(erreur) ?? PAUSE_PAR_DEFAUT_MS);
    this.pauseJusqua = Math.max(this.pauseJusqua, fin);
  }
}

const sansReponse = (url: string) =>
  new HttpErrorResponse({ url, status: 0, statusText: 'Délai de réponse dépassé' });

/**
 * Robustesse face au réseau et au démarrage à froid (US-055). Une lecture de l'API (GET) qui échoue par une panne
 * passagère est retentée deux fois, avec un délai croissant, et abandonnée si elle reste sans réponse. Une écriture
 * n'est jamais rejouée : elle aurait pu aboutir (ouvrir deux boosters pour un). Un 429 n'est pas retenté : le serveur
 * demande d'attendre, ce que retient `ReseauService`.
 */
export const intercepteurReseau: HttpInterceptorFn = (requete, suivant) => {
  const reseau = inject(ReseauService);
  const lecture = requete.method === 'GET' && requete.url.startsWith('/api/');
  const envoi = lecture
    ? suivant(requete).pipe(
        timeout({ each: DELAI_REPONSE_MS, with: () => throwError(() => sansReponse(requete.url)) }),
        retry({
          count: DELAIS_NOUVEL_ESSAI_MS.length,
          delay: (erreur: unknown, essai: number) =>
            passagere(erreur)
              ? timer(DELAIS_NOUVEL_ESSAI_MS[essai - 1] ?? 0)
              : throwError(() => erreur),
        }),
      )
    : suivant(requete);
  return envoi.pipe(
    catchError((erreur: unknown) => {
      if (erreur instanceof HttpErrorResponse && erreur.status === 429) reseau.retenirPause(erreur);
      return throwError(() => erreur);
    }),
  );
};
