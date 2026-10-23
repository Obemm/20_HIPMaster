import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, inject, Injectable } from '@angular/core';

/**
 * Erreurs JavaScript non gérées, signalées à l'API (US-051) qui les range dans Error Reporting. Le gestionnaire
 * d'Angular reçoit aussi celles de la fenêtre (`provideBrowserGlobalErrorListeners`).
 */

/** Erreurs envoyées au plus par chargement de page : une boucle d'erreurs n'inonde pas l'API. */
export const ENVOIS_MAX = 5;

/** Contrat : apps/api/openapi/erreurs.yaml. */
export interface RapportErreur {
  message: string;
  page: string;
  version: string;
  pile?: string;
}

const MESSAGE_MAX = 500;
const PILE_MAX = 4000;
const PAGE_MAX = 200;

/** Le nom du script principal (`main-XXXXXXXX` une fois publié), qui désigne la version du build. */
export function versionDuBuild(document: Document): string {
  const source = document.querySelector<HTMLScriptElement>('script[src*="main"]')?.src ?? '';
  return /(main[\w.-]*?)\.js/.exec(source)?.[1]?.slice(0, 40) ?? 'inconnue';
}

/** Ce que l'API reçoit d'une erreur : son message, sa pile et la page, sans paramètres ni fragment. */
export function rapportErreur(erreur: unknown, page: string, version: string): RapportErreur {
  const message =
    (erreur instanceof Error ? erreur.message : String(erreur)).trim() || 'Erreur sans message';
  const pile = erreur instanceof Error ? erreur.stack : undefined;
  return {
    message: message.slice(0, MESSAGE_MAX),
    // Le lien d'invitation porte son code en paramètre (US-072) : seul le chemin part.
    page: (page.split(/[?#]/)[0] || '/').replaceAll(/\s/g, '').slice(0, PAGE_MAX),
    version,
    ...(pile && { pile: pile.slice(0, PILE_MAX) }),
  };
}

@Injectable()
export class RapporteurErreurs extends ErrorHandler {
  private readonly document = inject(DOCUMENT);
  private readonly envoyees = new Set<string>();

  override handleError(erreur: unknown): void {
    super.handleError(erreur);
    // Une réponse HTTP en erreur est déjà connue de l'API, ou le réseau manque : rien à signaler.
    if (erreur instanceof HttpErrorResponse || this.envoyees.size >= ENVOIS_MAX) return;
    const rapport = rapportErreur(
      erreur,
      this.document.location.pathname,
      versionDuBuild(this.document),
    );
    if (this.envoyees.has(rapport.message)) return;
    this.envoyees.add(rapport.message);
    // fetch plutôt qu'HttpClient : ni jeton, ni intercepteur, et un échec ici ne relance pas d'erreur à signaler.
    fetch('/api/v1/erreurs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rapport),
      keepalive: true,
    }).catch(() => undefined);
  }
}
