import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import { ClassementEcran } from './classement';
import type { Classement } from './classement.service';

const PANNE = { status: 503, statusText: 'Service Unavailable' };

const CLASSEMENT: Classement = {
  moi: { pseudo: 'Cléo', points: 2, cote: null, rang: 2, classe: true },
  joueurs: [
    { rang: 1, pseudo: 'Bob', points: 3, cote: 1016, moi: false },
    { rang: 2, pseudo: 'Ada', points: 2, cote: null, moi: false },
    { rang: 2, pseudo: 'Cléo', points: 2, cote: null, moi: true },
  ],
};

describe('Classement', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ClassementEcran],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  async function afficher(reponse: Classement | typeof PANNE = CLASSEMENT) {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Cléo' });
    const fixture = TestBed.createComponent(ClassementEcran);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const requete = http.expectOne('/api/v1/classement');
    if ('status' in reponse) requete.flush(null, reponse);
    else requete.flush(reponse);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, http, page: fixture.nativeElement as HTMLElement };
  }

  const lignes = (page: HTMLElement) =>
    [...page.querySelectorAll('tbody tr')].map((l) =>
      [...l.querySelectorAll('td')].map((c) => c.textContent?.replace(/\s+/g, ' ').trim()),
    );

  it('montre mon score, mon rang, et les joueurs classés', async () => {
    const { page } = await afficher();
    const score = [...page.querySelectorAll('dd')].map((d) => d.textContent?.trim());
    expect(score).toEqual(['2', '2e', '—']);
    expect(lignes(page)).toEqual([
      ['1er', 'Bob', '3', '1016'],
      ['2e', 'Ada', '2', '—'],
      ['2e', 'Cléo (vous)', '2', '—'],
    ]);
    expect(page.textContent).toContain('Comment on marque');
  });

  it('se retire du classement, puis relit le classement', async () => {
    const { fixture, http, page } = await afficher();
    const coche = page.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!coche) throw new Error('case absente');
    expect(coche.checked).toBe(true);
    coche.checked = false;
    coche.dispatchEvent(new Event('change'));

    const choix = http.expectOne('/api/v1/moi/classement');
    expect(choix.request.method).toBe('PUT');
    expect(choix.request.body).toEqual({ classe: false });
    choix.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    http.expectOne('/api/v1/classement').flush({
      moi: { ...CLASSEMENT.moi, rang: null, classe: false },
      joueurs: CLASSEMENT.joueurs.filter((j) => !j.moi),
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Vous êtes retiré·e du classement');
    expect(lignes(page)).toHaveLength(2);
  });

  it('dit quand le choix n’a pas pu être enregistré', async () => {
    const { fixture, http, page } = await afficher();
    const coche = page.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!coche) throw new Error('case absente');
    coche.checked = false;
    coche.dispatchEvent(new Event('change'));
    http.expectOne('/api/v1/moi/classement').flush(null, PANNE);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(coche.checked).toBe(true);
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('pas pu être enregistré');
  });

  it('propose de réessayer quand le classement n’a pas pu être lu', async () => {
    const { page } = await afficher(PANNE);
    expect(page.textContent).toContain('Le classement n’a pas pu être chargé.');
  });
});
