import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ENVOIS_MAX, RapporteurErreurs, rapportErreur, versionDuBuild } from './rapporteur-erreurs';

describe('rapportErreur', () => {
  it('garde le message, la pile et le seul chemin de la page', () => {
    const erreur = new TypeError('boum');
    expect(rapportErreur(erreur, '/compte?invitation=ABCD-EFGH#haut', 'main-ABC')).toEqual({
      message: 'boum',
      page: '/compte',
      version: 'main-ABC',
      pile: erreur.stack,
    });
  });

  it('accepte une valeur qui n’est pas une Error, et tronque un message trop long', () => {
    expect(rapportErreur('refus', '/', 'main')).toEqual({
      message: 'refus',
      page: '/',
      version: 'main',
    });
    expect(rapportErreur(new Error('x'.repeat(900)), '/', 'main').message).toHaveLength(500);
    expect(rapportErreur(new Error('  '), '/', 'main').message).toBe('Erreur sans message');
  });
});

describe('versionDuBuild', () => {
  it('lit le nom du script principal, ou « inconnue »', () => {
    const page = document.implementation.createHTMLDocument('essai');
    expect(versionDuBuild(page)).toBe('inconnue');
    const script = page.createElement('script');
    script.src = 'https://hipmaster.web.app/main-QWERTY12.js';
    page.body.append(script);
    expect(versionDuBuild(page)).toBe('main-QWERTY12');
  });
});

describe('RapporteurErreurs', () => {
  let envois: RequestInit[];

  beforeEach(() => {
    envois = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        envois.push(init);
        return new Response(null, { status: 204 });
      }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: RapporteurErreurs }],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  const corps = (init: RequestInit) => JSON.parse(String(init.body)) as Record<string, unknown>;

  it('signale une erreur à l’API, sans jeton, et l’affiche toujours dans la console', () => {
    TestBed.inject(ErrorHandler).handleError(new Error('boum'));
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/erreurs',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(envois[0]?.headers).toEqual({ 'content-type': 'application/json' });
    expect(corps(envois[0]!)).toMatchObject({
      message: 'boum',
      page: expect.stringMatching(/^\//),
    });
    expect(console.error).toHaveBeenCalled();
  });

  it('ne signale ni une réponse HTTP en erreur, ni deux fois le même message, ni plus de 5 erreurs', () => {
    const gestionnaire = TestBed.inject(ErrorHandler);
    gestionnaire.handleError(new HttpErrorResponse({ status: 500 }));
    gestionnaire.handleError(new Error('même'));
    gestionnaire.handleError(new Error('même'));
    for (let i = 0; i < 10; i++) gestionnaire.handleError(new Error(`erreur ${i}`));
    expect(envois).toHaveLength(ENVOIS_MAX);
    expect(envois.map((e) => corps(e)['message'])).toEqual([
      'même',
      'erreur 0',
      'erreur 1',
      'erreur 2',
      'erreur 3',
    ]);
  });

  it('ignore un échec de l’envoi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('hors ligne'))),
    );
    expect(() => TestBed.inject(ErrorHandler).handleError(new Error('boum'))).not.toThrow();
    await Promise.resolve();
  });
});
