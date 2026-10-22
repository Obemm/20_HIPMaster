import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { INACTIVITE_MS, interroger, PresenceService } from './presence';
import { ReseauService } from './reseau/reseau';

/** Simule un onglet caché ou de nouveau visible. */
function onglet(etat: 'hidden' | 'visible'): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => etat });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('PresenceService', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    onglet('visible');
    vi.useRealTimers();
  });

  it('considère le joueur absent après 10 minutes sans geste, présent dès le suivant', () => {
    const presence = TestBed.inject(PresenceService);
    expect(presence.present()).toBe(true);
    vi.advanceTimersByTime(INACTIVITE_MS - 1);
    expect(presence.present()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(presence.present()).toBe(false);
    document.dispatchEvent(new Event('keydown'));
    expect(presence.present()).toBe(true);
  });

  it('compte chaque geste : 10 minutes après le dernier seulement', () => {
    const presence = TestBed.inject(PresenceService);
    vi.advanceTimersByTime(INACTIVITE_MS - 1000);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(INACTIVITE_MS - 1000);
    expect(presence.present()).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(presence.present()).toBe(false);
  });

  it('considère le joueur absent quand l’onglet est caché, présent quand il y revient', () => {
    const presence = TestBed.inject(PresenceService);
    onglet('hidden');
    expect(presence.present()).toBe(false);
    onglet('visible');
    expect(presence.present()).toBe(true);
  });
});

describe('interroger', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    onglet('visible');
    vi.useRealTimers();
  });

  /** Une interrogation toutes les minutes, dans le contexte d'injection de TestBed. */
  function lancer(condition: () => boolean = () => true) {
    const action = vi.fn(async () => undefined);
    TestBed.runInInjectionContext(() => interroger(action, 60_000, condition));
    TestBed.tick();
    return action;
  }

  it('interroge à chaque période tant que le joueur est là, jamais pendant son absence', async () => {
    const action = lancer();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(action).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(action).toHaveBeenCalledTimes(2);

    onglet('hidden');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(action).toHaveBeenCalledTimes(2);

    // De retour, la période est écoulée depuis longtemps : l'interrogation reprend aussitôt, puis à son rythme.
    onglet('visible');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    expect(action).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(action).toHaveBeenCalledTimes(4);
  });

  it('s’arrête après 10 minutes sans geste, et reprend au geste suivant', async () => {
    const action = lancer();
    await vi.advanceTimersByTimeAsync(INACTIVITE_MS);
    TestBed.tick();
    expect(action).toHaveBeenCalledTimes(10);
    await vi.advanceTimersByTimeAsync(8 * 60 * 60_000);
    expect(action).toHaveBeenCalledTimes(10);
    document.dispatchEvent(new Event('pointermove'));
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    expect(action).toHaveBeenCalledTimes(11);
  });

  it('un bref passage sur un autre onglet ne déclenche pas d’interrogation en plus', async () => {
    const action = lancer();
    await vi.advanceTimersByTimeAsync(20_000);
    onglet('hidden');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(5000);
    onglet('visible');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(34_999);
    expect(action).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('n’interroge que tant que la condition tient', async () => {
    const enAttente = signal(true);
    const action = lancer(enAttente);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(action).toHaveBeenCalledTimes(1);
    enAttente.set(false);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(action).toHaveBeenCalledTimes(1);
    enAttente.set(true);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('attend la fin d’une pause demandée par le serveur (429)', async () => {
    const action = lancer();
    TestBed.inject(ReseauService).retenirPause(
      new HttpErrorResponse({ status: 429, headers: new HttpHeaders({ 'Retry-After': '150' }) }),
    );
    await vi.advanceTimersByTimeAsync(149_999);
    expect(action).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
