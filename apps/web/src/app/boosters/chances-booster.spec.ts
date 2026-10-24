import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ChancesBooster, type ChanceRarete } from './chances-booster';

describe('ChancesBooster', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChancesBooster],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('affiche les chances de chaque rareté renvoyées par l’API', async () => {
    const fixture = TestBed.createComponent(ChancesBooster);
    fixture.detectChanges();
    const chances: ChanceRarete[] = [
      { rarete: 'commune', chance: 0.7 },
      { rarete: 'legendaire', chance: 0.01 },
    ];
    TestBed.inject(HttpTestingController).expectOne('/api/v1/raretes').flush(chances);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h2')?.textContent).toBe('Chances par booster');
    expect(page.textContent).toContain('Commune');
    expect(page.textContent).toContain('70 %');
    expect(page.textContent).toContain('★ Légendaire');
    expect(page.textContent).toContain('1 %');
  });

  it('prévient en mots de joueur quand le serveur ne répond pas, et propose de réessayer', async () => {
    const fixture = TestBed.createComponent(ChancesBooster);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/raretes').flush(null, { status: 502, statusText: 'Bad Gateway' });
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Les chances par booster n’ont pas pu être chargées. Serveur injoignable pour le moment',
    );

    // La ressource relance sa lecture au rendu suivant.
    page.querySelector('button')?.click();
    TestBed.tick();
    http.expectOne('/api/v1/raretes').flush([{ rarete: 'commune', chance: 0.7 }]);
    await fixture.whenStable();
    expect(page.textContent).toContain('70 %');
    expect(page.querySelector('[role="alert"]')).toBeNull();
  });
});
