import { HttpClient, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, throwError } from 'rxjs';

/** Le joueur connecté (compte invité, US-022). */
export interface Joueur {
  id: string;
  pseudo: string;
}

const CLE_JETON = 'hipmaster.jeton';
/**
 * Une session que le serveur n'a pas pu vérifier est revérifiée seule après chacun de ces délais ; ensuite, le joueur
 * peut toujours réessayer lui-même (US-055).
 */
const RELANCES_MS = [5_000, 15_000, 45_000] as const;

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
 *
 * Seul un 401 fait oublier la session (US-055) : si le serveur est injoignable, se redéploie ou demande d'attendre,
 * le jeton reste gardé et la session « non vérifiée » ; aucun écran ne propose alors de créer un compte, qui écraserait
 * celui-ci.
 */
@Injectable({ providedIn: 'root' })
export class CompteService {
  private readonly http = inject(HttpClient);
  private jetonCourant = lireJeton();

  readonly joueur = signal<Joueur | null>(null);
  /** Vrai une fois la session du navigateur vérifiée (ou en l'absence de jeton) : on sait si le joueur a un compte. */
  readonly pret = signal(this.jetonCourant === null);
  readonly enVerification = signal(false);
  /** Pourquoi la session gardée n'a pas pu être vérifiée (serveur injoignable, 429…) ; `null` sinon. */
  readonly echec = signal<unknown>(null);
  /** Vrai quand l'API n'a plus reconnu la session (401) : « Mon compte » dit « Session expirée ». */
  readonly expiree = signal(false);

