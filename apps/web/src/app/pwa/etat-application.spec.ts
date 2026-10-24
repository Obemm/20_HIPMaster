import { TestBed } from '@angular/core/testing';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { EtatApplication } from './etat-application';

describe('EtatApplication', () => {
  afterEach(() => vi.restoreAllMocks());

  function afficher(miseAJour?: Partial<SwUpdate>) {
    TestBed.configureTestingModule({
      imports: [EtatApplication],
      providers: miseAJour ? [{ provide: SwUpdate, useValue: miseAJour }] : [],
    });
    const fixture = TestBed.createComponent(EtatApplication);
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('ne montre rien quand tout va bien, même sans service worker (développement, tests)', () => {
    const { page } = afficher();
    expect(page.textContent?.trim()).toBe('');
  });

  it('dit clairement que le jeu se joue en ligne quand le réseau tombe, et se tait à son retour', () => {
    const { fixture, page } = afficher();
    const enLigne = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    globalThis.dispatchEvent(new Event('offline'));
    fixture.detectChanges();
    expect(page.querySelector('[role="status"]')?.textContent).toContain(
      'Pas de réseau. HIPMaster se joue en ligne',
    );

    enLigne.mockReturnValue(true);
    globalThis.dispatchEvent(new Event('online'));
    fixture.detectChanges();
    expect(page.querySelector('[role="status"]')).toBeNull();
  });

  it('propose de recharger quand une nouvelle version est prête, au lieu de garder l’ancienne', () => {
    const versions = new Subject<VersionEvent>();
    const { fixture, page } = afficher({
      isEnabled: true,
      versionUpdates: versions,
      checkForUpdate: vi.fn().mockResolvedValue(false),
    });
    versions.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } });
    fixture.detectChanges();
    expect(page.querySelector('button')).toBeNull();

    versions.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    });
    fixture.detectChanges();
    expect(page.querySelector('[role="status"]')?.textContent).toContain(
      'Une nouvelle version de HIPMaster est prête.',
    );
    expect(page.querySelector('button')?.textContent?.trim()).toBe('Recharger');
  });

  it('cherche une nouvelle version quand le joueur revient sur l’onglet', () => {
    const chercher = vi.fn().mockResolvedValue(true);
    afficher({
      isEnabled: true,
      versionUpdates: new Subject<VersionEvent>(),
      checkForUpdate: chercher,
    });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(chercher).toHaveBeenCalledOnce();
  });
});
