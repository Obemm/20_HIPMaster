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