  /** Numéro de la dernière vérification lancée : seule sa réponse compte. */
  private verification = 0;
  private relances = 0;
  private relance: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Une connexion ou une déconnexion dans un autre onglet de ce navigateur : cet onglet la suit.
    const surStockage = (evenement: StorageEvent) => {
      if (evenement.key === CLE_JETON || evenement.key === null) this.suivreAutreOnglet();
    };
    // Le réseau revient : une session non vérifiée l'est aussitôt.
    const surRetourReseau = () => {
      if (this.echec()) void this.charger();
    };
    globalThis.addEventListener?.('storage', surStockage);
    globalThis.addEventListener?.('online', surRetourReseau);
    inject(DestroyRef).onDestroy(() => {
      globalThis.removeEventListener?.('storage', surStockage);
      globalThis.removeEventListener?.('online', surRetourReseau);
      clearTimeout(this.relance);
    });
  }

  get jeton(): string | null {
    return this.jetonCourant;
  }

  /** Vérifie la session gardée par le navigateur ; l'oublie si l'API ne la reconnaît plus, et seulement dans ce cas. */
  async charger(): Promise<void> {
    clearTimeout(this.relance);
    const jeton = this.jetonCourant;
    if (!jeton) {
      this.pret.set(true);
      return;
    }
    const numero = ++this.verification;
    this.enVerification.set(true);
    try {
      const joueur = await firstValueFrom(this.http.get<Joueur>('/api/v1/moi'));
      if (numero !== this.verification) return;
      this.relances = 0;
      this.echec.set(null);
      this.joueur.set(joueur);
      this.pret.set(true);
    } catch (erreur) {
      if (numero !== this.verification) return;
      if (erreur instanceof HttpErrorResponse && erreur.status === 401) {
        this.expirer(jeton);
      } else {
        this.echec.set(erreur);
        const delai = RELANCES_MS[this.relances++];
        if (delai !== undefined) this.relance = setTimeout(() => void this.charger(), delai);
      }
    } finally {
      if (numero === this.verification) this.enVerification.set(false);
    }
  }

  /** « Réessayer » : vérifie la session tout de suite, et rend ses nouvelles vérifications automatiques. */
  async reessayer(): Promise<void> {
    this.relances = 0;
    await this.charger();
  }

  /**
   * Crée un compte invité, avec le code d'invitation s'il y en a un (US-048) ; renvoie le code de récupération, à
   * montrer une seule fois.
   */
  async creer(pseudo: string, invitation?: string): Promise<string> {
    this.exigerSansCompte();
    const reponse = await firstValueFrom(
      this.http.post<{ joueur: Joueur; jeton: string; codeRecuperation: string }>(
        '/api/v1/joueurs',
        { pseudo, ...(invitation && { invitation }) },
      ),
    );
    this.retenir(reponse.jeton, reponse.joueur);
    return reponse.codeRecuperation;
  }

  async recuperer(code: string): Promise<void> {
    this.exigerSansCompte();
    const reponse = await firstValueFrom(
      this.http.post<{ joueur: Joueur; jeton: string }>('/api/v1/sessions', { code }),
    );
    this.retenir(reponse.jeton, reponse.joueur);
  }

  /**
   * Remplace le code de récupération ; l'API ferme du même coup les autres sessions du compte (US-047). Renvoie le
   * nouveau code, à montrer une seule fois, et le nombre d'appareils déconnectés.
   */
  async nouveauCode(): Promise<{ codeRecuperation: string; sessionsFermees: number }> {
    return firstValueFrom(
      this.http.post<{ codeRecuperation: string; sessionsFermees: number }>('/api/v1/moi/code', {}),
    );
  }

  /** « Déconnecter mes autres appareils » (US-047) : cet appareil reste connecté ; renvoie le nombre de déconnectés. */
  async deconnecterAutresAppareils(): Promise<number> {
    const reponse = await firstValueFrom(
      this.http.delete<{ sessionsFermees: number }>('/api/v1/sessions/autres'),
    );
    return reponse.sessionsFermees;
  }

  async deconnecter(): Promise<void> {
    try {
      await firstValueFrom(this.http.delete('/api/v1/sessions/courante'));
    } finally {
      this.oublier();
    }
  }

  /**
   * L'API ne reconnaît plus la session (401) : elle est oubliée, et « Mon compte » dira « Session expirée ». Sans
   * effet si le jeton a changé entre-temps (le joueur s'est reconnecté) ; vrai si la session vient d'être oubliée.
   */
  expirer(jeton: string): boolean {
    if (jeton !== this.jetonCourant) return false;
    this.oublier();
    this.expiree.set(true);
    return true;
  }

  /** Jamais de nouvelle session par-dessus un compte gardé, même non vérifié : il serait perdu. */
  private exigerSansCompte(): void {
    if (this.jetonCourant) throw new Error('Un compte est déjà gardé par ce navigateur.');
  }

  /** Un autre onglet a changé le jeton gardé : déconnecté s'il l'a effacé, sinon la nouvelle session est vérifiée. */
  private suivreAutreOnglet(): void {
    const jeton = lireJeton();
    if (jeton === this.jetonCourant) return;
    this.annulerVerification();
    this.jetonCourant = jeton;
    this.joueur.set(null);
    this.echec.set(null);
    this.expiree.set(false);
    this.pret.set(jeton === null);
    if (jeton) void this.charger();
  }

  private retenir(jeton: string, joueur: Joueur): void {
    this.annulerVerification();
    this.jetonCourant = jeton;
    ecrireJeton(jeton);
    this.joueur.set(joueur);
    this.echec.set(null);
    this.expiree.set(false);
    this.pret.set(true);
  }

  private oublier(): void {
    this.annulerVerification();
    this.jetonCourant = null;
    ecrireJeton(null);
    this.joueur.set(null);
    this.echec.set(null);
    this.pret.set(true);
  }

  /** La réponse d'une vérification en cours ne comptera plus, et les nouvelles vérifications prévues sont annulées. */
  private annulerVerification(): void {
    this.verification++;
    this.relances = 0;
    clearTimeout(this.relance);
    this.enVerification.set(false);
  }
}

/**
 * Les requêtes dont un 401 ne veut pas dire « session expirée » : un code de récupération inconnu (connexion), ou une
 * session déjà fermée (déconnexion).
 */
const SANS_EXPIRATION = new Set(['/api/v1/sessions', '/api/v1/sessions/courante']);

/**
 * Ajoute le jeton de session aux requêtes vers l'API. Si l'API ne le reconnaît plus (401), la session est oubliée et
 * le joueur renvoyé vers « Mon compte » (« Session expirée »), d'où il revient à sa page une fois reconnecté
 * (US-055). Sauf pour la connexion et la déconnexion (`SANS_EXPIRATION`).
 */
export const intercepteurJeton: HttpInterceptorFn = (requete, suivant) => {
  const compte = inject(CompteService);
  const jeton = compte.jeton;
  if (!jeton || !requete.url.startsWith('/api/')) return suivant(requete);
  const router = inject(Router);
  return suivant(requete.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } })).pipe(
    catchError((erreur: unknown) => {
      const refusee = erreur instanceof HttpErrorResponse && erreur.status === 401;
      if (refusee && !SANS_EXPIRATION.has(requete.url) && compte.expirer(jeton)) {
        const ici = router.url;
        if (!ici.startsWith('/compte')) {
          void router.navigate(['/compte'], { queryParams: { retour: ici } });
        }
      }
      return throwError(() => erreur);
    }),
  );
};
