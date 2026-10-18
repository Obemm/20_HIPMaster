import { HttpClient, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Le joueur connecté (compte invité, US-022). */
export interface Joueur {
  id: string;
  pseudo: string;
}

const CLE_JETON = 'hipmaster.jeton';

/** Le stockage du navigateur peut être indisponible (navigation privée stricte) : on n'échoue jamais pour lui. */
function lireJeton(): string | null {
  try {
    return globalThis.localStorage?.getItem(CLE_JETON) ?? null;
  } catch {
    return null;
  }
}

function ecrireJeton(jeton: string | null): void {
  try {
    if (jeton) globalThis.localStorage?.setItem(CLE_JETON, jeton);
    else globalThis.localStorage?.removeItem(CLE_JETON);
  } catch {
    // Sans stockage, la session ne dure que le temps de l'onglet.
  }
}

/**
 * Le compte du joueur (ADR 0017) : le jeton de session est gardé par le navigateur et envoyé à l'API par
 * `intercepteurJeton` ; le code de récupération n'est jamais gardé, il est affiché une seule fois.
 */
@Injectable({ providedIn: 'root' })
export class CompteService {
  private readonly http = inject(HttpClient);
  private jetonCourant = lireJeton();

  readonly joueur = signal<Joueur | null>(null);
  /** Vrai une fois la session du navigateur vérifiée (ou en l'absence de jeton). */
  readonly pret = signal(this.jetonCourant === null);

  get jeton(): string | null {
    return this.jetonCourant;
  }

  /** Vérifie la session gardée par le navigateur ; l'oublie si l'API ne la reconnaît plus. */
  async charger(): Promise<void> {
    if (!this.jetonCourant) {
      this.pret.set(true);
      return;
    }
    try {
      this.joueur.set(await firstValueFrom(this.http.get<Joueur>('/api/v1/moi')));
    } catch (erreur) {
      if (erreur instanceof HttpErrorResponse && erreur.status === 401) this.oublier();
    } finally {
      this.pret.set(true);
    }
  }

  /** Crée un compte invité ; renvoie le code de récupération, à montrer une seule fois. */
  async creer(pseudo: string): Promise<string> {
    const reponse = await firstValueFrom(
      this.http.post<{ joueur: Joueur; jeton: string; codeRecuperation: string }>(
        '/api/v1/joueurs',
        { pseudo },
      ),
    );
    this.retenir(reponse.jeton, reponse.joueur);
    return reponse.codeRecuperation;
  }

  async recuperer(code: string): Promise<void> {
    const reponse = await firstValueFrom(
      this.http.post<{ joueur: Joueur; jeton: string }>('/api/v1/sessions', { code }),
    );
    this.retenir(reponse.jeton, reponse.joueur);
  }

  async nouveauCode(): Promise<string> {
    const reponse = await firstValueFrom(
      this.http.post<{ codeRecuperation: string }>('/api/v1/moi/code', {}),
    );
    return reponse.codeRecuperation;
  }

  async deconnecter(): Promise<void> {
    try {
      await firstValueFrom(this.http.delete('/api/v1/sessions/courante'));
    } finally {
      this.oublier();
    }
  }

  private retenir(jeton: string, joueur: Joueur): void {
    this.jetonCourant = jeton;
    ecrireJeton(jeton);
    this.joueur.set(joueur);
  }

  private oublier(): void {
    this.jetonCourant = null;
    ecrireJeton(null);
    this.joueur.set(null);
  }
}

/** Ajoute le jeton de session aux requêtes vers l'API. */
export const intercepteurJeton: HttpInterceptorFn = (requete, suivant) => {
  const jeton = inject(CompteService).jeton;
  if (!jeton || !requete.url.startsWith('/api/')) return suivant(requete);
  return suivant(requete.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } }));
};
