import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Carte } from '../cartes/carte';
import { CompteService, intercepteurJeton } from '../compte/compte.service';
import { BoostersEcran } from './boosters';

const carte = (numero: number, nom: string): Carte => ({
  numero,
  nom,
  famille: 'fichiers',
  type: 'composant',
  rarete: 'commune',
  cout: 1,
  attaque: 1,
  pv: 1,
  capacites: [],
  enVrai: '',
});
const CATALOGUE = [1, 2, 3, 4, 5].map((n) => carte(n, `Carte ${n}`));

describe('Boosters', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [BoostersEcran],
      providers: [
        provideHttpClient(withInterceptors([intercepteurJeton])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  async function afficher(connecte: boolean) {
    const compte = TestBed.inject(CompteService);
    if (connecte) compte.joueur.set({ id: 'x', pseudo: 'Ada' });
    else compte.pret.set(true);
    const fixture = TestBed.createComponent(BoostersEcran);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    // Les chances par booster, en bas de l'écran (US-061) : testées dans chances-booster.spec.ts.
    http.expectOne('/api/v1/raretes').flush([]);
    return { fixture, http, page: fixture.nativeElement as HTMLElement };
  }

  it('invite à créer un compte quand on n’en a pas', async () => {
    const { fixture, page } = await afficher(false);
    await fixture.whenStable();
    expect(page.textContent).toContain('il faut un compte');
    expect(page.querySelector('a[href="/compte"]')).not.toBeNull();
  });

  it('montre le stock et la prochaine recharge, puis révèle les 5 cartes en signalant les nouvelles', async () => {
    const { fixture, http, page } = await afficher(true);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 5, plafond: 10, prochainDans: 125 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('5 boosters en stock');
    expect(page.textContent).toContain('Prochain booster gratuit dans 2 min 5 s');

    page.querySelector<HTMLButtonElement>('button')?.click();
    const ouverture = http.expectOne('/api/v1/moi/boosters/ouvertures');
    expect(ouverture.request.method).toBe('POST');
    ouverture.flush({
      cartes: [
        { numero: 1, nouvelle: true },
        { numero: 2, nouvelle: false },
        { numero: 3, nouvelle: true },
        { numero: 1, nouvelle: false },
        { numero: 5, nouvelle: false },
      ],
      boosters: { stock: 4, plafond: 10, prochainDans: 125 },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Votre booster : 5 cartes, 2 nouvelles');
    expect(page.querySelectorAll('hip-vignette-carte')).toHaveLength(5);
    expect(page.textContent?.match(/Nouvelle !/g)).toHaveLength(2);
    expect(page.textContent).toContain('4 boosters en stock');
  });

  const bouton = (page: HTMLElement, texte: string) =>
    [...page.querySelectorAll('button')].find((b) => b.textContent?.includes(texte));

  it('sans le catalogue, n’ouvre rien : bouton désactivé, raison et « Réessayer » (US-055)', async () => {
    TestBed.inject(CompteService).joueur.set({ id: 'x', pseudo: 'Ada' });
    const fixture = TestBed.createComponent(BoostersEcran);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('/api/v1/cartes')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    http.expectOne('/api/v1/raretes').flush([]);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 5, plafond: 10, prochainDans: 125 });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(bouton(page, 'Ouvrir un booster')?.disabled).toBe(true);
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Les cartes n’ont pas pu être chargées',
    );

    bouton(page, 'Réessayer')?.click();
    TestBed.tick();
    http.expectOne('/api/v1/cartes').flush(CATALOGUE);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(bouton(page, 'Ouvrir un booster')?.disabled).toBe(false);
  });

  it('dit pourquoi le stock n’a pas pu être lu, et le relit quand on réessaie', async () => {
    const { fixture, http, page } = await afficher(true);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush(null, { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Votre stock de boosters n’a pas pu être lu. Le serveur a rencontré un problème',
    );
    expect(page.textContent).not.toContain('Lecture de votre stock');

    bouton(page, 'Réessayer')?.click();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 2, plafond: 10, prochainDans: null });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('2 boosters en stock');
    expect(page.querySelector('[role="alert"]')).toBeNull();
  });

  it('désactive l’ouverture quand le stock est vide', async () => {
    const { fixture, http, page } = await afficher(true);
    fixture.detectChanges();
    http.expectOne('/api/v1/moi/boosters').flush({ stock: 0, plafond: 10, prochainDans: 30 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector<HTMLButtonElement>('button')?.disabled).toBe(true);
    expect(page.textContent).toContain('0 booster en stock');
  });
});
