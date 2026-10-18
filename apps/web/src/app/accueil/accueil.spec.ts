import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Accueil, type ChanceRarete } from './accueil';

describe('Accueil', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Accueil],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('affiche le titre du jeu et un lien vers le catalogue', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/raretes').flush([]);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('HIPMaster');
    expect(page.querySelector('a[href="/cartes"]')?.textContent).toContain('catalogue');
  });

  it('affiche les chances de chaque rareté renvoyées par l’API', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    const chances: ChanceRarete[] = [
      { rarete: 'commune', chance: 0.7 },
      { rarete: 'legendaire', chance: 0.01 },
    ];
    TestBed.inject(HttpTestingController).expectOne('/api/v1/raretes').flush(chances);
    await fixture.whenStable();
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Commune');
    expect(texte).toContain('70 %');
    expect(texte).toContain('Légendaire');
    expect(texte).toContain('1 %');
  });

  it('prévient quand l’API ne répond pas', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/raretes')
      .flush(null, { status: 502, statusText: 'Bad Gateway' });
    await fixture.whenStable();
    const alerte = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alerte?.textContent).toContain('L’API ne répond pas');
  });
});
