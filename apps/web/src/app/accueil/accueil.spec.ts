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

  it('prévient en mots de joueur quand le serveur ne répond pas, et propose de réessayer', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/raretes').flush(null, { status: 502, statusText: 'Bad Gateway' });
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Les chances par booster n’ont pas pu être chargées. Serveur injoignable pour le moment',
    );
    expect(page.textContent).not.toContain('npm run dev');

    // La ressource relance sa lecture au rendu suivant.
    page.querySelector('button')?.click();
    TestBed.tick();
    http.expectOne('/api/v1/raretes').flush([{ rarete: 'commune', chance: 0.7 }]);
    await fixture.whenStable();
    expect(page.textContent).toContain('70 %');
    expect(page.querySelector('[role="alert"]')).toBeNull();
  });
});
