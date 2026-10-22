import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DELAI_REPONSE_MS, expliquer, intercepteurReseau, ReseauService } from './reseau';

const PANNE = { status: 503, statusText: 'Service Unavailable' };

describe('intercepteurReseau', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([intercepteurReseau])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  /** Lance une requête et note ce qu'elle renvoie. */
  function envoyer(methode: 'GET' | 'POST', url: string) {
    const resultat: { valeur?: unknown; erreur?: HttpErrorResponse } = {};
    TestBed.inject(HttpClient)
      .request(methode, url)
      .subscribe({
        next: (valeur) => (resultat.valeur = valeur),
        error: (erreur: HttpErrorResponse) => (resultat.erreur = erreur),
      });
    return resultat;
  }

  it('retente deux fois une lecture en panne passagère, après 1 s puis 3 s', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultat = envoyer('GET', '/api/v1/raretes');
    http.expectOne('/api/v1/raretes').flush(null, PANNE);
    await vi.advanceTimersByTimeAsync(999);
    http.expectNone('/api/v1/raretes');
    await vi.advanceTimersByTimeAsync(1);
    // Réseau coupé : une panne passagère aussi.
    http.expectOne('/api/v1/raretes').error(new ProgressEvent('error'));
    await vi.advanceTimersByTimeAsync(2999);
    http.expectNone('/api/v1/raretes');
    await vi.advanceTimersByTimeAsync(1);
    http.expectOne('/api/v1/raretes').flush([{ rarete: 'commune', chance: 0.7 }]);
    expect(resultat.valeur).toEqual([{ rarete: 'commune', chance: 0.7 }]);
    expect(resultat.erreur).toBeUndefined();
  });

  it('renonce après deux nouvelles tentatives, et rend la dernière erreur', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultat = envoyer('GET', '/api/v1/cartes');
    for (const delai of [1000, 3000]) {
      http.expectOne('/api/v1/cartes').flush(null, PANNE);
      await vi.advanceTimersByTimeAsync(delai);
    }
    http.expectOne('/api/v1/cartes').flush(null, { status: 500, statusText: 'Erreur' });
    await vi.advanceTimersByTimeAsync(60_000);
    http.verify();
    expect(resultat.erreur?.status).toBe(500);
  });

  it('ne rejoue jamais une écriture, ni une lecture que le serveur refuse', async () => {
    const http = TestBed.inject(HttpTestingController);
    const ouverture = envoyer('POST', '/api/v1/moi/boosters/ouvertures');
    http.expectOne('/api/v1/moi/boosters/ouvertures').flush(null, PANNE);
    const introuvable = envoyer('GET', '/api/v1/parties/inconnue');
    http.expectOne('/api/v1/parties/inconnue').flush(null, { status: 404, statusText: 'x' });
    const inchange = envoyer('GET', '/api/v1/duels/d1');
    http.expectOne('/api/v1/duels/d1').flush(null, { status: 304, statusText: 'Not Modified' });
    await vi.advanceTimersByTimeAsync(60_000);
    http.verify();
    expect(ouverture.erreur?.status).toBe(503);
    expect(introuvable.erreur?.status).toBe(404);
    expect(inchange.erreur?.status).toBe(304);
  });

  it('abandonne une lecture restée sans réponse, puis la retente : rien n’attend indéfiniment', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultat = envoyer('GET', '/api/v1/moi');
    const premiere = http.expectOne('/api/v1/moi');
    await vi.advanceTimersByTimeAsync(DELAI_REPONSE_MS);
    expect(premiere.cancelled).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    http.expectOne('/api/v1/moi').flush({ id: 'x', pseudo: 'Ada' });
    expect(resultat.valeur).toEqual({ id: 'x', pseudo: 'Ada' });
  });

  it('ne retente pas un 429, et retient l’attente demandée par Retry-After', async () => {
    const http = TestBed.inject(HttpTestingController);
    const resultat = envoyer('GET', '/api/v1/moi/duels');
    http.expectOne('/api/v1/moi/duels').flush(null, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'Retry-After': '30' },
    });
    await vi.advanceTimersByTimeAsync(5000);
    http.expectNone('/api/v1/moi/duels');
    expect(resultat.erreur?.status).toBe(429);
    const reseau = TestBed.inject(ReseauService);
    expect(reseau.pause()).toBe(25_000);
    await vi.advanceTimersByTimeAsync(25_000);
    expect(reseau.pause()).toBe(0);
  });
});

describe('expliquer', () => {
  const erreur = (status: number, entetes: Record<string, string> = {}) =>
    new HttpErrorResponse({ status, headers: new HttpHeaders(entetes) });

  it('dit au joueur pourquoi le serveur n’a pas répondu, et quoi faire', () => {
    expect(expliquer(erreur(0))).toBe(
      'Serveur injoignable : vérifiez votre connexion, puis réessayez.',
    );
    expect(expliquer(erreur(503))).toBe(
      'Serveur injoignable pour le moment : réessayez dans un instant.',
    );
    expect(expliquer(erreur(500))).toBe(
      'Le serveur a rencontré un problème : réessayez dans un instant.',
    );
    expect(expliquer(new Error('bogue'))).toBe(
      'Une erreur inattendue est survenue : réessayez dans un instant.',
    );
  });

  it('après un 429, dit combien de temps patienter, en secondes ou d’après une date', () => {
    expect(expliquer(erreur(429, { 'Retry-After': '30' }))).toBe(
      'Trop de demandes en peu de temps : patientez 30 s, puis réessayez.',
    );
    expect(expliquer(erreur(429, { 'Retry-After': '90' }))).toContain('patientez 2 min');
    const dans45s = new Date(Date.now() + 45_000).toUTCString();
    expect(expliquer(erreur(429, { 'Retry-After': dans45s }))).toMatch(/patientez 4[45] s/);
    expect(expliquer(erreur(429))).toContain('patientez un instant');
  });
});
